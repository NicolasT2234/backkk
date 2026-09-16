// sicrcb-backend/models/AdminUsuarioModel.js
const pool = require('../database/db');

class AdminUsuarioModel {
    // 1. Listar usuarios con búsqueda y unión de apartamentos
    static async listarUsuarios(search) {
        let query = `
            SELECT 
                u.id AS id_usuario,
                u.email,
                u.estado AS estado_usuario,
                ud.numero_documento,
                ud.id_tipo_documento,
                td.sigla AS tipo_documento,
                ud.primer_nombre,
                COALESCE(ud.segundo_nombre, '') AS segundo_nombre,
                ud.primer_apellido,
                COALESCE(ud.segundo_apellido, '') AS segundo_apellido,
                COALESCE(r.nombre, 'Propietario') AS rol,
                p.id AS id_propietario,
                a.id AS id_apartamento,
                a.numero AS numero_apartamento,
                i.numero AS numero_interior,
                b.nombre AS bloque,
                pga.estado AS estado_asignacion
            FROM usuario u
            INNER JOIN user_data ud ON u.id = ud.id_usuario
            INNER JOIN tipo_documento td ON ud.id_tipo_documento = td.id
            LEFT JOIN rol_usuario ru ON u.id = ru.id_user
            LEFT JOIN rol r ON ru.id_rol = r.id
            LEFT JOIN propietario p ON ud.id = p.id_user_data
            LEFT JOIN propietario_gestion_apartamento pga ON p.id = pga.id_propietario AND pga.estado = 'Activo'
            LEFT JOIN apartamento a ON pga.id_apartamento = a.id
            LEFT JOIN interior i ON a.id_interior = i.id
            LEFT JOIN bloque b ON i.id_bloque = b.id
        `;

        const params = [];
        if (search && search.trim() !== '') {
            const termino = `%${search.trim()}%`;
            query += `
                WHERE CAST(ud.numero_documento AS CHAR) LIKE ?
                OR CONCAT(ud.primer_nombre, ' ', ud.primer_apellido) LIKE ?
                OR CONCAT(ud.primer_nombre, ' ', COALESCE(ud.segundo_nombre, ''), ' ', ud.primer_apellido, ' ', COALESCE(ud.segundo_apellido, '')) LIKE ?
                OR u.email LIKE ?
            `;
            params.push(termino, termino, termino, termino);
        }

        query += ` ORDER BY u.id DESC`;
        const [rows] = await pool.query(query, params);
        return rows;
    }

    // 2. Obtener catálogos de documentos y apartamentos libres
    static async obtenerCatalogos(idUsuario) {
        const [tiposDocumento] = await pool.query(
            "SELECT id, sigla, nombre_documento FROM tipo_documento WHERE estado = 'Activo'"
        );

        let queryApartamentos = `
            SELECT a.id, a.numero AS numero_apto, i.numero AS interior, b.nombre AS bloque
            FROM apartamento a
            INNER JOIN interior i ON a.id_interior = i.id
            INNER JOIN bloque b ON i.id_bloque = b.id
            WHERE a.estado = 'Activo'
              AND a.id NOT IN (
                  SELECT pga.id_apartamento 
                  FROM propietario_gestion_apartamento pga
                  INNER JOIN propietario p ON pga.id_propietario = p.id
                  INNER JOIN user_data ud ON p.id_user_data = ud.id
                  INNER JOIN usuario u ON ud.id_usuario = u.id
                  WHERE pga.estado = 'Activo' AND u.estado = 'Activo'
                  ${idUsuario ? 'AND u.id != ?' : ''}
              )
            ORDER BY b.nombre, i.numero, a.numero
        `;
        const params = idUsuario ? [idUsuario] : [];
        const [apartamentos] = await pool.query(queryApartamentos, params);

        return { tiposDocumento, apartamentos };
    }

