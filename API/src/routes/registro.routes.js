const router = require('express').Router();
const registroController = require('../controllers/registro.controller');

router.get('/', registroController.getRegistros);
router.get('/:nombre', registroController.getRegistroPorNombre);

module.exports = router;