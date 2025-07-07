//backend-turnos/models/FichaPaciente.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fichaPacienteSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    dni: String,
    nombreCompleto: String,
    edad: Number,
    fechaNacimiento: { type: Date },
    genero: { type: String, enum: ['Masculino', 'Femenino', 'Otro'] },
    //obraSocial: { type: String, enum: ['OSDE', 'Swiss Medical', 'IOSFA'] },
    obrasSociales: [{ // array
        nombre: String,
        numeroSocio: String
    }],
    direccion: String,
    telefono: String,
    autorizada: { type: Boolean, default: false } // secretaria valida esto
});

module.exports = mongoose.model('FichaPaciente', fichaPacienteSchema);
