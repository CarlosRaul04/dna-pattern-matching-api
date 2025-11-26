// src/utils/kmp.util.js
const pool = require('../workers/kmp.pool');

// Ejecuta KMP usando el Worker Pool
function busquedaKMP(patron, secuencia) {
  return pool.runTask(patron, secuencia);
}

// async function busquedaParalela(patron, registros, concurrencia = 200) {
//   const startTime = Date.now();
//   const total = registros.length;

//   console.log(`Iniciando búsqueda paralela con concurrencia: ${concurrencia}`);
//   console.log(`Total de secuencias: ${total}`);

//   const resultados = [];
//   let procesados = 0;
//   let ultimoReporte = 0;

//   for (let i = 0; i < registros.length; i += concurrencia) {
//     const lote = registros.slice(i, i + concurrencia);

//     const promesas = lote.map(async (r) => {
//       try {
//         const idx = await busquedaKMP(patron, r.secuencia.toUpperCase());
//         return { nombre: r.nombre, encontrado: idx >= 0, error: false };
//       } catch (error) {
//         return { nombre: r.nombre, encontrado: false, error: true };
//       }
//     });

//     const resultadosLote = await Promise.all(promesas);
//     resultados.push(...resultadosLote);

//     procesados += lote.length;

//     const progresoActual = Math.floor((procesados / total) * 10);
//     if (progresoActual > ultimoReporte || procesados === total) {
//       const porcentaje = ((procesados / total) * 100).toFixed(1);
//       const tiempo = ((Date.now() - startTime) / 1000).toFixed(1);
//       console.log(`Progreso: ${procesados}/${total} (${porcentaje}%) - ${tiempo}s`);
//       ultimoReporte = progresoActual;
//     }
//   }

//   const duration = Date.now() - startTime;

//   const encontrados = resultados.filter(r => r.encontrado && !r.error).map(r => r.nombre);
//   const errores = resultados.filter(r => r.error).length;

//   const nombresUnicos = new Set(encontrados);
//   const duplicados = encontrados.length - nombresUnicos.size;

//   console.log(`✅ Búsqueda completada en ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
//   console.log(`Coincidencias: ${encontrados.length}/${total}`);
//   if (duplicados > 0) console.warn(`⚠️ ${duplicados} duplicados detectados`);
//   if (errores > 0) console.warn(`⚠️ ${errores} errores`);

//   console.log(`⚡ Velocidad: ${(total / (duration / 1000)).toFixed(2)} búsquedas/seg`);

//   return [...nombresUnicos];
// }

async function busquedaParalela(patron, registros) {
  const startTime = Date.now();
  const total = registros.length;

  console.log(`Ejecutando búsqueda para ${total} secuencias`);

  const promesas = registros.map(async (r) => {
    try {
      const idx = await busquedaKMP(patron, r.secuencia.toUpperCase());
      return { nombre: r.nombre, encontrado: idx >= 0, error: false };
    } catch {
      return { nombre: r.nombre, encontrado: false, error: true };
    }
  });

  const resultados = await Promise.all(promesas);

  const duration = Date.now() - startTime;

  const encontrados = resultados.filter(r => r.encontrado).map(r => r.nombre);
  const errores = resultados.filter(r => r.error).length;

  console.log(`✅ Completado en ${duration}ms`);
  console.log(`Coincidencias: ${encontrados.length}/${total}`);

  return [...new Set(encontrados)];
}


module.exports = {
  busquedaKMP,
  busquedaParalela
};
