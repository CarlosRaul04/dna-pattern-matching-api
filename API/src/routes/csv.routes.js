// src/routes/csv.routes.js
const express = require("express");
const router = express.Router();

const uploadCsv = require("../middleware/uploadCsv");
const CsvController = require("../controllers/csv.controller");
const authMiddleware = require('../middleware/auth.middleware');


// subir csv
router.post("/upload", authMiddleware, uploadCsv, CsvController.uploadCsv);

// registros cargados en memoria
router.get("/registros", authMiddleware, CsvController.getRegistros);

// listar archivos en uploads/csv
router.get("/list", authMiddleware, CsvController.listarCsvs);

// ver csv activo
router.get("/active", authMiddleware, CsvController.getActiveCsv);

// definir csv activo
router.post("/set-active/:filename", authMiddleware, CsvController.setActiveCsv);

module.exports = router;
