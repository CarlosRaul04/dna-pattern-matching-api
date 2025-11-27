// src/controllers/searchHistory.controller.js
const service = require("../services/searchHistory.service");

async function crearHistorial(req, res) {
  try {
    const userId = req.user.id;

    const {
      patron,
      resultados,
      totalCoincidencias,
      archivoCsv,
      duracionMs
    } = req.body;

    const historial = await service.crearHistorial({
      userId,
      patron,
      resultados,
      totalCoincidencias,
      archivoCsv,
      duracionMs
    });

    res.status(201).json(historial);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function listarHistorial(req, res) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const data = await service.listarHistorial(
      userId,
      Number(page),
      Number(limit)
    );

    res.json(data);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function verHistorial(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const historial = await service.verHistorial(id, userId);

    res.json(historial);

  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

module.exports = {
  crearHistorial,
  listarHistorial,
  verHistorial
};
