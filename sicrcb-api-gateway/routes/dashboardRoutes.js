// sicrcb-api-gateway/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/auth');
const dashboardController = require('../controllers/dashboardController');

// GET /api/dashboard/estadisticas (Solo Administrador)
router.get('/estadisticas', verificarToken, verificarRol('Administrador'), dashboardController.obtenerEstadisticasAdmin);

// GET /api/dashboard/residente (Residente autenticado)
router.get('/residente', verificarToken, dashboardController.obtenerDashboardResidente);

module.exports = router;