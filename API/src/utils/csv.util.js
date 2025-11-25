const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Ruta del CSV
const CSV_PATH = path.join(__dirname, '../..', 'data', 'DataSet(in).csv');

// Caché para no leer el archivo a cada rato
let registrosCache = null;
let registrosCacheTime = 0;
const CACHE_DURATION = 60000; // 1 minuto

/**
 * Lee el CSV y devuelve un array de registros { nombre, secuencia }
 * Usa caché para mejorar el rendimiento
 */
async function loadRegistros() {
  const now = Date.now();

  // Si la caché todavía es válida, úsala
  if (registrosCache && (now - registrosCacheTime) < CACHE_DURATION) {
    console.log('Usando caché de registros');
    return registrosCache;
  }

  console.log('Leyendo CSV desde disco...');
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const out = [];

    fs.createReadStream(CSV_PATH)
      .pipe(csv({
        separator: ',',
        mapHeaders: ({ header }) => header.trim(),
        mapValues: ({ value }) => String(value ?? '').trim()
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

        // Detectar duplicados
        const nombresUnicos = new Set(out.map(r => r.nombre));
        const duplicados = out.length - nombresUnicos.size;

        console.log(`CSV cargado: ${out.length} registros en ${duration}ms`);
        if (duplicados > 0) {
          console.warn(`El CSV contiene ${duplicados} nombres duplicados`);
        }

        resolve(out);
      })
      .on('error', reject);
  });
}

module.exports = {
  loadRegistros
};
