// sicrcb-backend/services/MultaService.js
const MultaModel = require('../models/MultaModel');

class MultaService {
    static async listarTodas() {
        return await MultaModel.listarTodas();
    }

    static async listarMisMultas(idUsuario) {
        if (!idUsuario) {
            throw new Error('ID de usuario no proporcionado.');
        }
        return await MultaModel.listarPorUsuario(idUsuario);
    }

    static async obtenerPorId(id) {
        const multa = await MultaModel.obtenerPorId(id);
        if (!multa) {
            const error = new Error('Multa no encontrada');
            error.statusCode = 404;
            throw error;
        }
        return multa;
    }

    static async registrarMulta(idUsuarioAdmin, { nombre, descripcion, id_tipo_multa, idApartamento, evidencia, estado }) {
        const idAdministrador = await MultaModel.resolverIdAdministrador(idUsuarioAdmin);
        if (!idAdministrador) {
            const error = new Error('No existe ningún administrador registrado en el sistema.');
            error.statusCode = 400;
            throw error;
        }

        const numeroSancion = Math.floor(100000 + Math.random() * 900000);

        const idInsertado = await MultaModel.crear({
            numero: numeroSancion,
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            idTipoMulta: parseInt(id_tipo_multa, 10),
            idAdministrador,
            evidencia: evidencia ? evidencia.trim() : 'Sin evidencia adjunta',
            estado: estado ? estado.trim() : 'Pendiente',
            idApartamento: parseInt(idApartamento, 10)
        });

        return {
            message: 'Sanción registrada exitosamente',
            id: idInsertado,
            numero: numeroSancion
        };
    }

    static async actualizarMulta(id, datos) {
        const existente = await MultaModel.obtenerPorId(id);
        if (!existente) {
            const error = new Error('La sanción especificada no existe');
            error.statusCode = 404;
            throw error;
        }

        const campos = {};
        if (datos.nombre !== undefined) campos.nombre = datos.nombre.trim();
        if (datos.descripcion !== undefined) campos.descripcion = datos.descripcion.trim();
        if (datos.id_tipo_multa !== undefined) campos.id_tipo_multa = parseInt(datos.id_tipo_multa, 10);
        
        const targetApto = datos.idApartamento !== undefined ? datos.idApartamento : datos.id_apartamento;
        if (targetApto !== undefined) campos.id_apartamento = parseInt(targetApto, 10);
        
        if (datos.evidencia !== undefined) campos.evidencia = datos.evidencia ? datos.evidencia.trim() : 'Sin evidencia adjunta';
        if (datos.estado !== undefined) campos.estado = datos.estado.trim();

        if (Object.keys(campos).length === 0) {
            const error = new Error('Debe especificar al menos un campo para actualizar');
            error.statusCode = 400;
            throw error;
        }

        await MultaModel.actualizar(id, campos);
        return { message: 'Información de la sanción actualizada exitosamente' };
    }

    static async eliminarMulta(id) {
        const eliminado = await MultaModel.eliminar(id);
        if (!eliminado) {
            const error = new Error('La sanción no existe o ya fue eliminada');
            error.statusCode = 404;
            throw error;
        }
        return { message: 'Multa eliminada exitosamente' };
    }
}

module.exports = MultaService;