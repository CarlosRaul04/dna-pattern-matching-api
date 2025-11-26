// src/workers/kmp.worker.js
const { parentPort } = require('worker_threads');
const { execFile } = require('child_process');
const path = require('path');

// Detectar ejecutable de KMP (igual que antes)
const KMP_BIN = process.platform === 'win32'
  ? path.join(__dirname, '../../kmp-engine/build/kmp_search.exe')
  : path.join(__dirname, '../../kmp-engine/build/kmp_search');

// Función interna para ejecutar el binario C++
function runKMP(pattern, sequence) {
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

// Escuchar tareas del pool
parentPort.on('message', async ({ patron, secuencia }) => {
  try {
    const idx = await runKMP(patron, secuencia);
    parentPort.postMessage({ success: true, idx });
  } catch (error) {
    parentPort.postMessage({ success: false, error: String(error) });
  }
});
