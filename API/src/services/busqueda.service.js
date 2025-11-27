// src/services/search.service.js
const path = require("path");
const csvService = require("./csv.service");
const { ejecutarKmpConCsv } = require("../utils/kmp.util");
const searchHistoryService = require("./searchHistory.service");

const searchCache = new Map();
const CACHE_MAX = 100;

async function buscarPatron(patron, userId, useCache = true) {
  const requestStart = Date.now();

  // Normalizar patrón
  patron = String(patron || "").trim().toUpperCase();
  if (!patron) {
    throw new Error('El parámetro "patron" es obligatorio');
  }

  console.log("\n" + "-".repeat(60));
  console.log(`Nueva búsqueda: "${patron}"`);
  console.log("-".repeat(60));


  // 1) USAR CACHE SI EXISTE
  if (useCache && searchCache.has(patron)) {
    const cached = searchCache.get(patron);
    console.log(`Resultado obtenido desde caché en ${Date.now() - requestStart}ms`);
    console.log("-".repeat(60) + "\n");
    return cached;
  }

  // 2) OBTENER CSV ACTIVO
  const activeCsv = csvService.getActiveCsv();
  if (!activeCsv) {
    throw new Error("No hay un CSV activo seleccionado.");
  }

  const csvPath = path.join(__dirname, "../../uploads/csv", activeCsv);
  console.log(`CSV activo: ${activeCsv}`);
  console.log(`Ruta del archivo: ${csvPath}`);

  // 3) EJECUTAR BINARIO C++
  const searchStart = Date.now();

  const resultadoCpp = await ejecutarKmpConCsv(patron, csvPath);

  const searchDuration = Date.now() - searchStart;
  console.log(`🔍 Búsqueda KMP completada por el binario en ${searchDuration}ms`);


  const resultado = {
    patron,
    total: resultadoCpp.total || 0,
    nombres: resultadoCpp.sospechosos || [],
    tiempoTotal: Date.now() - requestStart,
    archivo: activeCsv
  };

  // GUARDAR HISTORIAL EN BD
  try {
    await searchHistoryService.crearHistorial({
      userId,
      patron: resultado.patron,
      resultados: resultado.nombres,
      totalCoincidencias: resultado.total,
      archivoCsv: resultado.archivo,
      duracionMs: resultado.tiempoTotal
    });
    console.log("Historial de búsqueda guardado en la base de datos");
  } catch (error) {
    console.error("Error guardando historial:", error.message);
  }

  // 4) GUARDAR EN CACHE
  searchCache.set(patron, resultado);

  if (searchCache.size > CACHE_MAX) {
    const firstKey = searchCache.keys().next().value;
    searchCache.delete(firstKey);
    console.log(`Caché purgado (nuevo tamaño: ${searchCache.size})`);
  }

  console.log(`Tiempo total del request: ${resultado.tiempoTotal}ms`);
  console.log("-".repeat(60) + "\n");

  return resultado;
}

module.exports = {
  buscarPatron
};
