// sicrcb-backend/models/DashboardModel.js
const DashboardRepository = require('../repositories/DashboardRepository');

// Instancia única del repositorio
const dashboardRepository = new DashboardRepository();

class DashboardModel {
    // --- CONSULTAS ADMINISTRADOR ---
    static async obtenerMetricasAdmin() {
        return await dashboardRepository.obtenerMetricasAdmin();
    }

    static async obtenerActividadRecienteAdmin() {
        return await dashboardRepository.obtenerActividadRecienteAdmin();
    }

    // --- CONSULTAS RESIDENTE ---
    static async obtenerDatosResidente(idUsuario) {
        return await dashboardRepository.obtenerDatosResidente(idUsuario);
    }

    static async obtenerMultasResidente(idApartamento) {
        return await dashboardRepository.obtenerMultasResidente(idApartamento);
    }

    static async obtenerReservasResidente(idPropietario) {
        return await dashboardRepository.obtenerReservasResidente(idPropietario);
    }

    static async obtenerPqrsResidente(idPropietario) {
        return await dashboardRepository.obtenerPqrsResidente(idPropietario);
    }

    static async obtenerNoticiasResidente() {
        return await dashboardRepository.obtenerNoticiasResidente();
    }
}

module.exports = DashboardModel;