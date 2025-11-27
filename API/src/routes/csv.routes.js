// src/routes/csv.routes.js
const express = require("express");
const router = express.Router();

const uploadCsv = require("../middleware/uploadCsv");
const CsvController = require("../controllers/csv.controller");

// subir csv
router.post("/upload", uploadCsv, CsvController.uploadCsv);

// registros cargados en memoria
router.get("/registros", CsvController.getRegistros);

// listar archivos en uploads/csv
router.get("/list", CsvController.listarCsvs);

// ver csv activo
router.get("/active", CsvController.getActiveCsv);

// definir csv activo
router.post("/set-active/:filename", CsvController.setActiveCsv);

module.exports = router;