    // 3. Crear residente con transacción
    static async crearResidente({
        email, contrasenaProvisional, primerNombre, segundoNombre,
        primerApellido, segundoApellido, idTipoDocumento, numeroDocumento,
        listaApartamentos, rol
    }) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Validar unicidad
            const [existentes] = await connection.query(
                `SELECT u.id FROM usuario u 
                 LEFT JOIN user_data ud ON u.id = ud.id_usuario 
                 WHERE u.email = ? OR (ud.numero_documento = ? AND ud.id_tipo_documento = ?)`,
                [email, numeroDocumento, idTipoDocumento]
            );
            if (existentes.length > 0) {
                const err = new Error('El email o el número de documento ya está registrado en el sistema.');
                err.statusCode = 400;
                throw err;
            }

            // Validar apartamentos ocupados
            const [ocupados] = await connection.query(
                `SELECT a.numero AS numero_apto, b.nombre AS bloque, i.numero AS interior,
                        CONCAT(ud.primer_nombre, ' ', ud.primer_apellido) AS residente_activo
                 FROM propietario_gestion_apartamento pga
                 INNER JOIN apartamento a ON pga.id_apartamento = a.id
                 INNER JOIN interior i ON a.id_interior = i.id
                 INNER JOIN bloque b ON i.id_bloque = b.id
                 INNER JOIN propietario p ON pga.id_propietario = p.id
                 INNER JOIN user_data ud ON p.id_user_data = ud.id
                 INNER JOIN usuario u ON ud.id_usuario = u.id
                 WHERE pga.estado = 'Activo' AND u.estado = 'Activo' AND a.id IN (?)`,
                [listaApartamentos]
            );

            if (ocupados.length > 0) {
                const detalles = ocupados.map(o => `Apto ${o.numero_apto} (${o.bloque}, Int ${o.interior} - de ${o.residente_activo})`).join(', ');
                const err = new Error(`No se puede asignar: los siguientes apartamentos ya pertenecen a un residente activo: ${detalles}.`);
                err.statusCode = 400;
                throw err;
            }

            // Insertar usuario
            const [usuarioRes] = await connection.query(
                "INSERT INTO usuario (email, contraseña, estado) VALUES (?, SHA2(?, 256), 'Activo')",
                [email, contrasenaProvisional]
            );
            const idUsuario = usuarioRes.insertId;

