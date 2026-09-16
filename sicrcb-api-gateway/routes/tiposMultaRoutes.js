// sicrcb-api-gateway/routes/tiposMultaRoutes.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { verificarToken, verificarRol } = require('../middlewares/auth');
const tiposMultaController = require('../controllers/tiposMultaController');

const validarCampos = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

router.get('/', verificarToken, tiposMultaController.listarTodos);
router.get('/:id', verificarToken, tiposMultaController.obtenerPorId);

router.post(
    '/',
    verificarToken,
    verificarRol('Administrador'),
    [
        body('numero').trim().notEmpty().withMessage('El número o código es obligatorio'),
        body('descripcion').trim().notEmpty().withMessage('La descripción es obligatoria'),
        body('valor').isFloat({ gt: 0 }).withMessage('El valor debe ser positivo')
    ],
    validarCampos,
    tiposMultaController.crear
);

router.put('/:id', verificarToken, verificarRol('Administrador'), tiposMultaController.actualizar);
router.delete('/:id', verificarToken, verificarRol('Administrador'), tiposMultaController.eliminar);

module.exports = router;