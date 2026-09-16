// sicrcb-api-gateway/controllers/authController.js
const jwt = require('jsonwebtoken');
const AuthService = require('../../sicrcb-backend/services/AuthService');

// 1. Login
async function login(req, res, next) {
    try {
        const { email, contraseña } = req.body;
        const usuario = await AuthService.autenticar(email, contraseña);

        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.cookie('sicrcb_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 horas
        });

        return res.status(200).json({
            user: {
                id: usuario.id,
                email: usuario.email,
                rol: usuario.rol,
                nombre: usuario.nombre,
                apellido: usuario.apellido
            }
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

// 2. Solicitar Recuperación
async function solicitarRecuperacion(req, res, next) {
    try {
        const { email } = req.body;
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const respuesta = await AuthService.solicitarRecuperacion(email, baseUrl);
        return res.status(200).json(respuesta);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

// 3. Restablecer Contraseña
async function restablecerPassword(req, res, next) {
    try {
        const { token, nuevaPassword } = req.body;
        const respuesta = await AuthService.restablecerPassword(token, nuevaPassword);
        return res.status(200).json(respuesta);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ error: 'El enlace de recuperación ha expirado. Solicita uno nuevo.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({ error: 'El enlace de recuperación es inválido.' });
        }
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

// 4. Logout
function logout(req, res) {
    res.clearCookie('sicrcb_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
    return res.status(200).json({ message: 'Sesión cerrada exitosamente' });
}

module.exports = { login, solicitarRecuperacion, restablecerPassword, logout };