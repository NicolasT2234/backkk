// sicrcb-backend/services/NoticiaService.js
const NoticiaModel = require('../models/NoticiaModel');

// Helper para compatibilidad de campos en React
const formatearNoticia = (row) => ({
    id: row.id,
    titulo: row.descripcion,
    contenido: row.descripcion,
    fecha_publicacion: row.fecha_publicacion,
    archivo_url: row.archivo_url
});

class NoticiaService {
    static async listarTodas() {
        const filas = await NoticiaModel.listarTodas();
        return filas.map(formatearNoticia);
    }

    static async listarDestacadas() {
        const filas = await NoticiaModel.listarDestacadas();
        return filas.map(formatearNoticia);
    }

    static async obtenerPorId(id) {
        const noticia = await NoticiaModel.obtenerPorId(id);
        if (!noticia) {
            const error = new Error('Noticia no encontrada');
            error.statusCode = 404;
            throw error;
        }
        return formatearNoticia(noticia);
    }

    static async crear(idUsuario, { descripcion, fechaPublicacion, archivoUrl }) {
        if (!descripcion || !descripcion.trim()) {
            const error = new Error('La descripción es requerida');
            error.statusCode = 400;
            throw error;
        }

        let fechaParsed = new Date();
        if (fechaPublicacion && fechaPublicacion.includes('T') && fechaPublicacion.length > 10) {
            fechaParsed = new Date(fechaPublicacion);
        }

        const id = await NoticiaModel.crear({
            descripcion: descripcion.trim(),
            fechaPublicacion: fechaParsed,
            archivoUrl,
            idAdministrador: idUsuario
        });

        return { message: 'Noticia creada exitosamente', id };
    }

    static async actualizar(id, { descripcion, fechaPublicacion, archivoUrl }) {
        if (!descripcion || !descripcion.trim()) {
            const error = new Error('La descripción es requerida');
            error.statusCode = 400;
            throw error;
        }

        let fechaParsed = new Date();
        if (fechaPublicacion && fechaPublicacion.includes('T') && fechaPublicacion.length > 10) {
            fechaParsed = new Date(fechaPublicacion);
        }

        await NoticiaModel.actualizar(id, {
            descripcion: descripcion.trim(),
            fechaPublicacion: fechaParsed,
            archivoUrl
        });

        return { message: 'Noticia actualizada exitosamente' };
    }

    static async eliminar(id) {
        const eliminado = await NoticiaModel.eliminar(id);
        if (!eliminado) {
            const error = new Error('La noticia no existe o ya fue eliminada');
            error.statusCode = 404;
            throw error;
        }
        return { message: 'Noticia eliminada exitosamente' };
    }
}

module.exports = NoticiaService;