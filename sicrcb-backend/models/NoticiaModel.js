// sicrcb-backend/models/NoticiaModel.js
const NoticiaRepository = require('../repositories/NoticiaRepository');

// Instancia única del repositorio
const noticiaRepository = new NoticiaRepository();

class NoticiaModel {
    // 1. Listado completo (Admin)
    static async listarTodas() {
        return await noticiaRepository.listarTodas();
    }

    // 2. Últimas 3 noticias destacadas (Público)
    static async listarDestacadas() {
        return await noticiaRepository.listarDestacadas();
    }

    // 3. Detalle de una noticia por ID
    static async obtenerPorId(id) {
        return await noticiaRepository.obtenerPorId(id);
    }

    // 4. Crear noticia
    static async crear({ descripcion, fechaPublicacion, archivoUrl, idAdministrador }) {
        return await noticiaRepository.crear({ descripcion, fechaPublicacion, archivoUrl, idAdministrador });
    }

    // 5. Actualizar noticia
    static async actualizar(id, { descripcion, fechaPublicacion, archivoUrl }) {
        return await noticiaRepository.actualizar(id, { descripcion, fechaPublicacion, archivoUrl });
    }

    // 6. Eliminar noticia
    static async eliminar(id) {
        return await noticiaRepository.eliminar(id);
    }
}

module.exports = NoticiaModel;