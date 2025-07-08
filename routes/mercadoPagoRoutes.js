const express = require('express');
const router = express.Router();
const axios = require('axios');
const Turno = require('../models/Turno');
const User = require('../models/User');
const Especialidad = require('../models/Especialidad');
const { crearEventoCalendar } = require('../config/google-calendar.service');

const mpCtrl = require('../controllers/mercadoPagoController');

router.post('/pago', mpCtrl.generarPago);

router.post('/webhook', async (req, res) => {
    try {
        console.log('📩 Webhook recibido:', req.body);

        const paymentId = req.body.data?.id;
        const eventType = req.body.type;

        if (eventType === 'payment') {
            const mpResponse = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                    Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
                }
            });

            const payment = mpResponse.data;
            const status = payment.status;
            const payerEmail = payment.payer?.email;
            const idTurno = payment.metadata?.idTurno;
            const obraSocialNombre = payment.metadata?.obra_social || 'Particular';

            console.log(`🧾 Estado del pago: ${status}, Turno: ${idTurno}, Email: ${payerEmail}`);

            if (status === 'approved' && idTurno) {
                const turno = await Turno.findById(idTurno).populate('medico').populate('especialidad');

                // Verifica que el turno esté disponible
                if (!turno || turno.estado !== 'disponible') {
                    console.log('⚠️ Turno no disponible o ya reservado.');
                    return res.sendStatus(200);
                }

                const paciente = await User.findOne({ email: payerEmail });
                if (!paciente) {
                    console.warn('⚠️ No se encontró paciente con ese email:', payerEmail);
                    return res.sendStatus(200);
                }

                // Fecha y hora para evento Google
                const fechaTurno = new Date(turno.fecha);
                const [h, m] = turno.hora.split(':').map(Number);
                fechaTurno.setHours(h, m, 0, 0);

                const startDateTime = new Date(fechaTurno);
                const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

                const evento = await crearEventoCalendar({
                    summary: `Turno: ${turno.especialidad.nombre} con Dr. ${turno.medico.nombre} ${turno.medico.apellido}`,
                    description: `Paciente: ${paciente.nombre} ${paciente.apellido}\nEmail: ${paciente.email}\nObra Social: ${obraSocialNombre}`,
                    startDateTime: startDateTime.toISOString(),
                    endDateTime: endDateTime.toISOString(),
                    attendees: [{ email: paciente.email }]
                });

                turno.estado = 'ocupado';
                turno.paciente = paciente._id;
                turno.precioPagado = payment.transaction_amount;
                turno.eventoGoogleId = evento.id;
                turno.obraSocial = {
                    nombre: obraSocialNombre,
                    numeroSocio: 'N/A'
                };

                await turno.save();

                console.log(`✅ Turno ${idTurno} reservado automáticamente desde webhook.`);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Error al procesar webhook:', error.response?.data || error.message);
        res.sendStatus(500);
    }
});

module.exports = router;
