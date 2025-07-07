//backend-turnos/config/google-calendar.service.js
const { google } = require('googleapis');

const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
);

oAuth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN
});

const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

// CREAR EVENTO
async function crearEventoCalendar({ summary, description, startDateTime, endDateTime, attendees = [] }) {
    const evento = {
        summary,
        description,
        start: {
            dateTime: startDateTime,
            timeZone: 'America/Argentina/Buenos_Aires'
        },
        end: {
            dateTime: endDateTime,
            timeZone: 'America/Argentina/Buenos_Aires'
        },
        attendees
    };

    const response = await calendar.events.insert({
        calendarId: 'primary', // Usa 'primary' si estás usando el calendario principal del refresh token
        requestBody: evento
    });

    console.log('✅ Evento creado en Google Calendar:', response.data.htmlLink);
    return response.data;
}

// ELIMINAR EVENTO
async function eliminarEventoCalendar(eventId) {
    await calendar.events.delete({
        calendarId: 'primary',
        eventId
    });
}

//ACTUALIZAR EVENTO
async function actualizarEventoCalendar(eventId, data) {
    const response = await calendar.events.update({
        calendarId: 'primary',
        eventId,
        requestBody: data
    });
    return response.data;
}

module.exports = {
    crearEventoCalendar,
    eliminarEventoCalendar,
    actualizarEventoCalendar
};
