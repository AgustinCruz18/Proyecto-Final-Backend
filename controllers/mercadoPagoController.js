const axios = require('axios');
require('dotenv').config();

const Turno = require('../models/Turno');

const mercadoPagoCtrl = {};

mercadoPagoCtrl.generarPago = async (req, res) => {
  try {
    const { idTurno, obra_social, payer_email } = req.body;

    // Determina si la aplicación está en producción o desarrollo para configurar las URLs de retorno
    const frontendBaseUrl = 'http://localhost:4200';

    const descuentosObraSocial = {
      "OSDE": 1,
      "Swiss Medical": 0.998,
      "IOSFA": 0.2,
      "Otra": 0.1,
      "Particular": 0
    };

    const turno = await Turno.findById(idTurno);
    if (!turno) {
      return res.status(400).json({ msg: 'Turno no encontrado.' });
    }

    const precioBase = 5000;
    const descuento = descuentosObraSocial[obra_social] || 0;
    const precioFinal = parseFloat((precioBase * (1 - descuento)).toFixed(2));

    // ✅ Si es 100% cubierto, no genera preferencia de pago
    if (precioFinal === 0) {
      return res.status(200).json({ init_point: null, msg: 'Turno con cobertura total, no se requiere pago' });
    }

    const body = {
      payer_email,
      items: [{
        title: `Reserva de turno médico`,
        description: `Obra social: ${obra_social}`,
        quantity: 1,
        unit_price: precioFinal
      }],
      metadata: {
        idTurno: idTurno
      },
      // Se usan las URLs base dinámicas para los retornos de Mercado Pago
      back_urls: {
        success: "http://localhost:4200/pago/estatus?status=approved",
        failure: "http://localhost:4200/pago/estatus?status=rejected",
        pending: "http://localhost:4200/pago/estatus?status=pending"
      },
      auto_return: "approved"
    };

    const response = await axios.post('https://api.mercadopago.com/checkout/preferences', body, {
      headers: {
        Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('🔑 Token de MP:', process.env.MERCADO_PAGO_ACCESS_TOKEN);

    res.status(200).json({ init_point: response.data.init_point });
  } catch (error) {
    console.error('❌ Error al generar el pago:', error.response?.data || error.message);
    res.status(500).json({ msg: 'Error al generar el pago avanzado' });
  }
};

module.exports = mercadoPagoCtrl;