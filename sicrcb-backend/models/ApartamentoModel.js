// sicrcb-backend/models/ApartamentoModel.js
const pool = require('../database/db');

class ApartamentoModel {
    static async listarTodos() {
        const query = `
            SELECT a.id, a.numero, a.estado,
                   b.nombre AS bloque_nombre,
                   i.numero AS interior,
                   ud.primer_nombre AS nombre_propietario, ud.primer_apellido AS apellido_propietario
            FROM apartamento a
            JOIN interior i ON a.id_interior = i.id
            JOIN bloque b ON i.id_bloque = b.id
            LEFT JOIN (
                SELECT pga.id_apartamento, pga.id_propietario
                FROM propietario_gestion_apartamento pga
                WHERE pga.estado = 'Activo'
                  AND pga.fecha_registro = (
                      SELECT MAX(pga2.fecha_registro)
                      FROM propietario_gestion_apartamento pga2
                      WHERE pga2.id_apartamento = pga.id_apartamento AND pga2.estado = 'Activo'
                  )
            ) latest_pga ON latest_pga.id_apartamento = a.id
            LEFT JOIN propietario p ON latest_pga.id_propietario = p.id
            LEFT JOIN user_data ud ON p.id_user_data = ud.id
            ORDER BY b.nombre, a.numero
        `;
        const [filas] = await pool.query(query);
        return filas;
    }

    static async obtenerPorId(id) {
        const query = `
            SELECT a.id, a.numero, a.estado,
                   b.nombre AS bloque_nombre,
                   i.numero AS interior,
                   ud.primer_nombre AS nombre_propietario, ud.primer_apellido AS apellido_propietario
            FROM apartamento a
            JOIN interior i ON a.id_interior = i.id
            JOIN bloque b ON i.id_bloque = b.id
            LEFT JOIN (
                SELECT pga.id_apartamento, pga.id_propietario
                FROM propietario_gestion_apartamento pga
                WHERE pga.estado = 'Activo'
                  AND pga.fecha_registro = (
                      SELECT MAX(pga2.fecha_registro)
                      FROM propietario_gestion_apartamento pga2
                      WHERE pga2.id_apartamento = pga.id_apartamento AND pga2.estado = 'Activo'
                  )
            ) latest_pga ON latest_pga.id_apartamento = a.id
            LEFT JOIN propietario p ON latest_pga.id_propietario = p.id
            LEFT JOIN user_data ud ON p.id_user_data = ud.id
            WHERE a.id = ?
        `;
        const [filas] = await pool.query(query, [id]);
        return filas.length > 0 ? filas[0] : null;
    }

    static async crear({ numero, estado, idInterior }) {
        const query = 'INSERT INTO apartamento (numero, estado, id_interior) VALUES (?, ?, ?)';
        const [resultado] = await pool.query(query, [numero, estado, idInterior]);
        return resultado.insertId;
    }

    static async actualizar(id, campos) {
        const updates = [];
        const values = [];
        for (const [col, val] of Object.entries(campos)) {
            updates.push(`${col} = ?`);
            values.push(val);
        }
        values.push(id);
        const query = `UPDATE apartamento SET ${updates.join(', ')} WHERE id = ?`;
        const [resultado] = await pool.query(query, values);
        return resultado.affectedRows > 0;
    }

    static async eliminar(id) {
        const [resultado] = await pool.query('DELETE FROM apartamento WHERE id = ?', [id]);
        return resultado.affectedRows > 0;
    }
}

module.exports = ApartamentoModel;