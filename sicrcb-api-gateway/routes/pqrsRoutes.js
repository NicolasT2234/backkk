// sicrcb-api-gateway/routes/pqrsRoutes.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { verificarToken, verificarRol } = require('../middlewares/auth');
const pqrsController = require('../controllers/pqrsController');

const validarCampos = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

router.get('/', verificarToken, verificarRol('Administrador'), pqrsController.listarTodas);
router.get('/mi-apartamento', verificarToken, pqrsController.obtenerMiApartamento);
router.get('/mis-pqrs', verificarToken, pqrsController.listarMisPqrs);
router.get('/:id', verificarToken, verificarRol('Administrador'), pqrsController.obtenerPorId);

router.post(
    '/',
    verificarToken,
    [
        body('descripcion').trim().notEmpty().withMessage('Descripción requerida'),
        body('tipo').trim().notEmpty().withMessage('Tipo requerido'),
        body('idApartamento').optional().isInt({ gt: 0 }).withMessage('ID de apartamento inválido')
    ],
    validarCampos,
    pqrsController.crear
);

router.put(
    '/:id',
    verificarToken,
    [
        body('descripcion').optional().trim().notEmpty().withMessage('Descripción no puede estar vacía'),
        body('estado').optional().trim().notEmpty().withMessage('Estado no puede estar vacío'),
        body('tipo').optional().trim().notEmpty().withMessage('Tipo no puede estar vacío')
    ],
    validarCampos,
    pqrsController.actualizar
);

router.delete('/:id', verificarToken, verificarRol('Administrador'), pqrsController.eliminar);

module.exports = router;