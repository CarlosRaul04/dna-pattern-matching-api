// src/controllers/csv.controller.js
const csvService = require("../services/csv.service");

class CsvController {

  // Subir CSV
  uploadCsv = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Debe enviar un archivo CSV." });
      }

      const fullPath = req.file.path;
      const filename = req.file.filename;

      const resultado = await csvService.procesarCsv(fullPath, filename);

      res.json(resultado);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Obtener registros cargados en memoria
  getRegistros = async (req, res) => {
    try {
      const data = await csvService.obtenerRegistros();
      res.json({ registros: data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Listar archivos CSV subidos
  listarCsvs = async (req, res) => {
    try {
      const archivos = await csvService.listarCsvs();
      res.json({ archivos });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Ver el CSV activo
  getActiveCsv = async (req, res) => {
    try {
      const active = await csvService.getActiveCsv();
      res.json({ active });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Definir CSV activo
  setActiveCsv = async (req, res) => {
    try {
      const { filename } = req.params;
      const data = await csvService.setActiveCsv(filename);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}

module.exports = new CsvController();
