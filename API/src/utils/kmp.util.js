// src/utils/kmp.util.js
const { execFile } = require("child_process");
const path = require("path");

// Detectar binario según sistema operativo
const KMP_BIN = process.platform === "win32"
  ? path.join(__dirname, "../../kmp-engine/build/kmp.exe")
  : path.join(__dirname, "../../kmp-engine/build/kmp.exe");

/**
 * Ejecuta el binario C++ pasándole:
 *   1) patrón
 *   2) ruta del CSV
 * 
 * El binario debe devolver un JSON por stdout.
 */
function ejecutarKmpConCsv(patron, csvPath) {
  return new Promise((resolve, reject) => {
    execFile(
      KMP_BIN,
      [patron, csvPath],
      { maxBuffer: 20 * 1024 * 1024 }, // 20MB por seguridad
      (err, stdout, stderr) => {

        if (err) {
          console.error("⚠ Error al ejecutar el binario KMP:", err);
          return reject(new Error(stderr || err.message));
        }

        try {
          const output = stdout.toString().trim();
          const json = JSON.parse(output);
          resolve(json);
        } catch (jsonErr) {
          console.error("⚠ Error al parsear salida del KMP:", jsonErr);
          console.error("Salida recibida:", stdout.toString());
          reject(new Error("Salida inválida del algoritmo KMP."));
        }
      }
    );
  });
}

module.exports = {
  ejecutarKmpConCsv
};
