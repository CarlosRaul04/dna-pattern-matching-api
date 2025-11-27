const router = require('express').Router();
const busquedaController = require('../controllers/busqueda.controller');

// Búsqueda de patrones: se usa POST para permitir body JSON
router.post('/', busquedaController.buscarPatron);

module.exports = router;
