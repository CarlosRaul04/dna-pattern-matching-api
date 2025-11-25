const { loadRegistros } = require("../utils/csv.util");

async function obtenerRegistros() {
    return await loadRegistros();
}

async function ObtenerRegistrosPorNombre(nombre) {
    const registros = await loadRegistros();
    return registros.find( (registro) => registro.nombre.toLowerCase() === nombre.toLowerCase());
}

module.exports = {
    obtenerRegistros,
    ObtenerRegistrosPorNombre
};