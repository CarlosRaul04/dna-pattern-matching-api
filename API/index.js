const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { execFile } = require('child_process');
const os = require('os');

const app = express();

// Configurar CORS para permitir peticiones desde el frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Ruta CSV 
const CSV_PATH = path.join(__dirname, 'data', 'DataSet(in).csv');

// Ruta binario KMP 
const KMP_BIN = process.platform === 'win32'
  ? path.join(__dirname, 'backend', 'build', 'kmp_search.exe')
  : path.join(__dirname, 'backend', 'build', 'kmp_search');

// Caché de resultados de búsqueda (patrón -> resultados)
const searchCache = new Map();
const CACHE_MAX_SIZE = 100;

// Caché de registros CSV (para no leer el archivo cada vez)
let registrosCache = null;
let registrosCacheTime = 0;
const CACHE_DURATION = 60000; // 1 minuto

// Lee el CSV y devuelve un array de registros { nombre, secuencia }
// Con caché para evitar leer el archivo múltiples veces
async function loadRegistros() {
  const now = Date.now();
  
  // Si tenemos caché válido, usarlo
  if (registrosCache && (now - registrosCacheTime) < CACHE_DURATION) {
    console.log('📦 Usando caché de registros');
    return registrosCache;
  }

  console.log('📂 Leyendo CSV desde disco...');
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const out = [];
    fs.createReadStream(CSV_PATH)
      .pipe(csv({
        separator: ',',
        mapHeaders: ({ header }) => header.trim(),
        mapValues:  ({ value })  => String(value ?? '').trim()
      }))
      .on('data', (row) => {
        out.push({
          nombre: row['Nombre'] ?? '',
          secuencia: row['Secuencia'] ?? ''
        });
      })
      .on('end', () => {
        registrosCache = out;
        registrosCacheTime = Date.now();
        const duration = Date.now() - startTime;
        
        // Verificar duplicados en el CSV
        const nombresUnicos = new Set(out.map(r => r.nombre));
        const duplicados = out.length - nombresUnicos.size;
        
        console.log(`✅ CSV cargado: ${out.length} registros en ${duration}ms`);
        if (duplicados > 0) {
          console.warn(`⚠️  ADVERTENCIA: El CSV contiene ${duplicados} nombres duplicados`);
          console.warn(`⚠️  Total registros: ${out.length}, nombres únicos: ${nombresUnicos.size}`);
        }
        
        resolve(out);
      })
      .on('error', reject);
  });
}

// Búsqueda KMP individual
function busquedaKMP(pattern, sequence) {
  return new Promise((resolve, reject) => {
    execFile(
      KMP_BIN,
      [pattern, sequence],
      { maxBuffer: 10 * 1024 * 1024 }, 
      (err, stdout, stderr) => {
        if (err) return reject(stderr || err.message);
        const idx = parseInt(String(stdout).trim(), 10);
        resolve(Number.isNaN(idx) ? -1 : idx);
      }
    );
  });
}

// Procesar búsquedas en lotes paralelos para mayor velocidad
async function busquedaParalela(patron, registros, concurrencia = 50) {
  const startTime = Date.now();
  const total = registros.length;
  console.log(`🔍 Iniciando búsqueda paralela con concurrencia: ${concurrencia}`);
  console.log(`📊 Total de secuencias a procesar: ${total}`);
  
  const resultados = [];
  let procesados = 0;
  let ultimoReporte = 0;

  // Procesar en lotes para controlar la concurrencia
  for (let i = 0; i < registros.length; i += concurrencia) {
    const lote = registros.slice(i, i + concurrencia);
    
    // Ejecutar búsquedas del lote en paralelo con Promise.allSettled para no fallar si una falla
    const promesas = lote.map(async (r) => {
      try {
        const idx = await busquedaKMP(patron, r.secuencia.toUpperCase());
        return { nombre: r.nombre, encontrado: idx >= 0, error: false };
      } catch (error) {
        console.error(`❌ Error en ${r.nombre}:`, error.message);
        return { nombre: r.nombre, encontrado: false, error: true };
      }
    });

    const resultadosLote = await Promise.all(promesas);
    resultados.push(...resultadosLote);
    
    procesados += lote.length;
    
    // Reportar progreso cada 10% o al final
    const progresoActual = Math.floor((procesados / total) * 10);
    if (progresoActual > ultimoReporte || procesados === total) {
      const progresoPorcentaje = ((procesados / total) * 100).toFixed(1);
      const tiempoTranscurrido = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`⏳ Progreso: ${procesados}/${total} (${progresoPorcentaje}%) - ${tiempoTranscurrido}s`);
      ultimoReporte = progresoActual;
    }
  }

  const duration = Date.now() - startTime;
  const nombresEncontrados = resultados.filter(r => r.encontrado && !r.error).map(r => r.nombre);
  const errores = resultados.filter(r => r.error).length;
  
  // Verificar duplicados
  const nombresUnicos = new Set(nombresEncontrados);
  const duplicados = nombresEncontrados.length - nombresUnicos.size;
  
  console.log(`✅ Búsqueda completada en ${duration}ms (${(duration/1000).toFixed(2)}s)`);
  console.log(`📊 Resultados: ${nombresEncontrados.length}/${total} coincidencias`);
  if (duplicados > 0) {
    console.warn(`⚠️  ADVERTENCIA: ${duplicados} nombres duplicados detectados en los resultados`);
    console.warn(`⚠️  Total con duplicados: ${nombresEncontrados.length}, únicos: ${nombresUnicos.size}`);
  }
  if (errores > 0) {
    console.log(`⚠️  Errores: ${errores} búsquedas fallidas`);
  }
  console.log(`⚡ Velocidad: ${(total / (duration / 1000)).toFixed(2)} búsquedas/segundo`);
  
  // Devolver solo nombres únicos para evitar duplicados
  return [...nombresUnicos];
}

