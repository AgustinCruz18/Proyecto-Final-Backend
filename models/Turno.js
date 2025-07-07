//backend-turnos/controllers/turnoController.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const turnoSchema = new Schema({
    obraSocial: { nombre: String, numeroSocio: String },
    fecha: { type: Date, required: true },
    hora: { type: String, required: true },
    medico: { type: Schema.Types.ObjectId, ref: 'Medico', required: true },
    especialidad: { type: Schema.Types.ObjectId, ref: 'Especialidad', required: true },
    paciente: { type: Schema.Types.ObjectId, ref: 'User' },
    estado: { type: String, enum: ['disponible', 'ocupado'], default: 'disponible' },
    eventoGoogleId: { type: String },
    duracion: { type: Number, default: 30 },
    precio_base: { type: Number, default: 5000 },
    precioPagado: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Turno', turnoSchema);
