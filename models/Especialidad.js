//backend-turnos/models/Especialidad.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const especialidadSchema = new Schema({
    nombre: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Especialidad', especialidadSchema);
