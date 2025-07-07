//backend-turnos/routes/horarioRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/medicoController');
const { verificarRol } = require('../middleware/roles');

router.post('/', verificarRol(['secretaria']), controller.crear);
router.get('/', controller.obtenerTodos); // público o protegible según el caso

module.exports = router;
