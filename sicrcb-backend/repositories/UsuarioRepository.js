// sicrcb-backend/repositories/UsuarioRepository.js
const pool = require('../database/db');

class UsuarioRepository {
    // 1. Validar credenciales y estado en login
    async validarCredenciales(email, contraseña) {
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
        const [rows] = await pool.query(query, [email.trim(), contraseña]);
        return rows.length > 0 ? rows[0] : null;
    }

    // 2. Buscar por email para recuperación de contraseña
    async buscarPorEmail(email) {
        const query = 'SELECT id, email FROM usuario WHERE email = ? LIMIT 1';
        const [rows] = await pool.query(query, [email.trim().toLowerCase()]);
        return rows.length > 0 ? rows[0] : null;
    }

    // 3. Actualizar contraseña con SHA-256
    async actualizarPassword(idUsuario, nuevaPassword) {
        const query = 'UPDATE usuario SET contraseña = SHA2(?, 256) WHERE id = ?';
        const [resultado] = await pool.query(query, [nuevaPassword, idUsuario]);
        return resultado.affectedRows > 0;
    }

    // 4. Obtener perfil completo del usuario en sesión
    async obtenerPerfilCompleto(idUsuario) {
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
    async actualizarPerfilPropio(idUsuario, { nombres, apellidos, contraseña }) {
        // Validar parámetros de entrada
        const validNombres = typeof nombres === 'string' ? nombres.trim() : '';
        const validApellidos = typeof apellidos === 'string' ? apellidos.trim() : '';
        const validContrasena = typeof contraseña === 'string' ? contraseña : null;

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Actualizar contraseña si fue enviada
            if (validContrasena && validContrasena.trim() !== '') {
                await connection.query(
                    'UPDATE usuario SET contraseña = SHA2(?, 256) WHERE id = ?',
                    [validContrasena.trim(), idUsuario]
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

                if (validNombres) {
                    updates.push('primer_nombre = ?');
                    values.push(validNombres);
                }
                if (validApellidos) {
                    updates.push('primer_apellido = ?');
                    values.push(validApellidos);
                }

                // Solo ejecutar UPDATE si hay campos que actualizar
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
                    "SELECT id FROM tipo_documento WHERE estado = 'Activo' ORDER BY id LIMIT 1"
                );
                // Usar el primero disponible o un valor por defecto seguro
                const idTipoDoc = tipoDocRows.length > 0 ? tipoDocRows[0].id : 1;

                // Nota: Se asume que existe al menos un tipo de documento activo en el sistema.
                // En un entorno de producción, esto debería garantizarse mediante migraciones de base de datos.
                await connection.query(
                    `INSERT INTO user_data (numero_documento, primer_nombre, primer_apellido, id_usuario, id_tipo_documento)
                     VALUES (?, ?, ?, ?, ?)`,
                    [0, validNombres || 'Admin', validApellidos || 'Principal', idUsuario, idTipoDoc]
                );
            }

            await connection.commit();

            // Retornar perfil actualizado
            return await this.obtenerPerfilCompleto(idUsuario);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = UsuarioRepository;