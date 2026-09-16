// sicrcb-backend/models/AlquilerModel.js
const pool = require('../database/db');

class AlquilerModel {
    // 1. Obtener tarifas e inventario base
    static async obtenerConfiguracion() {
        const [salonRows] = await pool.query('SELECT valor_hora FROM salon_comunal WHERE id = 1 LIMIT 1');
        const [sillasRows] = await pool.query('SELECT cantidad, valor_hora FROM silla WHERE id = 1 LIMIT 1');

        return {
            valorHoraSalon: salonRows.length > 0 ? salonRows[0].valor_hora : 50000,
            valorHoraSillas: sillasRows.length > 0 ? (sillasRows[0].valor_hora || 20000) : 20000,
            totalSillas: sillasRows.length > 0 ? sillasRows[0].cantidad : 120
        };
    }

    // 2. Actualizar configuración (Admin)
    static async actualizarConfiguracion({ valorHoraSalon, valorHoraSillas, totalSillas }) {
        if (valorHoraSalon !== undefined) {
            await pool.query(
                `INSERT INTO salon_comunal (id, estado, valor_hora)
                 VALUES (1, 'Disponible', ?)
                 ON DUPLICATE KEY UPDATE valor_hora = VALUES(valor_hora)`,
                [parseInt(valorHoraSalon, 10)]
            );
        }

        if (valorHoraSillas !== undefined || totalSillas !== undefined) {
            const cant = parseInt(totalSillas || 120, 10);
            const vhSillas = parseInt(valorHoraSillas || 20000, 10);
            await pool.query(
                `INSERT INTO silla (id, cantidad, estado, valor_hora)
                 VALUES (1, ?, 'Disponible', ?)
                 ON DUPLICATE KEY UPDATE cantidad = VALUES(cantidad), valor_hora = VALUES(valor_hora)`,
                [cant, vhSillas]
            );
        }
        return true;
    }

    // 3. Reservas por fecha (para la matriz de ocupación)
    static async obtenerReservasPorFecha(fecha) {
        const query = `
            SELECT a.id, a.id_salon_comunal,
                   DATE_FORMAT(a.hora_inicio, '%H:%i') AS hora_inicio,
                   DATE_FORMAT(a.hora_fin, '%H:%i') AS hora_fin,
                   a.hora_inicio AS fecha_hora_inicio,
                   a.hora_fin AS fecha_hora_fin,
                   a.descripcion, a.estado,
                   COALESCE(als.cantidad, 0) AS cantidad_sillas
            FROM alquiler a
            LEFT JOIN alquiler_silla als ON a.id = als.id_alquiler
            WHERE DATE(a.hora_inicio) = ?
              AND a.estado IN ('Reservado', 'Confirmado')
            ORDER BY a.hora_inicio ASC
        `;
        const [filas] = await pool.query(query, [fecha]);
        return filas;
    }

    // 4. Listado global (Admin)
    static async listarTodos() {
        const query = `
            SELECT a.id, a.descripcion, a.hora_inicio, a.hora_fin, a.valor_hora, a.estado,
                   p.id AS id_propietario,
                   ud.primer_nombre AS nombre_propietario, ud.primer_apellido AS apellido_propietario,
                   s.id AS id_salon_comunal,
                   COALESCE(als.cantidad, 0) AS cantidad_sillas_alquiladas,
                   CASE 
                       WHEN a.id_salon_comunal IS NOT NULL AND COALESCE(als.cantidad, 0) > 0 THEN 'ambos'
                       WHEN a.id_salon_comunal IS NOT NULL THEN 'salon'
                       ELSE 'sillas'
                   END AS tipo_alquiler
            FROM alquiler a
            JOIN propietario p ON a.id_propietario = p.id
            JOIN user_data ud ON p.id_user_data = ud.id
            LEFT JOIN salon_comunal s ON a.id_salon_comunal = s.id
            LEFT JOIN alquiler_silla als ON a.id = als.id_alquiler
            ORDER BY a.hora_inicio DESC
        `;
        const [filas] = await pool.query(query);
        return filas;
    }

    // 5. Listado de alquileres de un residente
    static async listarPorUsuario(idUsuario) {
        const query = `
            SELECT a.id, a.descripcion, a.hora_inicio, a.hora_fin, a.valor_hora, a.estado,
                   a.id_salon_comunal,
                   COALESCE(als.cantidad, 0) AS cantidad_sillas_alquiladas,
                   CASE 
                       WHEN a.id_salon_comunal IS NOT NULL AND COALESCE(als.cantidad, 0) > 0 THEN 'ambos'
                       WHEN a.id_salon_comunal IS NOT NULL THEN 'salon'
                       ELSE 'sillas'
                   END AS tipo_alquiler
            FROM alquiler a
            LEFT JOIN alquiler_silla als ON a.id = als.id_alquiler
            WHERE a.id_propietario = (
                SELECT p.id FROM propietario p
                JOIN user_data ud ON p.id_user_data = ud.id
                WHERE ud.id_usuario = ?
            )
            ORDER BY a.hora_inicio DESC
        `;
        const [filas] = await pool.query(query, [idUsuario]);
        return filas;
    }

    // 6. Obtener detalle por ID
    static async obtenerPorId(id) {
        const query = `
            SELECT a.id, a.descripcion, a.hora_inicio, a.hora_fin, a.valor_hora, a.estado,
                   a.id_propietario, ud.id_usuario,
                   ud.primer_nombre AS nombre_propietario, ud.primer_apellido AS apellido_propietario,
                   s.id AS id_salon_comunal
            FROM alquiler a
            JOIN propietario p ON a.id_propietario = p.id
            JOIN user_data ud ON p.id_user_data = ud.id
            LEFT JOIN salon_comunal s ON a.id_salon_comunal = s.id
            WHERE a.id = ?
            LIMIT 1
        `;
        const [filas] = await pool.query(query, [id]);
        return filas.length > 0 ? filas[0] : null;
    }

