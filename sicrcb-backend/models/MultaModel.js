// sicrcb-backend/models/MultaModel.js
const MultaRepository = require('../repositories/MultaRepository');

// Instancia única del repositorio
const multaRepository = new MultaRepository();

class MultaModel {
    // 1. Listado global para Administrador
    static async listarTodas() {
        return await multaRepository.listarTodas();
    }

    // 2. Multas asignadas al apartamento del Residente en sesión
    static async listarPorUsuario(idUsuario) {
        return await multaRepository.listarPorUsuario(idUsuario);
    }

    // 3. Detalle de una multa por ID
    static async obtenerPorId(id) {
        return await multaRepository.obtenerPorId(id);
    }

    // 4. Resolver el id de Administrador asociado al id_usuario
    static async resolverIdAdministrador(idUsuario) {
        return await multaRepository.resolverIdAdministrador(idUsuario);
    }

    // 5. Insertar nueva multa
    static async crear({ numero, nombre, descripcion, idTipoMulta, idAdministrador, evidencia, estado, idApartamento }) {
        return await multaRepository.crear({ numero, nombre, descripcion, idTipoMulta, idAdministrador, evidencia, estado, idApartamento });
    }

    // 6. Actualizar campos dinámicos
    static async actualizar(id, campos) {
        return await multaRepository.actualizar(id, campos);
    }

    // 7. Eliminar multa
    static async eliminar(id) {
        return await multaRepository.eliminar(id);
    }
}

module.exports = MultaModel;