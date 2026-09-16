// sicrcb-backend/services/TipoMultaService.js
const TipoMultaModel = require('../models/TipoMultaModel');

class TipoMultaService {
    static async listarTodos() {
        return await TipoMultaModel.listarTodos();
    }

    static async obtenerPorId(id) {
        const item = await TipoMultaModel.obtenerPorId(id);
        if (!item) {
            const err = new Error('Tipo de multa no encontrado');
            err.statusCode = 404;
            throw err;
        }
        return item;
    }

    static async crear({ numero, descripcion, valor, estado }) {
        const estadoFinal = (estado && (estado.toLowerCase() === 'activa' || estado.toLowerCase() === 'activo')) ? 'Activa' : 'Inactiva';
        const id = await TipoMultaModel.crear({
            numero: numero.trim(),
            descripcion: descripcion.trim(),
            valor: parseFloat(valor),
            estado: estadoFinal
        });
        return { message: 'Tipo de multa registrado exitosamente', id };
    }

    static async actualizar(id, datos) {
        const campos = {};
        if (datos.numero !== undefined) campos.numero = datos.numero.trim();
        if (datos.descripcion !== undefined) campos.descripcion = datos.descripcion.trim();
        if (datos.valor !== undefined) campos.valor = parseFloat(datos.valor);
        if (datos.estado !== undefined) {
            const e = datos.estado.trim().toLowerCase();
            campos.estado = (e === 'activa' || e === 'activo') ? 'Activa' : 'Inactiva';
        }

        if (Object.keys(campos).length === 0) {
            const err = new Error('Debe proporcionar al menos un campo para actualizar');
            err.statusCode = 400;
            throw err;
        }

        await TipoMultaModel.actualizar(id, campos);
        return { message: 'Tipo de multa actualizado correctamente' };
    }

    static async eliminar(id) {
        await TipoMultaModel.eliminar(id);
        return { message: 'Tipo de multa eliminado exitosamente' };
    }
}

module.exports = TipoMultaService;