//backend-turnos/routes/iaRoutes.js
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const Medico = require('../models/Medico');
const Turno = require('../models/Turno');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

router.post('/', async (req, res) => {
    const pregunta = req.body.pregunta;

    try {
        const medicos = await Medico.find().populate('especialidad', 'nombre');
        const turnos = await Turno.find()
            .populate('medico', 'nombre apellido especialidad')
            .populate('especialidad', 'nombre');

        const listadoMedicos = medicos.map(m =>
            `${m.nombre} ${m.apellido} - ${m.especialidad?.nombre || 'Especialidad no informada'} - Días: ${m.diasAtencion?.join(', ') || 'No informado'}`
        ).join('\n');

        const especialidades = [
            ...new Set(
                medicos.map(m => m.especialidad?.nombre).filter(Boolean)
            )
        ].join(', ');

        const turnosHoy = turnos
            .filter(t => new Date(t.fecha).toDateString() === new Date().toDateString())
            .map(t => `🕒 ${t.hora} | 👨‍⚕️ ${t.medico?.nombre} ${t.medico?.apellido} (${t.especialidad?.nombre})`)
            .join('\n') || "No hay turnos cargados para hoy.";

        const contexto = `
--- Información actual de la clínica ---
🩺 Especialidades: ${especialidades}
Médicos disponibles:
${listadoMedicos}

Turnos disponibles hoy:
${turnosHoy}
----------------------------------------
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `
Sos un asistente virtual amable y conversacional que ayuda a pacientes a consultar turnos y médicos de una clínica.

**Tu forma de responder es la siguiente:**

- Primero ofrecé el listado de especialidades si el usuario pregunta por ellas.
- Si el usuario indica una especialidad, ofrecé el listado de médicos que trabajan en ella.
- Si el usuario elige un médico, ofrecé los turnos disponibles de ese médico.
- Si el usuario pregunta por turnos, primero averiguá para qué especialidad o médico.
- Si el usuario hace preguntas generales, orientalo sobre qué puede consultar.
- Respondé de forma amigable, con íconos y formato visual (usá listas numeradas, bullets y emojis).
**IMPORTANTE: Para las listas numeradas, utiliza el formato "1. Item", "2. Item", etc., con cada elemento en una línea separada.**
- No inventes datos. Respondé solo basándote en el contexto.
- Si no encontrás datos, avisalo de manera amable.

**Formato para listas:**

-Las especialidades disponibles son:
1. Dentista
2. Médico Clínico
3. Pediatría

Indicame el número o el nombre de la especialidad para saber los médicos.

O para médicos:

👨‍⚕️ Los médicos de Dentista son:
1. Roberto Carlos
2. Marcelo Carlos

-¿Querés saber los turnos de alguno? Indicame el número o nombre.

O para turnos:

-Turnos disponibles para Roberto Carlos (Dentista):

🕒 09:00
🕒 09:30

Si el usuario está perdido, orientalo sobre qué puede preguntar:
- Qué especialidades hay
- Qué médicos hay en determinada especialidad
- Qué turnos tiene un médico

**Información de la clínica:**

${contexto}
                    `
                },
                {
                    role: "user",
                    content: pregunta
                }
            ]
        });

        const respuesta = completion.choices[0].message.content;
        res.json({ respuesta });
    } catch (error) {
        console.error('Error al consultar a la IA:', error);
        res.status(500).json({ respuesta: 'Ocurrió un error con la IA.' });
    }
});


module.exports = router;


