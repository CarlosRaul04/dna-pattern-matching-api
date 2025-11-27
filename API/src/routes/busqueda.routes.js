const router = require('express').Router();
const busquedaController = require('../controllers/busqueda.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Búsqueda de patrones: se usa POST para permitir body JSON
router.post('/', authMiddleware, busquedaController.buscarPatron);

module.exports = router;
