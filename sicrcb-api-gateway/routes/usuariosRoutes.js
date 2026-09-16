// sicrcb-api-gateway/routes/usuariosRoutes.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { verificarToken } = require('../middlewares/auth');
const usuariosController = require('../controllers/usuariosController');

// Middleware para atrapar errores de express-validator
const validarCampos = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// GET /api/usuarios/me
router.get('/me', verificarToken, usuariosController.obtenerMiPerfil);

// PUT /api/usuarios/me
router.put(
    '/me',
    verificarToken,
    [
        body('nombres')
            .optional()
            .trim()
            .notEmpty().withMessage('Nombre no puede estar vacío')
            .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/).withMessage('El nombre solo debe contener letras y espacios'),
        body('apellidos')
            .optional()
            .trim()
            .notEmpty().withMessage('Apellido no puede estar vacío')
            .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/).withMessage('El apellido solo debe contener letras y espacios'),
        body('contraseña')
            .optional()
            .trim()
            .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
    ],
    validarCampos,
    usuariosController.actualizarMiPerfil
);

module.exports = router;