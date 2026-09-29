// sicrcb-backend/repositories/TipoMultaRepository.js
const pool = require('../database/db');

class TipoMultaRepository {
    static async listarTodos() {
        const query = `
            SELECT id, numero, descripcion, valor, estado
            FROM tipo_multa
            ORDER BY CAST(numero AS UNSIGNED) ASC, numero ASC
        `;
        const [filas] = await pool.query(query);
        return filas;
    }

    static async obtenerPorId(id) {
        const query = 'SELECT id, numero, descripcion, valor, estado FROM tipo_multa WHERE id = ?';
        const [filas] = await pool.query(query, [id]);
        return filas.length > 0 ? filas[0] : null;
    }

    static async crear({ numero, descripcion, valor, estado }) {
        const query = 'INSERT INTO tipo_multa (numero, descripcion, valor, estado) VALUES (?, ?, ?, ?)';
        const [resultado] = await pool.query(query, [numero, descripcion, valor, estado]);
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
        const query = `UPDATE tipo_multa SET ${updates.join(', ')} WHERE id = ?`;
        const [resultado] = await pool.query(query, values);
        return resultado.affectedRows > 0;
    }

    static async eliminar(id) {
        const [resultado] = await pool.query('DELETE FROM tipo_multa WHERE id = ?', [id]);
        return resultado.affectedRows > 0;
    }
}

module.exports = TipoMultaRepository;