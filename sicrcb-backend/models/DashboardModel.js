// sicrcb-backend/models/DashboardModel.js
const DashboardRepository = require('../repositories/DashboardRepository');

class DashboardModel {
    // --- CONSULTAS ADMINISTRADOR ---
    static async obtenerMetricasAdmin() {
        return await DashboardRepository.obtenerMetricasAdmin();
    }

    static async obtenerActividadRecienteAdmin() {
        return await DashboardRepository.obtenerActividadRecienteAdmin();
    }

    // --- CONSULTAS RESIDENTE ---
    static async obtenerDatosResidente(idUsuario) {
        return await DashboardRepository.obtenerDatosResidente(idUsuario);
    }

    static async obtenerMultasResidente(idApartamento) {
        return await DashboardRepository.obtenerMultasResidente(idApartamento);
    }

    static async obtenerReservasResidente(idPropietario) {
        return await DashboardRepository.obtenerReservasResidente(idPropietario);
    }

    static async obtenerPqrsResidente(idPropietario) {
        return await DashboardRepository.obtenerPqrsResidente(idPropietario);
    }

    static async obtenerNoticiasResidente() {
        return await DashboardRepository.obtenerNoticiasResidente();
    }
}

module.exports = DashboardModel;