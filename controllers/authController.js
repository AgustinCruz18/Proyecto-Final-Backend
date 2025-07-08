const jwt = require('jsonwebtoken');

exports.googleCallback = async (req, res) => {
    const token = jwt.sign({
        id: req.user._id,
        nombre: req.user.nombre,
        email: req.user.email,
        rol: req.user.rol
    }, process.env.JWT_SECRET);

    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:4200';
    const redirectUrl = `${frontendURL}/?token=${token}`;
    res.redirect(redirectUrl);
};
