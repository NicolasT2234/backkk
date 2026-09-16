// sicrcb-backend/services/ApartamentoService.js
const ApartamentoModel = require('../models/ApartamentoModel');

class ApartamentoService {
    static async listarTodos() {
        return await ApartamentoModel.listarTodos();
    }

    static async obtenerPorId(id) {
        const apto = await ApartamentoModel.obtenerPorId(id);
        if (!apto) {
            const err = new Error('Apartamento no encontrado');
            err.statusCode = 404;
            throw err;
        }
        return apto;
    }

    static async crear(datos) {
        const id = await ApartamentoModel.crear(datos);
        return { message: 'Apartamento creado exitosamente', id };
    }

    static async actualizar(id, datos) {
        const campos = {};
        if (datos.numero !== undefined) campos.numero = datos.numero;
        if (datos.estado !== undefined) campos.estado = datos.estado;
        if (datos.idInterior !== undefined) campos.id_interior = datos.idInterior;

        if (Object.keys(campos).length === 0) {
            const err = new Error('No hay campos para actualizar');
            err.statusCode = 400;
            throw err;
        }

        await ApartamentoModel.actualizar(id, campos);
        return { message: 'Apartamento actualizado exitosamente' };
    }

    static async eliminar(id) {
        await ApartamentoModel.eliminar(id);
        return { message: 'Apartamento eliminado exitosamente' };
    }
}

module.exports = ApartamentoService;