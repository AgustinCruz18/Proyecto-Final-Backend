//backend-turnos/models/HorarioDisponible.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const horarioDisponibleSchema = new Schema({
    medico: { type: Schema.Types.ObjectId, ref: 'Medico', required: true },
    fecha: { type: Date, required: true },
    horaInicio: { type: String, required: true },
    horaFin: { type: String, required: true },
    disponible: { type: Boolean, default: true }
});

module.exports = mongoose.model('HorarioDisponible', horarioDisponibleSchema);
