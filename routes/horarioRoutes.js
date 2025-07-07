//backend-turnos/routes/horarioRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/horarioController');
const { verificarRol } = require('../middleware/roles');

router.post('/', verificarRol(['secretaria']), controller.crear);
router.get('/:id', controller.obtenerPorMedico);

module.exports = router;
