const axios = require('axios');
require('dotenv').config();

const Turno = require('../models/Turno');

const mercadoPagoCtrl = {};

mercadoPagoCtrl.generarPago = async (req, res) => {
  try {
    const { idTurno, obra_social, payer_email } = req.body;

    // ✅ URL del frontend desde variable de entorno (Render)
    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

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
      return res.status(200).json({
        init_point: null,
        msg: 'Turno con cobertura total, no se requiere pago'
      });
    }

    // ✅ Log útil para debug
    console.log('🧾 Generando preferencia con:', {
      payer_email,
      precioFinal,
      obra_social,
      idTurno,
      frontendBaseUrl
    });

    const body = {
      payer_email,
      items: [{
        title: `Reserva de turno médico`,
        description: `Obra social: ${obra_social}`,
        quantity: 1,
        unit_price: precioFinal
      }],
      metadata: {
        idTurno
      },
      back_urls: {
        success: `${frontendBaseUrl}/pago/estatus?status=approved`,
        failure: `${frontendBaseUrl}/pago/estatus?status=rejected`,
        pending: `${frontendBaseUrl}/pago/estatus?status=pending`
      },
      auto_return: "approved"
    };

    const response = await axios.post('https://api.mercadopago.com/checkout/preferences', body, {
      headers: {
        Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Preferencia creada con éxito:', response.data.init_point);

    res.status(200).json({ init_point: response.data.init_point });
  } catch (error) {
    console.error('❌ Error al generar el pago:', error.response?.data || error.message, error.stack);
    res.status(500).json({
      msg: 'Error al generar el pago avanzado',
      error: error.response?.data || error.message
    });
  }
};

module.exports = mercadoPagoCtrl;
