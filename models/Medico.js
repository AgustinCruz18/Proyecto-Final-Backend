//backend-turnos/models/Medico.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const medicoSchema = new Schema({
    nombre: String,
    apellido: String,
    especialidad: { type: Schema.Types.ObjectId, ref: 'Especialidad', required: true },

});

module.exports = mongoose.model('Medico', medicoSchema);
