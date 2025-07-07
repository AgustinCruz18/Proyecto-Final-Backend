//backend-turnos/routes/mercadoPagoRoutes.js
const express = require('express');
const router = express.Router();
const mpCtrl = require('../controllers/mercadoPagoController');
const axios = require('axios');

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

            console.log(`🧾 Estado del pago: ${status}, Turno: ${idTurno}, Email: ${payerEmail}`);

            if (status === 'approved' && idTurno) {
                // Buscar y reservar el turno automáticamente
                const Turno = require('../models/Turno');
                const turno = await Turno.findById(idTurno);

                if (turno && turno.estado === 'disponible') {
                    turno.estado = 'ocupado';
                    turno.precioPagado = payment.transaction_amount;
                    await turno.save();

                    console.log(`✅ Turno ${idTurno} reservado automáticamente desde webhook.`);
                }
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Error al procesar webhook:', error.response?.data || error.message);
        res.sendStatus(500);
    }
});
module.exports = router;
