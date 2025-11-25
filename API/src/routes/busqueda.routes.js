const router = require('express').Router();
const busquedaController = require('../controllers/busqueda.controller');

router.get('/', busquedaController.buscarPatron);

module.exports = router;