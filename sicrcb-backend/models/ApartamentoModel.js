// sicrcb-backend/models/ApartamentoModel.js
const ApartamentoRepository = require('../repositories/ApartamentoRepository');

// Instancia única del repositorio
const apartamentoRepository = new ApartamentoRepository();

class ApartamentoModel {
    static async listarTodos() {
        return await apartamentoRepository.listarTodos();
    }

    static async obtenerPorId(id) {
        return await apartamentoRepository.obtenerPorId(id);
    }

    static async crear({ numero, estado, idInterior }) {
        return await apartamentoRepository.crear({ numero, estado, idInterior });
    }

    static async actualizar(id, campos) {
        return await apartamentoRepository.actualizar(id, campos);
    }

    static async eliminar(id) {
        return await apartamentoRepository.eliminar(id);
    }
}

module.exports = ApartamentoModel;