// backend-turnos/controllers/horarioController.js
const Horario = require('../models/HorarioDisponible');
const Medico = require('../models/Medico');
const Turno = require('../models/Turno');
const { crearEventoCalendar } = require('../config/google-calendar.service'); // Opcional si querés activar Google Calendar

exports.crear = async (req, res) => {
    try {
        const { medico, fecha, horaInicio, horaFin } = req.body;

        // Validación
        if (!medico || !fecha || !horaInicio || !horaFin) {
            return res.status(400).json({ message: 'Faltan datos obligatorios' });
        }

        const medicoInfo = await Medico.findById(medico).populate('especialidad');
        if (!medicoInfo) return res.status(404).json({ message: 'Médico no encontrado' });

        // Guardar el horario
        const nuevoHorario = new Horario({ medico, fecha, horaInicio, horaFin });
        await nuevoHorario.save();

        // fecha desfase por UTC
        const [anio, mes, dia] = fecha.split('-').map(Number); // '2025-08-10'
        const fechaAjustada = new Date(anio, mes - 1, dia, 0, 0, 0); // mes - 1

        // Generar turnos en bloques de 30 min
        const bloques = generarBloques(horaInicio, horaFin, 30);
        const turnosCreados = [];

        for (const hora of bloques) {
            const turno = await Turno.create({
                medico,
                fecha: fechaAjustada,
                hora,
                especialidad: medicoInfo.especialidad._id,
                estado: 'disponible'
            });
            turnosCreados.push(turno);
        }

        /*
        const summary = `Horario disponible - ${medicoInfo.nombre} ${medicoInfo.apellido}`;
        const description = `Turnos disponibles para la especialidad: ${medicoInfo.especialidad.nombre}`;
        const startDateTime = `${fecha}T${horaInicio}:00`;
        const endDateTime = `${fecha}T${horaFin}:00`;
        try {
            const evento = await crearEventoCalendar({
                summary,
                description,
                startDateTime,
                endDateTime
            });

            console.log('Evento creado en Google Calendar:', evento.htmlLink);
        } catch (calendarError) {
            console.error('Error al crear evento en Google Calendar:', calendarError.message);
        }
        */

        res.status(201).json({
            message: 'Horario y turnos creados',
            horario: nuevoHorario,
            turnos: turnosCreados
        });
    } catch (error) {
        console.error('Error al crear horario y turnos:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// Genera bloques de tiempo
function generarBloques(inicio, fin, minutos) {
    const bloques = [];
    const [hIni, mIni] = inicio.split(':').map(Number);
    const [hFin, mFin] = fin.split(':').map(Number);

    let totalInicio = hIni * 60 + mIni;
    const totalFin = hFin * 60 + mFin;

    while (totalInicio + minutos <= totalFin) {
        const h = Math.floor(totalInicio / 60);
        const m = totalInicio % 60;
        const horaStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        bloques.push(horaStr);
        totalInicio += minutos;
    }

    return bloques;
}

exports.obtenerPorMedico = async (req, res) => {
    try {
        const horarios = await Horario.find({ medico: req.params.id }).sort('fecha');
        res.json(horarios);
    } catch (err) {
        console.error('Error al obtener horarios:', err);
        res.status(500).json({ message: 'Error al obtener horarios' });
    }
};
