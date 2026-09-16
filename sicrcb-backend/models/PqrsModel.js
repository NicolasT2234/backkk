// sicrcb-backend/models/PqrsModel.js
const pool = require('../database/db');

class PqrsModel {
    // 1. Listar todas las PQRs (Admin)
    static async listarTodas() {
        const query = `
            SELECT qs.id, qs.descripcion_pqr AS descripcion, qs.fecha AS fecha_creacion,
                   qs.estado, qs.titulo_pqr AS tipo,
                   ud.primer_nombre AS nombre_usuario, ud.primer_apellido AS apellido_usuario,
                   b.nombre AS bloque, ap.numero, i.numero AS interior
            FROM queja_sugerencia qs
            JOIN propietario p ON qs.id_propietario = p.id
            JOIN user_data ud ON p.id_user_data = ud.id
            JOIN pqr_especifica pe ON qs.id = pe.id_queja_sugerencia
            JOIN apartamento ap ON pe.id_apartamento = ap.id
            JOIN interior i ON ap.id_interior = i.id
            JOIN bloque b ON i.id_bloque = b.id
            ORDER BY qs.fecha DESC
        `;
        const [filas] = await pool.query(query);
        return filas;
    }

    // 2. Obtener apartamento activo del residente
    static async obtenerApartamentoActivo(idUsuario) {
        const query = `
            SELECT ap.id AS idApartamento, ap.numero AS numeroApartamento,
                   i.numero AS interior, b.nombre AS bloque
            FROM propietario_gestion_apartamento pga
            JOIN propietario p ON pga.id_propietario = p.id
            JOIN user_data ud ON p.id_user_data = ud.id
            JOIN apartamento ap ON pga.id_apartamento = ap.id
            JOIN interior i ON ap.id_interior = i.id
            JOIN bloque b ON i.id_bloque = b.id
            WHERE ud.id_usuario = ? AND pga.estado = 'Activo'
            ORDER BY pga.fecha_registro DESC
            LIMIT 1
        `;
        const [filas] = await pool.query(query, [idUsuario]);
        return filas.length > 0 ? filas[0] : null;
    }

    // 3. Listar PQRs radicadas por el usuario actual
    static async listarPorUsuario(idUsuario) {
        const query = `
            SELECT qs.id, qs.descripcion_pqr AS descripcion, qs.fecha AS fecha_creacion,
                   qs.estado, qs.titulo_pqr AS tipo,
                   b.nombre AS bloque, ap.numero, i.numero AS interior
            FROM queja_sugerencia qs
            JOIN propietario p ON qs.id_propietario = p.id
            JOIN user_data ud ON p.id_user_data = ud.id
            JOIN pqr_especifica pe ON qs.id = pe.id_queja_sugerencia
            JOIN apartamento ap ON pe.id_apartamento = ap.id
            JOIN interior i ON ap.id_interior = i.id
            JOIN bloque b ON i.id_bloque = b.id
            WHERE ud.id_usuario = ?
            ORDER BY qs.fecha DESC
        `;
        const [filas] = await pool.query(query, [idUsuario]);
        return filas;
    }

    // 4. Detalle de PQR por ID
    static async obtenerPorId(id) {
        const query = `
            SELECT qs.id, qs.descripcion_pqr AS descripcion, qs.fecha AS fecha_creacion,
                   qs.estado, qs.titulo_pqr AS tipo,
                   ud.primer_nombre AS nombre_usuario, ud.primer_apellido AS apellido_usuario,
                   b.nombre AS bloque, ap.numero, i.numero AS interior
            FROM queja_sugerencia qs
            JOIN propietario p ON qs.id_propietario = p.id
            JOIN user_data ud ON p.id_user_data = ud.id
            JOIN pqr_especifica pe ON qs.id = pe.id_queja_sugerencia
            JOIN apartamento ap ON pe.id_apartamento = ap.id
            JOIN interior i ON ap.id_interior = i.id
            JOIN bloque b ON i.id_bloque = b.id
            WHERE qs.id = ?
            LIMIT 1
        `;
        const [filas] = await pool.query(query, [id]);
        return filas.length > 0 ? filas[0] : null;
    }

