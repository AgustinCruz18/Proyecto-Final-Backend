//backend-turnos/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Google Profile:', profile);
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            user = await User.create({
                googleId: profile.id,
                nombre: profile.displayName,
                email: profile.emails?.[0]?.value || `noemail-${profile.id}@fake.com`,
                rol: 'paciente'
            });
            console.log('Usuario creado con Google:', user);
        } else {
            console.log('Usuario ya existente:', user);
        }
        return done(null, user);
    } catch (err) {
        console.error('Error en estrategia Google:', err);
        return done(err, null);
    }
}));