app.get('/', (_req, res) => res.send('API de Busueda de secuencias'));

app.get('/api/secuencias', async (_req, res) => {
  try {
    const registros = await loadRegistros();
    res.json(registros);
  } catch (e) {
    console.error(e);
    res.status(500).send('Error al leer el CSV');
  }
});

app.get('/api/secuencias/:nombre', async (req, res) => {
  try {
    const buscado = String(req.params.nombre || '').toLowerCase();
    const registros = await loadRegistros();
    const fila = registros.find(r => r.nombre.toLowerCase() === buscado);
    if (!fila) return res.status(404).send('No encontrado');
    res.json(fila);
  } catch (e) {
    console.error(e);
    res.status(500).send('Error al leer el CSV');
  }
});


// Devuelve solo los nombres de personas cuya Secuencia contiene el patrón
app.get('/api/buscar', async (req, res) => {
  const requestStartTime = Date.now();
  
  try {
    let patron = String(req.query.patron || '').trim();
    if (!patron) return res.status(400).json({ error: 'Parámetro "patron" es obligatorio' });
   
    patron = patron.toUpperCase();
    console.log('\n' + '='.repeat(60));
    console.log(`🔎 Nueva búsqueda: "${patron}"`);
    console.log('='.repeat(60));

    // Verificar caché (deshabilitado temporalmente para debugging)
    const usarCache = req.query.cache !== 'false';
    if (usarCache && searchCache.has(patron)) {
      const cached = searchCache.get(patron);
      const cacheTime = Date.now() - requestStartTime;
      console.log(`⚡ Resultado desde caché en ${cacheTime}ms`);
      console.log('='.repeat(60) + '\n');
      return res.json(cached);
    }

    // Cargar registros (con caché)
    const loadStart = Date.now();
    const registros = await loadRegistros();
    const loadDuration = Date.now() - loadStart;
    console.log(`📊 Registros cargados en ${loadDuration}ms`);

    // Búsqueda paralela optimizada
    const concurrencia = parseInt(req.query.concurrencia) || 500; // Máxima concurrencia
    const nombres = await busquedaParalela(patron, registros, concurrencia);

    const resultado = {
      patron,
      total: nombres.length,
      nombres,
      tiempoTotal: Date.now() - requestStartTime,
      registrosProcesados: registros.length
    };

    // Guardar en caché
    searchCache.set(patron, resultado);
    
    // Limitar tamaño del caché
    if (searchCache.size > CACHE_MAX_SIZE) {
      const firstKey = searchCache.keys().next().value;
      searchCache.delete(firstKey);
      console.log(`🗑️  Caché limpiado (tamaño: ${searchCache.size})`);
    }

    console.log(`⏱️  Tiempo total de request: ${resultado.tiempoTotal}ms`);
    console.log('='.repeat(60) + '\n');

    res.json(resultado);
  } catch (e) {
    console.error('❌ Error en búsqueda:', e);
    res.status(500).json({ error: 'Error en búsqueda', detalle: String(e) });
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Escuchando en el puerto ${port}...`));
