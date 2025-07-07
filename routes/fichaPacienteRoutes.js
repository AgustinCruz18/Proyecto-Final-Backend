//backend-turnos/routes/fichaPacienteRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/fichaPacienteController');

router.get('/:userId', controller.getFicha);
router.post('/', controller.createOrUpdateFicha);
router.get('/completo/:id', controller.getFichaCompleta);
router.get('/secretaria/todas', controller.getFichasParaSecretaria);
router.put('/autorizar/:id', controller.autorizarFicha);
router.put('/desautorizar/:id', controller.desautorizarFicha);

module.exports = router;
