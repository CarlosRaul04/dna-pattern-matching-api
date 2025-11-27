// src/controllers/search.controller.js
const searchService = require("../services/busqueda.service");

async function buscarPatron(req, res) {
  try {
    const { patron, useCache = true } = req.body;

    if (!patron) {
      return res.status(400).json({ error: 'El campo "patron" es obligatorio.' });
    }

    const resultado = await searchService.buscarPatron(patron, useCache);

    return res.json(resultado);

  } catch (error) {
    console.error(" Error en búsqueda:", error.message);
    return res.status(400).json({ error: error.message });
  }
}

module.exports = {
  buscarPatron
};
