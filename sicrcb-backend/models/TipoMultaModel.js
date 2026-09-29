// sicrcb-backend/models/TipoMultaModel.js
const TipoMultaRepository = require('../repositories/TipoMultaRepository');

// Instancia única del repositorio
const tipoMultaRepository = new TipoMultaRepository();

class TipoMultaModel {
    static async listarTodos() {
        return await tipoMultaRepository.listarTodos();
    }

    static async obtenerPorId(id) {
        return await tipoMultaRepository.obtenerPorId(id);
    }

    static async crear({ numero, descripcion, valor, estado }) {
        return await tipoMultaRepository.crear({ numero, descripcion, valor, estado });
    }

    static async actualizar(id, campos) {
        return await tipoMultaRepository.actualizar(id, campos);
    }

    static async eliminar(id) {
        return await tipoMultaRepository.eliminar(id);
    }
}

module.exports = TipoMultaModel;