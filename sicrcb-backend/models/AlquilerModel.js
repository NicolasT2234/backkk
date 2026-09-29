// sicrcb-backend/models/AlquilerModel.js
const AlquilerRepository = require('../repositories/AlquilerRepository');

// Instancia única del repositorio
const alquilerRepository = new AlquilerRepository();

class AlquilerModel {
    // 1. Obtener tarifas e inventario base
    static async obtenerConfiguracion() {
        return await alquilerRepository.obtenerConfiguracion();
    }

    // 2. Actualizar configuración (Admin)
    static async actualizarConfiguracion({ valorHoraSalon, valorHoraSillas, totalSillas }) {
        return await alquilerRepository.actualizarConfiguracion({ valorHoraSalon, valorHoraSillas, totalSillas });
    }

    // 3. Reservas por fecha (para la matriz de ocupación)
    static async obtenerReservasPorFecha(fecha) {
        return await alquilerRepository.obtenerReservasPorFecha(fecha);
    }

    // 4. Listado global (Admin)
    static async listarTodos() {
        return await alquilerRepository.listarTodos();
    }

    // 5. Listado de alquileres de un residente
    static async listarPorUsuario(idUsuario) {
        return await alquilerRepository.listarPorUsuario(idUsuario);
    }

    // 6. Obtener detalle por ID
    static async obtenerPorId(id) {
        return await alquilerRepository.obtenerPorId(id);
    }

    // 7. Crear alquiler con transacción y validación de choques
    static async crearReserva(idUsuario, { descripcion, horaInicio, horaFin, tipoAlquiler, cantidadSillas }) {
        return await alquilerRepository.crearReserva(idUsuario, { descripcion, horaInicio, horaFin, tipoAlquiler, cantidadSillas });
    }

    // 8. Actualizar estado (Admin)
    static async actualizarEstado(id, estado) {
        return await alquilerRepository.actualizarEstado(id, estado);
    }

    // 9. Cancelar / Eliminar reserva (Transaccional)
    static async eliminarReserva(id) {
        return await alquilerRepository.eliminarReserva(id);
    }
}

module.exports = AlquilerModel;