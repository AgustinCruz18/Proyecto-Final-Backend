const jwt = require('jsonwebtoken');

exports.googleCallback = async (req, res) => {
    const token = jwt.sign({
        id: req.user._id,
        nombre: req.user.nombre,
        email: req.user.email,
        rol: req.user.rol
    }, process.env.JWT_SECRET);

    const redirectUrl = `http://localhost:4200?token=${token}`;
    res.redirect(redirectUrl);
};
