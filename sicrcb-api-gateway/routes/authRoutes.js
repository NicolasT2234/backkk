// sicrcb-api-gateway/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');

// Middleware para verificar errores de validación
const validarCampos = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// POST /api/auth/login
router.post(
    '/login',
    [
        body('email')
            .trim()
            .isEmail()
            .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false })
            .withMessage('Email válido requerido'),
        body('contraseña').trim().notEmpty().withMessage('Contraseña requerida')
    ],
    validarCampos,
    authController.login
);

// POST /api/auth/solicitar-recuperacion
router.post(
    '/solicitar-recuperacion',
    [body('email').trim().isEmail().withMessage('Por favor ingresa un correo electrónico válido.')],
    validarCampos,
    authController.solicitarRecuperacion
);

// POST /api/auth/restablecer-password
router.post(
    '/restablecer-password',
    [
        body('token').notEmpty().withMessage('El token es requerido.'),
        body('nuevaPassword').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres.')
    ],
    validarCampos,
    authController.restablecerPassword
);

// POST /api/auth/logout
router.post('/logout', authController.logout);

module.exports = router;