    // 7. Crear alquiler con transacción y validación de choques
    static async crearReserva(idUsuario, { descripcion, horaInicio, horaFin, tipoAlquiler, cantidadSillas }) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // A. Buscar propietario
            const [propietario] = await connection.query(
                'SELECT id FROM propietario WHERE id_user_data = (SELECT id FROM user_data WHERE id_usuario = ?)',
                [idUsuario]
            );
            if (propietario.length === 0) {
                const err = new Error('No se encontró un propietario asociado a este usuario.');
                err.statusCode = 403;
                throw err;
            }
            const idPropietario = propietario[0].id;

            // B. Configuración de tarifas
            const [salonCfg] = await connection.query('SELECT valor_hora FROM salon_comunal WHERE id = 1 LIMIT 1');
            const [sillasCfg] = await connection.query('SELECT valor_hora, cantidad FROM silla WHERE id = 1 LIMIT 1');

            const vhSalon = salonCfg.length > 0 ? salonCfg[0].valor_hora : 50000;
            const vhSillas = sillasCfg.length > 0 ? (sillasCfg[0].valor_hora || 20000) : 20000;
            const stockTotalSillas = sillasCfg.length > 0 ? sillasCfg[0].cantidad : 120;

            let valorFinal = vhSalon;
            if (tipoAlquiler === 'sillas') valorFinal = vhSillas;
            if (tipoAlquiler === 'ambos') valorFinal = vhSalon + vhSillas;

            // C. Validar colisión en salón comunal
            let idSalonComunal = null;
            if (tipoAlquiler === 'salon' || tipoAlquiler === 'ambos') {
                const [salones] = await connection.query('SELECT id FROM salon_comunal LIMIT 1');
                idSalonComunal = salones.length > 0 ? salones[0].id : 1;

                const [colisiones] = await connection.query(
                    `SELECT id, DATE_FORMAT(hora_inicio, '%H:%i') AS inicio, DATE_FORMAT(hora_fin, '%H:%i') AS fin 
                     FROM alquiler 
                     WHERE id_salon_comunal IS NOT NULL 
                       AND estado IN ('Reservado', 'Confirmado') 
                       AND hora_inicio < ? AND hora_fin > ? 
                     LIMIT 1`,
                    [horaFin, horaInicio]
                );

                if (colisiones.length > 0) {
                    const err = new Error(`El Salón Comunal ya se encuentra ocupado de ${colisiones[0].inicio} a ${colisiones[0].fin}. Por favor elige otro horario.`);
                    err.statusCode = 409;
                    throw err;
                }
            }

            // D. Validar stock de sillas
            if (tipoAlquiler === 'sillas' || tipoAlquiler === 'ambos') {
                if (cantidadSillas <= 0) {
                    const err = new Error('Debes especificar al menos 1 silla.');
                    err.statusCode = 400;
                    throw err;
                }

                const [ocupadas] = await connection.query(
                    `SELECT COALESCE(SUM(als.cantidad), 0) AS total_ocupadas 
                     FROM alquiler_silla als 
                     JOIN alquiler a ON a.id = als.id_alquiler 
                     WHERE a.estado IN ('Reservado', 'Confirmado') 
                       AND a.hora_inicio < ? AND a.hora_fin > ?`,
                    [horaFin, horaInicio]
                );
                const sillasOcupadas = Number(ocupadas[0]?.total_ocupadas || 0);
                const disponibles = Math.max(0, stockTotalSillas - sillasOcupadas);

                if (cantidadSillas > disponibles) {
                    const err = new Error(`Solo quedan ${disponibles} sillas disponibles en ese horario (${sillasOcupadas} ya reservadas).`);
                    err.statusCode = 409;
                    throw err;
                }
            }

            // E. Insertar alquiler
            const [result] = await connection.query(
                `INSERT INTO alquiler (id_propietario, id_salon_comunal, descripcion, hora_inicio, hora_fin, valor_hora, estado) 
                 VALUES (?, ?, ?, ?, ?, ?, 'Reservado')`,
                [idPropietario, idSalonComunal, descripcion.trim(), horaInicio, horaFin, valorFinal]
            );
            const idAlquiler = result.insertId;

            // F. Insertar alquiler_silla
            if (tipoAlquiler === 'sillas' || tipoAlquiler === 'ambos') {
                const [sillas] = await connection.query('SELECT id FROM silla LIMIT 1');
                const idSilla = sillas.length > 0 ? sillas[0].id : 1;
                try {
                    await connection.query(
                        'INSERT INTO alquiler_silla (id_alquiler, id_silla, cantidad) VALUES (?, ?, ?)',
                        [idAlquiler, idSilla, cantidadSillas]
                    );
                } catch (e) {
                    await connection.query(
                        'INSERT INTO alquiler_silla (id_alquiler, id_silla) VALUES (?, ?)',
                        [idAlquiler, idSilla]
                    );
                }
            }

            await connection.commit();
            return { id: idAlquiler, valorHora: valorFinal };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // 8. Actualizar estado (Admin)
    static async actualizarEstado(id, estado) {
        await pool.query('UPDATE alquiler SET estado = ? WHERE id = ?', [estado, id]);
        return true;
    }

    // 9. Cancelar / Eliminar reserva (Transaccional)
    static async eliminarReserva(id) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query('DELETE FROM alquiler_silla WHERE id_alquiler = ?', [id]);
            await connection.query('DELETE FROM alquiler WHERE id = ?', [id]);
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

module.exports = AlquilerModel;