    // 5. Radicación completa con transacción
    static async radicarPqr(idUsuario, { descripcion, tipo, idApartamento }) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // A. Resolver propietario
            const [userData] = await connection.query('SELECT id FROM user_data WHERE id_usuario = ?', [idUsuario]);
            if (userData.length === 0) {
                throw new Error('Información de perfil no encontrada');
            }

            const [propietario] = await connection.query('SELECT id FROM propietario WHERE id_user_data = ?', [userData[0].id]);
            if (propietario.length === 0) {
                throw new Error('No se encontró un perfil de propietario asociado');
            }
            const idPropietario = propietario[0].id;

            // B. Resolver o validar apartamento
            let apartamentoFinal = idApartamento;
            if (!apartamentoFinal) {
                const [gestion] = await connection.query(
                    `SELECT id_apartamento FROM propietario_gestion_apartamento 
                     WHERE id_propietario = ? AND estado = 'Activo' 
                     ORDER BY fecha_registro DESC LIMIT 1`,
                    [idPropietario]
                );
                if (gestion.length === 0) {
                    throw new Error('No tienes un apartamento activo asignado para radicar la PQR');
                }
                apartamentoFinal = gestion[0].id_apartamento;
            } else {
                const [gestion] = await connection.query(
                    `SELECT id FROM propietario_gestion_apartamento 
                     WHERE id_propietario = ? AND id_apartamento = ? AND estado = 'Activo'`,
                    [idPropietario, apartamentoFinal]
                );
                if (gestion.length === 0) {
                    const err = new Error('No tienes permiso para crear una PQR para este apartamento');
                    err.statusCode = 403;
                    throw err;
                }
            }

            // C. Asignar administrador activo
            const [adminRows] = await connection.query("SELECT id FROM administrador WHERE estado = 'Activo' LIMIT 1");
            if (adminRows.length === 0) {
                throw new Error('No hay administradores activos disponibles en el sistema');
            }
            const idAdministrador = adminRows[0].id;

            // D. Insertar en queja_sugerencia
            const [qsResult] = await connection.query(
                `INSERT INTO queja_sugerencia (id_propietario, id_administrador, descripcion_pqr, titulo_pqr, estado, fecha) 
                 VALUES (?, ?, ?, ?, 'Pendiente', NOW())`,
                [idPropietario, idAdministrador, descripcion.trim(), tipo.trim()]
            );
            const idQuejaSugerencia = qsResult.insertId;

            // E. Vincular con pqr_especifica
            await connection.query(
                'INSERT INTO pqr_especifica (id_queja_sugerencia, id_apartamento) VALUES (?, ?)',
                [idQuejaSugerencia, apartamentoFinal]
            );

            await connection.commit();
            return idQuejaSugerencia;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // 6. Verificar pertenencia y estado (para residentes)
    static async verificarPropietarioPqr(idPqr, idUsuario) {
        const query = `
            SELECT qs.id, qs.estado 
            FROM queja_sugerencia qs
            JOIN propietario p ON qs.id_propietario = p.id
            JOIN user_data ud ON p.id_user_data = ud.id
            WHERE qs.id = ? AND ud.id_usuario = ?
        `;
        const [filas] = await pool.query(query, [idPqr, idUsuario]);
        return filas.length > 0 ? filas[0] : null;
    }

    // 7. Actualizar PQR
    static async actualizar(idPqr, campos) {
        const updates = [];
        const values = [];

        for (const [col, val] of Object.entries(campos)) {
            updates.push(`${col} = ?`);
            values.push(val);
        }
        values.push(idPqr);

        await pool.query(`UPDATE queja_sugerencia SET ${updates.join(', ')} WHERE id = ?`, values);
        return true;
    }

    // 8. Eliminar PQR (transaccional)
    static async eliminar(idPqr) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query('DELETE FROM pqr_especifica WHERE id_queja_sugerencia = ?', [idPqr]);
            await connection.query('DELETE FROM queja_sugerencia WHERE id = ?', [idPqr]);
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = PqrsModel;