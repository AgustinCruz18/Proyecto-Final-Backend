//backend-turnos/routes/turnoRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/turnoController');
const { verificarRol } = require('../middleware/roles');
const turnoController = require('../controllers/turnoController');

router.get('/', controller.obtenerTodos);
router.post('/', verificarRol(['secretaria']), controller.crear);
router.get('/medico/:id', controller.obtenerDisponiblesPorMedico);
router.put('/reservar/:id', verificarRol(['paciente']), controller.reservar);
router.put('/:id', verificarRol(['secretaria']), controller.actualizar);
router.delete('/:id', verificarRol(['secretaria']), controller.eliminar);
router.post('/reservar', controller.reservarTurnoDirecto);
router.get('/paciente/:idPaciente', controller.obtenerPorPaciente);
router.post('/reservar-directo', verificarRol(['paciente']), controller.reservarTurnoDirecto);

module.exports = router;
