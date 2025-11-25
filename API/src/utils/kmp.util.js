const path = require('path');
const { execFile } = require('child_process');

// Detectar el ejecutable según OS
// (Windows usa .exe, Linux/Mac no)
const KMP_BIN = process.platform === 'win32'
  ? path.join(__dirname, '../..', 'kmp-engine', 'build', 'kmp_search.exe')
  : path.join(__dirname, '../..', 'kmp-engine', 'build', 'kmp_search');

/**
 * Ejecuta el algoritmo KMP usando el binario en C++.
 * Retorna el índice encontrado o -1.
 */
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

/**
 * Ejecuta búsquedas en paralelo controlando la concurrencia.
 * Cada registro debe ser { nombre, secuencia }.
 */
async function busquedaParalela(patron, registros, concurrencia = 50) {
  const startTime = Date.now();
  const total = registros.length;

  console.log(`🔍 Iniciando búsqueda paralela con concurrencia: ${concurrencia}`);
  console.log(`📊 Total de secuencias: ${total}`);

  const resultados = [];
  let procesados = 0;
  let ultimoReporte = 0;

  for (let i = 0; i < registros.length; i += concurrencia) {
    const lote = registros.slice(i, i + concurrencia);

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

    const progresoActual = Math.floor((procesados / total) * 10);
    if (progresoActual > ultimoReporte || procesados === total) {
      const porcentaje = ((procesados / total) * 100).toFixed(1);
      const tiempo = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`⏳ Progreso: ${procesados}/${total} (${porcentaje}%) - ${tiempo}s`);
      ultimoReporte = progresoActual;
    }
  }

  const duration = Date.now() - startTime;
  const encontrados = resultados.filter(r => r.encontrado && !r.error).map(r => r.nombre);
  const errores = resultados.filter(r => r.error).length;

  const nombresUnicos = new Set(encontrados);
  const duplicados = encontrados.length - nombresUnicos.size;

  console.log(`✅ Búsqueda completada en ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
  console.log(`🎯 Coincidencias: ${encontrados.length}/${total}`);
  if (duplicados > 0)
    console.warn(`⚠️ ${duplicados} duplicados detectados`);
  if (errores > 0)
    console.warn(`⚠️ ${errores} errores en las búsquedas`);
  console.log(`⚡ Velocidad: ${(total / (duration / 1000)).toFixed(2)} búsquedas/seg`);

  return [...nombresUnicos];
}

module.exports = {
  busquedaKMP,
  busquedaParalela
};
