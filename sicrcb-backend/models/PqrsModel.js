// sicrcb-backend/models/PqrsModel.js
const PqrsRepository = require('../repositories/PqrsRepository');

// Instancia única del repositorio
const pqrsRepository = new PqrsRepository();

class PqrsModel {
    // 1. Listar todas las PQRs (Admin)
    static async listarTodas() {
        return await pqrsRepository.listarTodas();
    }

    // 2. Obtener apartamento activo del residente
    static async obtenerApartamentoActivo(idUsuario) {
        return await pqrsRepository.obtenerApartamentoActivo(idUsuario);
    }

    // 3. Listar PQRs radicadas por el usuario actual
    static async listarPorUsuario(idUsuario) {
        return await pqrsRepository.listarPorUsuario(idUsuario);
    }

    // 4. Detalle de PQR por ID
    static async obtenerPorId(id) {
        return await pqrsRepository.obtenerPorId(id);
    }

    // 5. Radicación completa con transacción
    static async radicarPqr(idUsuario, { descripcion, tipo, idApartamento }) {
        return await pqrsRepository.radicarPqr(idUsuario, { descripcion, tipo, idApartamento });
    }

    // 6. Verificar pertenencia y estado (para residentes)
    static async verificarPropietarioPqr(idPqr, idUsuario) {
        return await pqrsRepository.verificarPropietarioPqr(idPqr, idUsuario);
    }

    // 7. Actualizar PQR
    static async actualizar(idPqr, campos) {
        return await pqrsRepository.actualizar(idPqr, campos);
    }

    // 8. Eliminar PQR (transaccional)
    static async eliminar(idPqr) {
        return await pqrsRepository.eliminar(idPqr);
    }
}

module.exports = PqrsModel;