            // Insertar user_data
            const [userDataRes] = await connection.query(
                `INSERT INTO user_data 
                 (numero_documento, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, id_usuario, id_tipo_documento) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [numeroDocumento, primerNombre.trim(), segundoNombre ? segundoNombre.trim() : null,
                 primerApellido.trim(), segundoApellido ? segundoApellido.trim() : null, idUsuario, idTipoDocumento]
            );
            const idUserData = userDataRes.insertId;

            // Rol
            const [rolRes] = await connection.query('SELECT id FROM rol WHERE nombre = ? LIMIT 1', [rol]);
            const idRol = rolRes.length > 0 ? rolRes[0].id : 2;
            await connection.query('INSERT INTO rol_usuario (id_user, id_rol) VALUES (?, ?)', [idUsuario, idRol]);

            // Propietario
            const [propRes] = await connection.query("INSERT INTO propietario (id_user_data, estado) VALUES (?, 'Activo')", [idUserData]);
            const idPropietario = propRes.insertId;

            // Asignar apartamentos
            for (const aptoId of listaApartamentos) {
                await connection.query(
                    "UPDATE propietario_gestion_apartamento SET estado = 'Inactivo' WHERE id_apartamento = ? AND id_propietario != ?",
                    [aptoId, idPropietario]
                );
                await connection.query(
                    `INSERT INTO propietario_gestion_apartamento (id_propietario, id_apartamento, fecha_registro, estado) 
                     VALUES (?, ?, CURDATE(), 'Activo') 
                     ON DUPLICATE KEY UPDATE estado = 'Activo'`,
                    [idPropietario, aptoId]
                );
            }

            await connection.commit();
            return { email, contrasenaProvisional };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // 4. Actualizar residente y asignaciones
    static async actualizarResidente(id, { email, primerNombre, segundoNombre, primerApellido, segundoApellido, idTipoDocumento, numeroDocumento, idApartamentos }) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            if (email) {
                await connection.query('UPDATE usuario SET email = ? WHERE id = ?', [email.trim(), id]);
            }

            const [userData] = await connection.query('SELECT id FROM user_data WHERE id_usuario = ?', [id]);
            if (userData.length === 0) {
                const err = new Error('Datos del residente no encontrados.');
                err.statusCode = 404;
                throw err;
            }
            const idUserData = userData[0].id;

            await connection.query(
                `UPDATE user_data 
                 SET primer_nombre = ?, segundo_nombre = ?, primer_apellido = ?, segundo_apellido = ?,
                     numero_documento = ?, id_tipo_documento = ? 
                 WHERE id = ?`,
                [primerNombre.trim(), segundoNombre ? segundoNombre.trim() : null, primerApellido.trim(),
                 segundoApellido ? segundoApellido.trim() : null, numeroDocumento, idTipoDocumento, idUserData]
            );

            if (Array.isArray(idApartamentos) && idApartamentos.length > 0) {
                const [ocupadosPorOtros] = await connection.query(
                    `SELECT a.numero AS numero_apto, b.nombre AS bloque, i.numero AS interior,
                            CONCAT(ud.primer_nombre, ' ', ud.primer_apellido) AS residente_activo
                     FROM propietario_gestion_apartamento pga
                     INNER JOIN apartamento a ON pga.id_apartamento = a.id
                     INNER JOIN interior i ON a.id_interior = i.id
                     INNER JOIN bloque b ON i.id_bloque = b.id
                     INNER JOIN propietario p ON pga.id_propietario = p.id
                     INNER JOIN user_data ud ON p.id_user_data = ud.id
                     INNER JOIN usuario u ON ud.id_usuario = u.id
                     WHERE pga.estado = 'Activo' AND u.estado = 'Activo' AND u.id != ? AND a.id IN (?)`,
                    [id, idApartamentos]
                );

                if (ocupadosPorOtros.length > 0) {
                    const detalles = ocupadosPorOtros.map(o => `Apto ${o.numero_apto} (${o.bloque}, Int ${o.interior} - de ${o.residente_activo})`).join(', ');
                    const err = new Error(`No se puede actualizar: los siguientes apartamentos ya pertenecen a otro residente activo: ${detalles}.`);
                    err.statusCode = 400;
                    throw err;
                }

                const [prop] = await connection.query('SELECT id FROM propietario WHERE id_user_data = ?', [idUserData]);
                if (prop.length > 0) {
                    const idPropietario = prop[0].id;

                    await connection.query(
                        "UPDATE propietario_gestion_apartamento SET estado = 'Inactivo' WHERE id_propietario = ?",
                        [idPropietario]
                    );

                    for (const aptoId of idApartamentos) {
                        const aptoNum = parseInt(aptoId, 10);
                        if (!isNaN(aptoNum)) {
                            await connection.query(
                                "UPDATE propietario_gestion_apartamento SET estado = 'Inactivo' WHERE id_apartamento = ? AND id_propietario != ?",
                                [aptoNum, idPropietario]
                            );
                            await connection.query(
                                `INSERT INTO propietario_gestion_apartamento (id_propietario, id_apartamento, fecha_registro, estado) 
                                 VALUES (?, ?, CURDATE(), 'Activo') 
                                 ON DUPLICATE KEY UPDATE estado = 'Activo'`,
                                [idPropietario, aptoNum]
                            );
                        }
                    }
                }
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // 5. Cambio de estado con blindaje de reactivación
    static async cambiarEstado(id, nuevoEstado) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            let advertencia = null;
            let apartamentosOcupados = [];

            if (nuevoEstado === 'Activo') {
                await connection.query('UPDATE usuario SET estado = ? WHERE id = ?', ['Activo', id]);
                await connection.query(
                    `UPDATE propietario p 
                     INNER JOIN user_data ud ON p.id_user_data = ud.id 
                     SET p.estado = 'Activo' WHERE ud.id_usuario = ?`,
                    [id]
                );

                // Detectar si algún apartamento fue tomado por otro residente activo
                const [ocupados] = await connection.query(
                    `SELECT a.id, a.numero AS numero_apto, b.nombre AS bloque, i.numero AS interior,
                            CONCAT(ud2.primer_nombre, ' ', ud2.primer_apellido) AS ocupante_actual
                     FROM propietario_gestion_apartamento pga
                     INNER JOIN propietario p ON pga.id_propietario = p.id
                     INNER JOIN user_data ud ON p.id_user_data = ud.id
                     INNER JOIN apartamento a ON pga.id_apartamento = a.id
                     INNER JOIN interior i ON a.id_interior = i.id
                     INNER JOIN bloque b ON i.id_bloque = b.id
                     INNER JOIN propietario_gestion_apartamento pga2 ON a.id = pga2.id_apartamento AND pga2.estado = 'Activo'
                     INNER JOIN propietario p2 ON pga2.id_propietario = p2.id
                     INNER JOIN user_data ud2 ON p2.id_user_data = ud2.id
                     INNER JOIN usuario u2 ON ud2.id_usuario = u2.id AND u2.estado = 'Activo'
                     WHERE ud.id_usuario = ? AND u2.id != ?`,
                    [id, id]
                );

                apartamentosOcupados = ocupados || [];
                const idsOcupados = ocupados.map(o => o.id);

                if (idsOcupados.length > 0) {
                    await connection.query(
                        `UPDATE propietario_gestion_apartamento pga 
                         INNER JOIN propietario p ON pga.id_propietario = p.id 
                         INNER JOIN user_data ud ON p.id_user_data = ud.id 
                         SET pga.estado = 'Activo' 
                         WHERE ud.id_usuario = ? AND pga.id_apartamento NOT IN (?)`,
                        [id, idsOcupados]
                    );

                    await connection.query(
                        `UPDATE propietario_gestion_apartamento pga 
                         INNER JOIN propietario p ON pga.id_propietario = p.id 
                         INNER JOIN user_data ud ON p.id_user_data = ud.id 
                         SET pga.estado = 'Inactivo' 
                         WHERE ud.id_usuario = ? AND pga.id_apartamento IN (?)`,
                        [id, idsOcupados]
                    );

                    const detalle = ocupados.map(o => `Apto ${o.numero_apto} (${o.bloque}, Int ${o.interior} - de ${o.ocupante_actual})`).join(', ');
                    advertencia = `El usuario fue reactivado, pero los siguientes apartamentos ya pertenecen a otro residente activo y no fueron restaurados: ${detalle}.`;
                } else {
                    await connection.query(
                        `UPDATE propietario_gestion_apartamento pga 
                         INNER JOIN propietario p ON pga.id_propietario = p.id 
                         INNER JOIN user_data ud ON p.id_user_data = ud.id 
                         SET pga.estado = 'Activo' WHERE ud.id_usuario = ?`,
                        [id]
                    );
                }
            } else {
                await connection.query('UPDATE usuario SET estado = ? WHERE id = ?', ['Inactivo', id]);
                await connection.query(
                    `UPDATE propietario p 
                     INNER JOIN user_data ud ON p.id_user_data = ud.id 
                     SET p.estado = 'Inactivo' WHERE ud.id_usuario = ?`,
                    [id]
                );
                await connection.query(
                    `UPDATE propietario_gestion_apartamento pga 
                     INNER JOIN propietario p ON pga.id_propietario = p.id 
                     INNER JOIN user_data ud ON p.id_user_data = ud.id 
                     SET pga.estado = 'Inactivo' WHERE ud.id_usuario = ?`,
                    [id]
                );
            }

            await connection.commit();
            return { advertencia, apartamentosOcupados };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = AdminUsuarioModel;