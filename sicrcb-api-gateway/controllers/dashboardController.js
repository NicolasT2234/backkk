// sicrcb-api-gateway/controllers/dashboardController.js
const DashboardService = require('../../sicrcb-backend/services/DashboardService');

async function obtenerEstadisticasAdmin(req, res, next) {
    const startTime = Date.now();
    try {
        const data = await DashboardService.obtenerEstadisticasAdmin(startTime);
        return res.status(200).json(data);
    } catch (error) {
        next(error);
    }
}

async function obtenerDashboardResidente(req, res, next) {
    const startTime = Date.now();
    try {
        const data = await DashboardService.obtenerDashboardResidente(req.usuario.id, startTime);
        return res.status(200).json(data);
    } catch (error) {
        next(error);
    }
}

module.exports = { obtenerEstadisticasAdmin, obtenerDashboardResidente };