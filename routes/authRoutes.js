// backend-turnos/routes/authRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const { googleCallback } = require('../controllers/authController');
const router = express.Router();

// Middleware para verificar si es admin
function verificarAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No autorizado, no se proveyó token' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Formato de token inválido' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.rol !== 'administrador') {
            return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
        }
        req.usuario = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token inválido o expirado' });
    }
}

// Registro manual (rol paciente)
router.post('/register', async (req, res) => {
    const { nombre, email, password } = req.body;
    try {
        const existe = await User.findOne({ email });
        if (existe) return res.status(400).json({ message: 'El email ya está registrado' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            nombre,
            email,
            password: hashedPassword,
            rol: 'paciente'
        });
        await user.save();
        res.status(201).json({ message: 'Usuario registrado' });
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Login manual
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !user.password) return res.status(400).json({ message: 'Credenciales inválidas' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ message: 'Credenciales inválidas' });

        const token = jwt.sign({
            id: user._id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol
        }, process.env.JWT_SECRET);

        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Crear secretaria (solo admin)
router.post('/crear-secretaria', verificarAdmin, async (req, res) => {
    const { nombre, email, password } = req.body;
    try {
        const existe = await User.findOne({ email });
        if (existe) return res.status(400).json({ message: 'El email ya está registrado' });

        const hashed = await bcrypt.hash(password, 10);
        const secretaria = new User({ nombre, email, password: hashed, rol: 'secretaria' });
        await secretaria.save();

        res.status(201).json({ message: 'Secretaria registrada' });
    } catch (err) {
        res.status(500).json({ message: 'Error al registrar secretaria' });
    }
});

// Crear gerente (solo admin)
router.post('/crear-gerente', verificarAdmin, async (req, res) => {
    const { nombre, email, password } = req.body;
    try {
        const existe = await User.findOne({ email });
        if (existe) return res.status(400).json({ message: 'El email ya está registrado' });

        const hashed = await bcrypt.hash(password, 10);
        const gerente = new User({ nombre, email, password: hashed, rol: 'gerente' });
        await gerente.save();

        res.status(201).json({ message: 'Gerente registrado correctamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

/*Ruta temporal para crear un administrador
router.post('/crear-admin', async (req, res) => {
    const { nombre, email, password } = req.body;
    try {
        const existe = await User.findOne({ email });
        if (existe) return res.status(400).json({ message: 'El email ya está registrado' });

        const hashed = await bcrypt.hash(password, 10);
        const admin = new User({ nombre, email, password: hashed, rol: 'administrador' });
        await admin.save();

        res.status(201).json({ message: 'Administrador registrado correctamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
});
*/

// Obtener usuarios por rol (secretaria, gerente)
router.get('/usuarios/:rol', verificarAdmin, async (req, res) => {
    try {
        const rol = req.params.rol;
        if (rol !== 'secretaria' && rol !== 'gerente') {
            return res.status(400).json({ message: 'Rol no válido. Solo se permiten "secretaria" o "gerente".' });
        }
        const usuarios = await User.find({ rol }).select('-password');
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor al obtener usuarios.' });
    }
});

// Actualizar un usuario (nombre y email)
router.put('/usuarios/:id', verificarAdmin, async (req, res) => {
    try {
        const { nombre, email } = req.body;
        const usuarioId = req.params.id;

        const emailEnUso = await User.findOne({ email, _id: { $ne: usuarioId } });
        if (emailEnUso) {
            return res.status(400).json({ message: 'El email ya está en uso por otro usuario.' });
        }

        const usuarioActualizado = await User.findByIdAndUpdate(
            usuarioId,
            { nombre, email },
            { new: true }
        ).select('-password');

        if (!usuarioActualizado) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.json(usuarioActualizado);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor al actualizar el usuario.' });
    }
});

// Eliminar un usuario
router.delete('/usuarios/:id', verificarAdmin, async (req, res) => {
    try {
        const usuarioEliminado = await User.findByIdAndDelete(req.params.id);
        if (!usuarioEliminado) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.json({ message: 'Usuario eliminado correctamente.' });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor al eliminar el usuario.' });
    }
});

// Login con Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    googleCallback
);

module.exports = router;