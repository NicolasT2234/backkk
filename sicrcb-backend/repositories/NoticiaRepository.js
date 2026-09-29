// sicrcb-backend/repositories/NoticiaRepository.js
const pool = require('../database/db');

class NoticiaRepository {
    // 1. Listado completo (Admin)
    async listarTodas() {
        const query = 'SELECT id, descripcion, fecha_publicacion, archivo_url FROM noticia ORDER BY id DESC';
        const [filas] = await pool.query(query);
        return filas;
    }

    // 2. Últimas 3 noticias destacadas (Público)
    async listarDestacadas() {
        const query = 'SELECT id, descripcion, fecha_publicacion, archivo_url FROM noticia ORDER BY id DESC LIMIT 3';
        const [filas] = await pool.query(query);
        return filas;
    }

    // 3. Detalle de una noticia por ID
    async obtenerPorId(id) {
        const query = 'SELECT id, descripcion, fecha_publicacion, archivo_url FROM noticia WHERE id = ? LIMIT 1';
        const [filas] = await pool.query(query, [id]);
        return filas.length > 0 ? filas[0] : null;
    }

    // 4. Crear noticia
    async crear({ descripcion, fechaPublicacion, archivoUrl, idAdministrador }) {
        const query = `
            INSERT INTO noticia (descripcion, fecha_publicacion, archivo_url, estado, id_administrador)
            VALUES (?, ?, ?, 'Activa', ?)
        `;
        const [resultado] = await pool.query(query, [descripcion, fechaPublicacion, archivoUrl, idAdministrador]);
        return resultado.insertId;
    }

    // 5. Actualizar noticia
    async actualizar(id, { descripcion, fechaPublicacion, archivoUrl }) {
        if (archivoUrl) {
            const query = 'UPDATE noticia SET descripcion = ?, fecha_publicacion = ?, archivo_url = ? WHERE id = ?';
            const [resultado] = await pool.query(query, [descripcion, fechaPublicacion, archivoUrl, id]);
            return resultado.affectedRows > 0;
        } else {
            const query = 'UPDATE noticia SET descripcion = ?, fecha_publicacion = ? WHERE id = ?';
            const [resultado] = await pool.query(query, [descripcion, fechaPublicacion, id]);
            return resultado.affectedRows > 0;
        }
    }

    // 6. Eliminar noticia
    async eliminar(id) {
        const [resultado] = await pool.query('DELETE FROM noticia WHERE id = ?', [id]);
        return resultado.affectedRows > 0;
    }
}

module.exports = NoticiaRepository;