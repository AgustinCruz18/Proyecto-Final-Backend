require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const bcrypt = require('bcryptjs');

// Importar rutas
const especialidadRoutes = require('./routes/especialidadRoutes');
const medicoRoutes = require('./routes/medicoRoutes');
const horarioRoutes = require('./routes/horarioRoutes');
const turnoRoutes = require('./routes/turnoRoutes');
const iaRoutes = require('./routes/iaRoutes');
const authRoutes = require('./routes/authRoutes'); // Declarar una vez
const fichaRoutes = require('./routes/fichaPacienteRoutes'); // Declarar una vez
const mercadoPagoRoutes = require('./routes/mercadoPagoRoutes'); // Asegúrate de tener esta ruta si la usas
const reporteRoutes = require('./routes/reporteRoutes');
// Modelos
const User = require('./models/User');
require('./config/passport'); // Configuración de Passport

const app = express();

// Middlewares
app.use(cors()); // Se recomienda colocar cors al inicio de los middlewares
app.use(express.json());
app.use(passport.initialize());

// Definir rutas
app.use('/api/auth', authRoutes);
app.use('/api/ficha', fichaRoutes);
app.use('/api/ia', iaRoutes);
app.use('/api/especialidades', especialidadRoutes);
app.use('/api/medicos', medicoRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/turnos', turnoRoutes);
app.use('/api/mercadopago', mercadoPagoRoutes);
app.use('/api/reportes', reporteRoutes);

// Función para crear el administrador si no existe
async function crearAdminSiNoExiste() {
    const adminEmail = 'admin1@gmail'; // Nota: Los emails suelen llevar .com, .net, etc.
    const adminExiste = await User.findOne({ email: adminEmail });

    if (adminExiste) {
        console.log('✔️ Admin ya existe en la base de datos');
        return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const nuevoAdmin = new User({
        nombre: 'Administrador1',
        email: adminEmail,
        password: hashedPassword,
        rol: 'administrador'
    });

    await nuevoAdmin.save();
    console.log('🚀 Admin creado automáticamente');
}

// Conexión con MongoDB y arranque del servidor
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB conectado');
        crearAdminSiNoExiste(); // Llama a la función para crear el admin después de conectar a la DB
        app.listen(process.env.PORT, () => {
            console.log(`Servidor en puerto ${process.env.PORT}`);
        });
    })
    .catch(err => console.error('Error al conectar con MongoDB:', err));