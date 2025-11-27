// src/utils/csv.util.js
const csv = require("csv-parser");
const fs = require("fs");

// Parsear un CSV desde su ruta en disco
async function parseCsvFromFile(pathFile) {
  return new Promise((resolve, reject) => {
    const resultados = [];

    fs.createReadStream(pathFile)
      .pipe(csv())
      .on("headers", (headers) => {
        const esperado = ["Nombre,Secuencia"];
        const valid = esperado.every(h => headers.includes(h));

        if (!valid) {
          reject(new Error("El CSV debe tener exactamente las columnas: Nombre, Secuencia"));
        }
      })
      .on("data", (row) => {
        resultados.push({
          nombre: row.Nombre?.trim(),
          secuencia: row.Secuencia?.trim(),
        });
      })
      .on("end", () => resolve(resultados))
      .on("error", reject);
  });
}

module.exports = {
  parseCsvFromFile
};
