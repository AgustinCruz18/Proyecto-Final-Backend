// backend-turnos/controllers/fichaPacienteController.js
const FichaPaciente = require('../models/FichaPaciente');

exports.getFicha = async (req, res) => {
    const userId = req.params.userId;
    const ficha = await FichaPaciente.findOne({ userId });
    res.json(ficha);
};
exports.getFichaCompleta = async (req, res) => {
    try {
        const ficha = await FichaPaciente.findOne({ userId: req.params.id })
            .populate('userId', 'nombre email rol');

        if (!ficha) {
            return res.status(404).json({ message: 'Ficha no encontrada' });
        }

        res.json(ficha);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener la ficha' });
    }
};

exports.createOrUpdateFicha = async (req, res) => {
    const {
        userId,
        dni,
        nombreCompleto,
        edad,
        fechaNacimiento,
        genero,
        obrasSociales, // array de objetos { nombre, numeroSocio }
        numeroSocio,
        direccion,
        telefono
    } = req.body;

    try {
        // Determinar si la ficha está autorizada
        let autorizada = false;
        if (!obrasSociales?.length || obrasSociales.some(os => os.nombre.toLowerCase() === 'particular')) {
            autorizada = true;
        }

        // Actualizar o crear con el campo autorizada
        const ficha = await FichaPaciente.findOneAndUpdate(
            { userId },
            {
                dni,
                nombreCompleto,
                edad,
                fechaNacimiento,
                genero,
                obrasSociales,
                numeroSocio,
                direccion,
                telefono,
                autorizada // <-- Aquí se agrega el campo calculado
            },
            { new: true, upsert: true }
        );

        res.json(ficha);
    } catch (err) {
        console.error('Error al crear o actualizar ficha:', err);
        res.status(500).json({ message: 'Error del servidor al guardar la ficha' });
    }
};
// Obtener todas las fichas con datos del paciente
exports.getFichasParaSecretaria = async (req, res) => {
    try {
        const fichas = await FichaPaciente.find()
            .populate('userId', 'nombre email');

        res.json(fichas);
    } catch (err) {
        console.error('Error al obtener fichas:', err);
        res.status(500).json({ message: 'Error al obtener fichas' });
    }
};

// Autorizar ficha por ID
exports.autorizarFicha = async (req, res) => {
    const { id } = req.params;

    try {
        const ficha = await FichaPaciente.findByIdAndUpdate(id, { autorizada: true }, { new: true });
        res.json(ficha);
    } catch (err) {
        console.error('Error al autorizar ficha:', err);
        res.status(500).json({ message: 'Error al autorizar ficha' });
    }
};
exports.desautorizarFicha = async (req, res) => {
    const { id } = req.params;

    try {
        const ficha = await FichaPaciente.findByIdAndUpdate(id, { autorizada: false }, { new: true });
        res.json(ficha);
    } catch (err) {
        console.error('Error al desautorizar ficha:', err);
        res.status(500).json({ message: 'Error al desautorizar ficha' });
    }
};