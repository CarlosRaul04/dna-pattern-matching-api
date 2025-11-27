// src/services/csv.service.js
const fs = require("fs");
const path = require("path");
const { parseCsvFromFile } = require("../utils/csv.util");

const UPLOAD_DIR = path.join(__dirname, "../../uploads/csv");
const ACTIVE_FILE_PATH = path.join(UPLOAD_DIR, "active.json");

// Memoria temporal (para enviar al C++)
let registrosCache = null;

class CsvService {
  constructor() {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    // Crear active.json si no existe
    if (!fs.existsSync(ACTIVE_FILE_PATH)) {
      fs.writeFileSync(ACTIVE_FILE_PATH, JSON.stringify({ active: null }));
    }

    const active = this.getActiveCsv();
    const full = path.join(UPLOAD_DIR, active || "");
    if (active && fs.existsSync(full)) {
      parseCsvFromFile(full)
        .then((r) => {
          registrosCache = r;
        })
        .catch(() => {
          registrosCache = null;
        });
    }
  }

  // -------------------------------------
  // 1) Procesar CSV recién subido
  // -------------------------------------
  async procesarCsv(fullPath, filename) {
    const registros = await parseCsvFromFile(fullPath);

    if (!registros.length) {
      throw new Error("El CSV está vacío o no tiene registros válidos.");
    }

    // Guardar en memoria (para el C++)
    registrosCache = await registros;

    this.setActiveCsv(filename);

    return {
      filename,
      cantidad: registros.length,
      mensaje: "CSV cargado correctamente",
    };
  }

  // -------------------------------------
  // 2) Obtener registros en memoria
  // -------------------------------------
  obtenerRegistros() {
    if (!registrosCache) {
      throw new Error("No hay un CSV cargado en memoria.");
    }

    return registrosCache;
  }

  // -------------------------------------
  // 3) Listar CSV almacenados en uploads/csv
  // -------------------------------------
  listarCsvs() {
    const archivos = fs
      .readdirSync(UPLOAD_DIR)
      .filter((f) => f.toLowerCase().endsWith(".csv"));

    return archivos;
  }

  // -------------------------------------
  // 4) Obtener el CSV activo
  // -------------------------------------
  getActiveCsv() {
    const data = JSON.parse(fs.readFileSync(ACTIVE_FILE_PATH, "utf8"));
    return data.active;
  }

  // -------------------------------------
  // 5) Establecer CSV activo
  // -------------------------------------
  async setActiveCsv(filename) {
    const archivos = this.listarCsvs();
    if (!archivos.includes(filename))
      throw new Error("El archivo no existe en uploads/csv.");

    const fullPath = path.join(UPLOAD_DIR, filename);
    registrosCache = await parseCsvFromFile(fullPath); // aquí llenas el caché

    fs.writeFileSync(
      ACTIVE_FILE_PATH,
      JSON.stringify({ active: filename }, null, 2)
    );
    return { active: filename };
  }
}

module.exports = new CsvService();
