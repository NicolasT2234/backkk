// sicrcb-backend/models/MultaModel.js
const pool = require('../database/db');

class MultaModel {
    // 1. Listado global para Administrador
    static async listarTodas() {
        const query = `
            SELECT m.id, m.numero, m.nombre, m.descripcion, m.estado,
                   b.nombre AS bloque, i.numero AS interior, ap.numero AS numero_apartamento,
                   tm.valor AS monto,
                   m.evidencia, m.id_apartamento, m.id_tipo_multa,
                   tm.numero AS numero_tipo_multa, tm.descripcion AS descripcion_tipo_multa
            FROM multa m
            JOIN apartamento ap ON m.id_apartamento = ap.id
            JOIN interior i ON ap.id_interior = i.id
            JOIN bloque b ON i.id_bloque = b.id
            JOIN tipo_multa tm ON m.id_tipo_multa = tm.id
            ORDER BY m.estado ASC, m.id DESC
        `;
        const [filas] = await pool.query(query);
        return filas;
    }

    // 2. Multas asignadas al apartamento del Residente en sesión
    static async listarPorUsuario(idUsuario) {
        const query = `
            SELECT m.id, m.numero, m.nombre, m.descripcion, m.estado, m.evidencia,
                   b.nombre AS bloque, i.numero AS interior, ap.numero AS numero_apartamento,
                   tm.id AS id_tipo_multa, tm.numero AS numero_tipo_multa,
                   tm.descripcion AS descripcion_tipo_multa,
                   tm.valor AS monto
            FROM multa m
            JOIN apartamento ap ON m.id_apartamento = ap.id
            JOIN interior i ON ap.id_interior = i.id
            JOIN bloque b ON i.id_bloque = b.id
            JOIN tipo_multa tm ON m.id_tipo_multa = tm.id
            WHERE ap.id IN (
                SELECT pga.id_apartamento
                FROM propietario_gestion_apartamento pga
                JOIN propietario pt ON pga.id_propietario = pt.id
                JOIN user_data ud ON pt.id_user_data = ud.id
                WHERE ud.id_usuario = ? AND pga.estado = 'Activo'
            )
            ORDER BY m.id DESC
        `;
        const [filas] = await pool.query(query, [idUsuario]);
        return filas;
    }

    // 3. Detalle de una multa por ID
    static async obtenerPorId(id) {
        const query = `
            SELECT m.id, m.numero, m.nombre, m.descripcion, m.estado,
                   b.nombre AS bloque, i.numero AS interior, ap.numero AS numero_apartamento,
                   tm.valor AS monto,
                   m.evidencia, m.id_apartamento, m.id_tipo_multa,
                   tm.numero AS numero_tipo_multa, tm.descripcion AS descripcion_tipo_multa
            FROM multa m
            JOIN apartamento ap ON m.id_apartamento = ap.id
            JOIN interior i ON ap.id_interior = i.id
            JOIN bloque b ON i.id_bloque = b.id
            JOIN tipo_multa tm ON m.id_tipo_multa = tm.id
            WHERE m.id = ?
            LIMIT 1
        `;
        const [filas] = await pool.query(query, [id]);
        return filas.length > 0 ? filas[0] : null;
    }

    // 4. Resolver el id de Administrador asociado al id_usuario
    static async resolverIdAdministrador(idUsuario) {
        const [adminRows] = await pool.query(
            `SELECT a.id FROM administrador a
             JOIN user_data ud ON a.id_user_data = ud.id
             WHERE ud.id_usuario = ? LIMIT 1`,
            [idUsuario]
        );
        if (adminRows.length > 0) return adminRows[0].id;

        const [fallback] = await pool.query(
            "SELECT id FROM administrador WHERE estado = 'Activo' ORDER BY id ASC LIMIT 1"
        );
        if (fallback.length > 0) return fallback[0].id;

        const [anyAdmin] = await pool.query("SELECT id FROM administrador ORDER BY id ASC LIMIT 1");
        return anyAdmin.length > 0 ? anyAdmin[0].id : null;
    }

    // 5. Insertar nueva multa
    static async crear({ numero, nombre, descripcion, idTipoMulta, idAdministrador, evidencia, estado, idApartamento }) {
        const query = `
            INSERT INTO multa 
            (numero, nombre, descripcion, id_tipo_multa, id_administrador, evidencia, estado, id_apartamento) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [resultado] = await pool.query(query, [
            numero, nombre, descripcion, idTipoMulta, idAdministrador, evidencia, estado, idApartamento
        ]);
        return resultado.insertId;
    }

    // 6. Actualizar campos dinámicos
    static async actualizar(id, campos) {
        const updates = [];
        const values = [];

        for (const [columna, valor] of Object.entries(campos)) {
            updates.push(`${columna} = ?`);
            values.push(valor);
        }
        values.push(id);

        const query = `UPDATE multa SET ${updates.join(', ')} WHERE id = ?`;
        const [resultado] = await pool.query(query, values);
        return resultado.affectedRows > 0;
    }

    // 7. Eliminar multa
    static async eliminar(id) {
        const [resultado] = await pool.query('DELETE FROM multa WHERE id = ?', [id]);
        return resultado.affectedRows > 0;
    }
}

module.exports = MultaModel;