// backend-turnos/routes/especialidadRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/especialidadController');
const { verificarRol } = require('../middleware/roles');

router.post('/', verificarRol(['administrador']), controller.crear);
router.get('/', controller.obtenerTodas);
router.delete('/:id', verificarRol(['administrador']), controller.eliminar);

module.exports = router;
