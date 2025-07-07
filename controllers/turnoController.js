//backend-turnos/controllers/turnoController.js
const Turno = require('../models/Turno');
const { crearEventoCalendar, eliminarEventoCalendar, actualizarEventoCalendar } = require('../config/google-calendar.service');
const User = require('../models/User');
const Especialidad = require('..//models/Especialidad');
const Ficha = require('../models/FichaPaciente'); // agrega esta línea en turnoController.js


exports.obtenerTodos = async (req, res) => {
    try {
        // Trae todos los turnos con los datos relacionados
        const turnos = await Turno.find()
            .populate('medico')
            .populate('especialidad')
            .populate({
                path: 'paciente',
                select: 'nombre email rol'  // Solo los campos necesarios del usuario
            })
            .lean(); // Convierte los documentos Mongoose en objetos JS planos

        // Ahora agregamos la ficha médica relacionada a cada paciente
        for (const turno of turnos) {
            if (turno.paciente && turno.paciente._id) {
                const ficha = await Ficha.findOne({ userId: turno.paciente._id }).lean();
                console.log('⏳ Ficha encontrada para paciente:', ficha);
                if (ficha) {
                    turno.paciente.dni = ficha.dni;
                    turno.paciente.telefono = ficha.telefono;
                }
            }
        }

        res.json(turnos);
    } catch (err) {
        console.error('Error al obtener todos los turnos:', err);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.crear = async (req, res) => {
    try {
        // 🔒 Normaliza la fecha al inicio del día local sin desfase de zona
        const [anio, mes, dia] = req.body.fecha.split('-'); // Asumiendo formato "YYYY-MM-DD"
        const fechaLocal = new Date(Number(anio), Number(mes) - 1, Number(dia), 0, 0, 0);
        req.body.fecha = fechaLocal; // Sobreescribe la fecha en req.body con la normalizada

        const turno = new Turno(req.body);
        await turno.save();
        res.status(201).json(turno);
    } catch (err) {
        console.error('❌ Error al crear turno:', err);
        res.status(500).json({ message: 'Error al crear turno' });
    }
};

exports.obtenerDisponiblesPorMedico = async (req, res) => {
    const turnos = await Turno.find({ medico: req.params.id, estado: 'disponible' });
    res.json(turnos);
};

exports.reservar = async (req, res) => {
    try {
        const { pacienteId, obraSocialElegida } = req.body;

        const turno = await Turno.findById(req.params.id).populate('medico');
        if (!turno) return res.status(404).json({ message: 'Turno no encontrado' });
        if (turno.estado !== 'disponible') return res.status(400).json({ message: 'El turno ya está ocupado' });

        if (!obraSocialElegida || typeof obraSocialElegida !== 'object' || !obraSocialElegida.nombre) {
            return res.status(400).json({ message: 'Obra social inválida' });
        }

        const paciente = await User.findById(pacienteId);
        const especialidad = await Especialidad.findById(turno.especialidad);

        // Calcular precio pagado según obra social
        const descuentosObraSocial = {
            "OSDE": 0.3,
            "Swiss Medical": 0.25,
            "IOSFA": 0.2,
            "Otra": 0.1,
            "Particular": 0
        };

        const precioBase = 5000;
        const descuento = descuentosObraSocial[obraSocialElegida.nombre] || 0;
        const precioFinal = parseFloat((precioBase * (1 - descuento)).toFixed(2));

        // Google Calendar
        const fechaTurno = new Date(turno.fecha);
        const [hours, minutes] = turno.hora.split(':').map(Number);
        fechaTurno.setHours(hours, minutes, 0, 0);

        const startDateTime = new Date(fechaTurno);
        const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

        const evento = await crearEventoCalendar({
            summary: `Turno: ${especialidad.nombre} con Dr. ${turno.medico.nombre} ${turno.medico.apellido}`,
            description: `Paciente: ${paciente.nombre} ${paciente.apellido}\nEmail: ${paciente.email}\nObra Social: ${obraSocialElegida.nombre}`,
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
            attendees: [{ email: paciente.email }]
        });

        // Guardar en base de datos
        turno.estado = 'ocupado';
        turno.paciente = pacienteId;
        turno.obraSocial = {
            nombre: obraSocialElegida.nombre,
            numeroSocio: obraSocialElegida.numeroSocio || 'N/A'
        };
        turno.precioPagado = precioFinal;
        turno.eventoGoogleId = evento.id;

        await turno.save();

        // 🔥 AÑADIR EL ENLACE DE GOOGLE CALENDAR
        res.json({
            message: 'Turno reservado con éxito',
            turno,
            enlaceGoogleCalendar: evento.htmlLink
        });
    } catch (err) {
        console.error('❌ Error al reservar turno:', err);
        res.status(500).json({ message: 'Error del servidor' });
    }
};


exports.reservarTurnoDirecto = async (req, res) => {
    const { turnoId, pacienteId, obraSocial } = req.body;

    try {
        const turno = await Turno.findById(turnoId).populate('medico').populate('especialidad');
        if (!turno) return res.status(404).json({ msg: 'Turno no encontrado' });

        if (turno.estado !== 'disponible') {
            return res.status(400).json({ msg: 'El turno ya está ocupado' });
        }

        const paciente = await User.findById(pacienteId);
        if (!paciente) return res.status(404).json({ msg: 'Paciente no encontrado' });

        // Crear evento Google Calendar
        const fechaTurno = new Date(turno.fecha);
        const [hours, minutes] = turno.hora.split(':').map(Number);
        fechaTurno.setHours(hours, minutes, 0, 0);

        const startDateTime = new Date(fechaTurno);
        const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

        const evento = await crearEventoCalendar({
            summary: `Turno: ${turno.especialidad.nombre} con Dr. ${turno.medico.nombre} ${turno.medico.apellido}`,
            description: `Paciente: ${paciente.nombre}\nEmail: ${paciente.email}\nObra Social: ${obraSocial.nombre}`,
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
            attendees: [{ email: paciente.email }]
        });

        // Actualizar turno
        turno.estado = 'ocupado';
        turno.paciente = pacienteId;
        turno.obraSocial = {
            nombre: obraSocial.nombre,
            numeroSocio: obraSocial.numeroSocio || 'N/A'
        };
        turno.eventoGoogleId = evento.id;
        turno.precioPagado = 0;
        await turno.save();

        res.status(200).json({
            msg: 'Turno reservado correctamente (sin pago)',
            turno,
            enlaceGoogleCalendar: evento.htmlLink
        });
    } catch (err) {
        console.error('❌ Error en reserva directa:', err);
        res.status(500).json({ msg: 'Error del servidor al reservar turno directo' });
    }
};

exports.eliminar = async (req, res) => {
    try {
        const turno = await Turno.findByIdAndDelete(req.params.id);
        if (!turno) return res.status(404).json({ message: 'Turno no encontrado' });

        if (turno.eventoGoogleId) {
            await eliminarEventoCalendar(turno.eventoGoogleId);
        }

        res.json({ message: 'Turno eliminado con éxito' });
    } catch (err) {
        console.error('❌ Error al eliminar turno:', err);
        res.status(500).json({ message: 'Error al eliminar turno' });
    }
};

exports.actualizar = async (req, res) => {
    try {
        // 🔒 Normaliza la fecha al inicio del día local sin desfase de zona
        const [anio, mes, dia] = req.body.fecha.split('-'); // Asumiendo formato "YYYY-MM-DD" desde el frontend
        const fechaLocal = new Date(Number(anio), Number(mes) - 1, Number(dia), 0, 0, 0);
        req.body.fecha = fechaLocal; // Sobreescribe la fecha en req.body con la normalizada

        // Comprobación de duplicidad ANTES de intentar actualizar
        const existe = await Turno.findOne({
            _id: { $ne: req.params.id }, // excluye el turno actual si estás editando
            medico: req.body.medico,
            fecha: fechaLocal, // Usa la fecha normalizada para la búsqueda
            hora: req.body.hora
        });

        if (existe) {
            return res.status(400).json({ message: 'Ya existe un turno para ese médico en esa fecha y hora' });
        }

        // Ahora sí, actualiza el turno con req.body que ya tiene la fecha normalizada
        const turno = await Turno.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!turno) return res.status(404).json({ message: 'Turno no encontrado' });

        if (turno.eventoGoogleId) {
            // Para el evento de Google Calendar, necesitas la fecha normalizada y la hora del body
            const [hours, minutes] = req.body.hora.split(':').map(Number);
            fechaLocal.setHours(hours, minutes, 0, 0); // Ajusta la hora en la fecha normalizada para el evento

            const startDateTime = new Date(fechaLocal);
            const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

            await actualizarEventoCalendar(turno.eventoGoogleId, {
                summary: 'Turno actualizado',
                start: {
                    dateTime: startDateTime.toISOString(),
                    timeZone: 'America/Argentina/Buenos_Aires'
                },
                end: {
                    dateTime: endDateTime.toISOString(),
                    timeZone: 'America/Argentina/Buenos_Aires'
                }
            });
        }

        res.json({ message: 'Turno actualizado con éxito', turno });
    } catch (err) {
        console.error('❌ Error al actualizar turno:', err);
        res.status(500).json({ message: 'Error al actualizar turno' });
    }

};

// Obtener los turnos de un paciente específico
exports.obtenerPorPaciente = async (req, res) => {
    const { idPaciente } = req.params;

    try {
        const turnos = await Turno.find({ paciente: idPaciente })
            .populate('medico', 'nombre apellido')
            .populate('especialidad', 'nombre')
            .sort({ fecha: -1, hora: 1 }); // Ordena por fecha descendente y hora ascendente

        res.json(turnos);
    } catch (error) {
        console.error('❌ Error al obtener turnos del paciente:', error);
        res.status(500).json({ message: 'Error al obtener los turnos del paciente' });
    }
};
