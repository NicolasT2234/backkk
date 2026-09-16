// sicrcb-backend/services/PqrsService.js
const PqrsModel = require('../models/PqrsModel');

class PqrsService {
    static async listarTodas() {
        return await PqrsModel.listarTodas();
    }

    static async obtenerMiApartamento(idUsuario) {
        return await PqrsModel.obtenerApartamentoActivo(idUsuario);
    }

    static async listarMisPqrs(idUsuario) {
        return await PqrsModel.listarPorUsuario(idUsuario);
    }

    static async obtenerPorId(id) {
        const pqr = await PqrsModel.obtenerPorId(id);
        if (!pqr) {
            const error = new Error('PQR no encontrada');
            error.statusCode = 404;
            throw error;
        }
        return pqr;
    }

    static async crear(idUsuario, datos) {
        const idInsertado = await PqrsModel.radicarPqr(idUsuario, datos);
        return { message: 'PQR creada exitosamente', id: idInsertado };
    }

    static async actualizar(idPqr, idUsuario, esAdmin, { descripcion, estado, tipo }) {
        if (!descripcion && !estado && !tipo) {
            const error = new Error('Al menos un campo debe proporcionarse');
            error.statusCode = 400;
            throw error;
        }

        // Si no es admin, validar propiedad y estado Pendiente
        if (!esAdmin) {
            const pertenencia = await PqrsModel.verificarPropietarioPqr(idPqr, idUsuario);
            if (!pertenencia) {
                const error = new Error('No tienes permiso para actualizar esta PQR');
                error.statusCode = 403;
                throw error;
            }
            if (pertenencia.estado.toLowerCase() !== 'pendiente') {
                const error = new Error('Solo puedes actualizar tu PQR mientras su estado se encuentre en "Pendiente".');
                error.statusCode = 400;
                throw error;
            }
        }

        const campos = {};
        if (descripcion !== undefined) campos.descripcion_pqr = descripcion.trim();
        if (tipo !== undefined) campos.titulo_pqr = tipo.trim();
        if (estado !== undefined && esAdmin) campos.estado = estado.trim();

        await PqrsModel.actualizar(idPqr, campos);
        return { message: 'PQR actualizada exitosamente' };
    }

    static async eliminar(idPqr) {
        await PqrsModel.eliminar(idPqr);
        return { message: 'PQR eliminada exitosamente' };
    }
}

module.exports = PqrsService;