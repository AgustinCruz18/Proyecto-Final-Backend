//backend-turnos/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nombre: String,
    email: { type: String, required: true, unique: true },
    password: String,
    googleId: String,
    rol: { type: String, enum: ['administrador', 'secretaria', 'paciente', 'gerente'], required: true },
});

module.exports = mongoose.model('User', userSchema);
