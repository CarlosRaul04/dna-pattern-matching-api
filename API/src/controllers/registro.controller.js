const registroService = require('../services/registro.service');

async function getRegistros(req, res) {
    try {
        const registros = await registroService.obtenerRegistros();
        if (registros.length === 0) {
            return res.status(404).json({ message: 'No se encontraron registros.' });
        }
        res.json(registros)
    } catch (error) {
        res.status(500).json({
            message: 'Error en la búsqueda de registros',
            error: error.message
        });
    }
}

async function getRegistroPorNombre(req, res) {
    try {

        const nombre = req.params.nombre;
        const registro  = await registroService.ObtenerRegistrosPorNombre(nombre);
        if (!registro) {
            return res.status(404).json({ message: 'Registro no encontrado.' });
        }
        res.json(registro);

    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener el registro por nombre',
            error: error.message
        })
    }
}

module.exports = {
    getRegistros,
    getRegistroPorNombre
}