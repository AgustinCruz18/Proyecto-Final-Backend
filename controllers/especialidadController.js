// backend-turnos/controllers/especialidadController.js
const Especialidad = require('../models/Especialidad');

exports.crear = async (req, res) => {
    try {
        const especialidad = new Especialidad(req.body);
        await especialidad.save();
        res.status(201).json(especialidad);
    } catch (err) {
        res.status(400).json({ message: 'Error al crear especialidad', error: err.message });
    }
};

exports.obtenerTodas = async (req, res) => {
    const especialidades = await Especialidad.find();
    res.json(especialidades);
};

exports.eliminar = async (req, res) => {
    await Especialidad.findByIdAndDelete(req.params.id);
    res.json({ message: 'Especialidad eliminada' });
};
