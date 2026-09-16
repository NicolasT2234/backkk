// sicrcb-api-gateway/routes/apartamentosRoutes.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { verificarToken, verificarRol } = require('../middlewares/auth');
const apartamentosController = require('../controllers/apartamentosController');

const validarCampos = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

router.get('/', verificarToken, apartamentosController.listarTodos);
router.get('/:id', verificarToken, apartamentosController.obtenerPorId);

router.post(
    '/',
    verificarToken,
    verificarRol('Administrador'),
    [
        body('numero').trim().notEmpty().withMessage('Número requerido'),
        body('estado').trim().notEmpty().withMessage('Estado requerido'),
        body('idInterior').isInt({ gt: 0 }).withMessage('ID de interior válido requerido')
    ],
    validarCampos,
    apartamentosController.crear
);

router.put('/:id', verificarToken, verificarRol('Administrador'), apartamentosController.actualizar);
router.delete('/:id', verificarToken, verificarRol('Administrador'), apartamentosController.eliminar);

module.exports = router;