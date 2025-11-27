// src/middlewares/uploadCsv.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Carpeta donde se guardarán los CSV
const UPLOAD_DIR = path.join(__dirname, "../../uploads/csv");

// Crear carpeta si no existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configuración de multer para guardar en DISCO
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const unique = Date.now(); // nombre único
    cb(null, `${unique}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith(".csv")) {
      return cb(new Error("El archivo debe ser un CSV válido."));
    }
    cb(null, true);
  }
});

module.exports = upload.single("file");
