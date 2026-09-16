// sicrcb-api-gateway/routes/alquileresRoutes.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { verificarToken, verificarRol } = require('../middlewares/auth');
const alquileresController = require('../controllers/alquileresController');

const validarCampos = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Rutas fijas (deben ir antes de /:id para evitar colisiones)
router.get('/configuracion', verificarToken, alquileresController.obtenerConfiguracion);
router.put('/configuracion', verificarToken, verificarRol('Administrador'), alquileresController.actualizarConfiguracion);
router.get('/ocupacion', verificarToken, alquileresController.consultarOcupacion);
router.get('/mis-alquileres', verificarToken, alquileresController.listarMisAlquileres);

// Rutas generales y paramétricas
router.get('/', verificarToken, verificarRol('Administrador'), alquileresController.listarTodos);
router.get('/:id', verificarToken, verificarRol('Administrador'), alquileresController.obtenerPorId);

// POST /api/alquileres
router.post(
    '/',
    verificarToken,
    [
        body('descripcion').trim().notEmpty().withMessage('La descripción o motivo es requerida'),
        body('horaInicio').custom((val, { req }) => {
            const v = val || req.body.hora_inicio;
            if (!v || !v.trim()) throw new Error('Hora de inicio requerida');
            return true;
        }),
        body('horaFin').custom((val, { req }) => {
            const v = val || req.body.hora_fin;
            if (!v || !v.trim()) throw new Error('Hora de fin requerida');
            return true;
        }),
        body('tipoAlquiler').custom((val, { req }) => {
            const v = val || req.body.tipo_alquiler;
            if (!['salon', 'sillas', 'ambos'].includes(v)) {
                throw new Error('Tipo de alquiler inválido (debe ser salon, sillas o ambos)');
            }
            return true;
        })
    ],
    validarCampos,
    alquileresController.crear
);

// PUT /api/alquileres/:id (Actualizar estado)
router.put('/:id', verificarToken, alquileresController.actualizarEstado);

// DELETE /api/alquileres/:id (Cancelar reserva)
router.delete('/:id', verificarToken, alquileresController.cancelar);

module.exports = router;