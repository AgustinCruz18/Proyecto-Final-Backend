//backend-turnos/controllers/medicoController.js
const Medico = require('../models/Medico');
const Especialidad = require('../models/Especialidad');

exports.crear = async (req, res) => {
    try {
        const { nombre, apellido, especialidad } = req.body;
        const especialidadExiste = await Especialidad.findById(especialidad);
        if (!especialidadExiste) {
            return res.status(404).json({ message: 'Especialidad no encontrada' });
        }
        const medico = new Medico({ nombre, apellido, especialidad });
        await medico.save();
        res.status(201).json(medico);
    } catch (err) {
        res.status(400).json({ message: 'Error al crear médico', error: err.message });
    }
};

exports.obtenerTodos = async (req, res) => {
    const medicos = await Medico.find().populate('especialidad', 'nombre');
    res.json(medicos);
};
