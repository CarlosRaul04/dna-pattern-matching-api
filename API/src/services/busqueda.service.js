const { loadRegistros } = require('../utils/csv.util');
const { busquedaParalela } = require('../utils/kmp.util');

const searchCache = new Map();
const CACHE_MAX = 100;

async function buscarPatron(patron, useCache = true) {
  const requestStart = Date.now();

  // Normalización del patrón
  patron = String(patron || '').trim().toUpperCase();
  if (!patron) {
    throw new Error('El parámetro "patron" es obligatorio');
  }

  console.log('\n' + '-'.repeat(60));
  console.log(`Nueva búsqueda: "${patron}"`);
  console.log('-'.repeat(60));

  // Uso de caché si está habilitado
  if (useCache && searchCache.has(patron)) {
    const cached = searchCache.get(patron);
    const cacheTime = Date.now() - requestStart;
    console.log(`Resultado obtenido desde caché en ${cacheTime}ms`);
    console.log('-'.repeat(60) + '\n');
    return cached;
  }

  // Medir tiempo de carga del CSV
  const loadStart = Date.now();
  const registros = await loadRegistros();
  const loadDuration = Date.now() - loadStart;

  console.log(`Registros cargados en ${loadDuration}ms (total: ${registros.length})`);
  //console.log(`Concurrencia usada para búsqueda: ${concurrencia}`);

  // Búsqueda paralela con medición de tiempo
  const searchStart = Date.now();
  const nombres = await busquedaParalela(patron, registros);
  const searchDuration = Date.now() - searchStart;

  console.log(`Búsqueda KMP completada en ${searchDuration}ms`);
  console.log(`Coincidencias encontradas: ${nombres.length}`);

  // Resultado final
  const resultado = {
    patron,
    total: nombres.length,
    nombres,
    tiempoTotal: Date.now() - requestStart,
    registrosProcesados: registros.length
  };

  // Guardar en caché
  searchCache.set(patron, resultado);

  // Limitar tamaño del caché
  if (searchCache.size > CACHE_MAX) {
    const firstKey = searchCache.keys().next().value;
    searchCache.delete(firstKey);
    console.log(`Caché purgado (nuevo tamaño: ${searchCache.size})`);
  }

  console.log(`Tiempo total del request: ${resultado.tiempoTotal}ms`);
  console.log('-'.repeat(60) + '\n');

  return resultado;
}

module.exports = {
  buscarPatron
};
