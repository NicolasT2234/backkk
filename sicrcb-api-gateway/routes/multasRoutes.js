// sicrcb-api-gateway/routes/multasRoutes.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { verificarToken, verificarRol } = require('../middlewares/auth');
const multasController = require('../controllers/multasController');

const validarCampos = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

router.get('/', verificarToken, verificarRol('Administrador'), multasController.listarTodas);
router.get('/mis-multas', verificarToken, multasController.listarMisMultas);
router.get('/:id', verificarToken, verificarRol('Administrador'), multasController.obtenerPorId);

router.post(
    '/',
    verificarToken,
    verificarRol('Administrador'),
    [
        body('nombre').trim().notEmpty().withMessage('Título o motivo requerido'),
        body('descripcion').trim().notEmpty().withMessage('Descripción requerida'),
        body('id_tipo_multa').isInt({ gt: 0 }).withMessage('Tipo de multa requerido'),
        body('idApartamento').isInt({ gt: 0 }).withMessage('Apartamento requerido')
    ],
    validarCampos,
    multasController.crear
);

router.put(
    '/:id',
    verificarToken,
    verificarRol('Administrador'),
    [
        body('nombre').optional().trim().notEmpty().withMessage('El título no puede estar vacío'),
        body('descripcion').optional().trim().notEmpty().withMessage('La descripción no puede estar vacía'),
        body('id_tipo_multa').optional().isInt({ gt: 0 }).withMessage('Tipo de multa inválido'),
        body('idApartamento').optional().isInt({ gt: 0 }).withMessage('Apartamento inválido'),
        body('id_apartamento').optional().isInt({ gt: 0 }).withMessage('Apartamento inválido'),
        body('estado').optional().isIn(['Pendiente', 'En proceso', 'Resuelta']).withMessage('Estado inválido')
    ],
    validarCampos,
    multasController.actualizar
);

router.delete('/:id', verificarToken, verificarRol('Administrador'), multasController.eliminar);

module.exports = router;