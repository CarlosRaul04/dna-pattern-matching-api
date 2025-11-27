// src/services/searchHistory.service.js
const SearchHistory = require("../models/SearchHistory");

class SearchHistoryService {

  // Crear historial
  async crearHistorial(data) {
    return await SearchHistory.create(data);
  }

  // Listar historial por usuario con paginación
  async listarHistorial(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [historial, total] = await Promise.all([
      SearchHistory.find({ userId })
        .sort({ fecha: -1 })
        .skip(skip)
        .limit(limit),
      SearchHistory.countDocuments({ userId })
    ]);

    return {
      total,
      paginaActual: page,
      totalPaginas: Math.ceil(total / limit),
      resultados: historial
    };
  }

  // Ver un registro específico
  async verHistorial(id, userId) {
    const historial = await SearchHistory.findOne({ _id: id, userId });

    if (!historial) {
      throw new Error("Historial no encontrado");
    }

    return historial;
  }
}

module.exports = new SearchHistoryService();
