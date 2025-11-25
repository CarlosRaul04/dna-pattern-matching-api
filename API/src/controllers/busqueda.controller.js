const busquedaService = require('../services/busqueda.service');

async function buscarPatron(req, res) {
    try{
        const patron = req.query.patron;
        const concurrencia = parseInt(req.query.concurrencia) || 100; 
        
        if(!patron) {
            res.status(400).json({
                message: 'Patrón es obligatorio'
            });
        }

        const result = await busquedaService.buscarPatron(patron, concurrencia);
        res.json(result);

    } catch (error) {
        res.status(500).json({
            message: 'Error en la búsqueda del patrón',
            error: error.message
        });
    }
}

module.exports = {
    buscarPatron
}