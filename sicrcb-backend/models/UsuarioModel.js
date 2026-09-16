// sicrcb-backend/models/UsuarioModel.js
const pool = require('../database/db');

class UsuarioModel {
    // 1. Validar credenciales y estado en login
    static async validarCredenciales(email, contraseña) {
        const query = `
            SELECT 
                u.id, 
                u.email, 
                u.estado, 
                r.nombre AS rol, 
                COALESCE(ud.primer_nombre, 'Administrador') AS nombre, 
                COALESCE(ud.primer_apellido, '') AS apellido
            FROM usuario u
            JOIN rol_usuario ru ON u.id = ru.id_user
            JOIN rol r ON ru.id_rol = r.id
            LEFT JOIN user_data ud ON u.id = ud.id_usuario
            WHERE u.email = ? AND u.contraseña = SHA2(?, 256)
            LIMIT 1
        `;
        const [rows] = await pool.query(query, [email.trim(), contraseña.trim()]);
        return rows.length > 0 ? rows[0] : null;
    }

    // 2. Buscar por email para recuperación de contraseña
    static async buscarPorEmail(email) {
        const query = 'SELECT id, email FROM usuario WHERE email = ? LIMIT 1';
        const [rows] = await pool.query(query, [email.trim().toLowerCase()]);
        return rows.length > 0 ? rows[0] : null;
    }

    // 3. Actualizar contraseña con SHA-256
    static async actualizarPassword(idUsuario, nuevaPassword) {
        const query = 'UPDATE usuario SET contraseña = SHA2(?, 256) WHERE id = ?';
        const [resultado] = await pool.query(query, [nuevaPassword, idUsuario]);
        return resultado.affectedRows > 0;
    }

    // Añadir dentro de la clase UsuarioModel en: sicrcb-backend/models/UsuarioModel.js

    // 4. Obtener perfil completo del usuario en sesión
    static async obtenerPerfilCompleto(idUsuario) {
        const query = `
            SELECT 
                u.id, 
                u.email, 
                r.nombre AS rol,
                COALESCE(ud.primer_nombre, '') AS nombres,
                COALESCE(ud.primer_nombre, '') AS nombre,
                COALESCE(ud.primer_apellido, '') AS apellidos,
                COALESCE(ud.primer_apellido, '') AS apellido,
                ud.numero_documento AS numeroDocumento,
                td.nombre_documento AS tipoDocumento
            FROM usuario u
            JOIN rol_usuario ru ON u.id = ru.id_user
            JOIN rol r ON ru.id_rol = r.id
            LEFT JOIN user_data ud ON u.id = ud.id_usuario
            LEFT JOIN tipo_documento td ON ud.id_tipo_documento = td.id
            WHERE u.id = ?
            LIMIT 1
        `;
        const [filas] = await pool.query(query, [idUsuario]);
        return filas.length > 0 ? filas[0] : null;
    }

    // 5. Actualizar perfil propio con transacción (contraseña y user_data)
    static async actualizarPerfilPropio(idUsuario, { nombres, apellidos, contraseña }) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Actualizar contraseña si fue enviada
            if (contraseña && contraseña.trim() !== '') {
                await connection.query(
                    'UPDATE usuario SET contraseña = SHA2(?, 256) WHERE id = ?',
                    [contraseña.trim(), idUsuario]
                );
            }

            // 2. Verificar existencia en user_data (UPSERT)
            const [existingUserData] = await connection.query(
                'SELECT id FROM user_data WHERE id_usuario = ?',
                [idUsuario]
            );

            if (existingUserData.length > 0) {
                const updates = [];
                const values = [];

                if (nombres) {
                    updates.push('primer_nombre = ?');
                    values.push(nombres.trim());
                }
                if (apellidos) {
                    updates.push('primer_apellido = ?');
                    values.push(apellidos.trim());
                }

                if (updates.length > 0) {
                    values.push(idUsuario);
                    await connection.query(
                        `UPDATE user_data SET ${updates.join(', ')} WHERE id_usuario = ?`,
                        values
                    );
                }
            } else {
                // Si no existía registro previo, insertar por defecto
                const [tipoDocRows] = await connection.query(
                    "SELECT id FROM tipo_documento WHERE estado = 'Activo' LIMIT 1"
                );
                const idTipoDoc = tipoDocRows.length > 0 ? tipoDocRows[0].id : 1;
                await connection.query(
                    `INSERT INTO user_data (numero_documento, primer_nombre, primer_apellido, id_usuario, id_tipo_documento)
                     VALUES (?, ?, ?, ?, ?)`,
                    [0, (nombres || 'Admin').trim(), (apellidos || 'Principal').trim(), idUsuario, idTipoDoc]
                );
            }

            await connection.commit();

            // Retornar perfil actualizado
            return await UsuarioModel.obtenerPerfilCompleto(idUsuario);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = UsuarioModel;