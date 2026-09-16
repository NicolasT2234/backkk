// sicrcb-api-gateway/routes/reportesRoutes.js
const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/auth');
const reportesController = require('../controllers/reportesController');

// 1. Reportes Administrativos (Solo Administrador)
router.get('/admin/multas-pdf', verificarToken, verificarRol('Administrador'), reportesController.reporteMultas);
router.get('/admin/alquileres-pdf', verificarToken, verificarRol('Administrador'), reportesController.reporteAlquileres);
router.get('/admin/pqrs-pdf', verificarToken, verificarRol('Administrador'), reportesController.reportePqrs);
router.get('/admin/censo-apartamentos-pdf', verificarToken, verificarRol('Administrador'), reportesController.censoApartamentos);

// 2. Reportes para Residentes (Autenticado)
router.get('/residente/paz-y-salvo-pdf', verificarToken, reportesController.pazYSalvo);
router.get('/residente/comprobante-reserva-pdf/:id', verificarToken, reportesController.comprobanteReserva);

module.exports = router;