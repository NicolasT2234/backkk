// sicrcb-backend/models/DashboardModel.js
const pool = require('../database/db');

class DashboardModel {
    // --- CONSULTAS ADMINISTRADOR ---
    static async obtenerMetricasAdmin() {
        const [pqrs] = await pool.query("SELECT COUNT(*) as total FROM queja_sugerencia WHERE estado = 'Pendiente'");
        const [multas] = await pool.query("SELECT COUNT(*) as total FROM multa WHERE estado = 'Pendiente'");
        const [alquileres] = await pool.query("SELECT COUNT(*) as total FROM alquiler WHERE estado IN ('Reservado', 'Confirmado', 'Activo')");
        const [propietarios] = await pool.query('SELECT COUNT(*) as total FROM propietario');

        return {
            pqrsPendientes: pqrs[0]?.total || 0,
            multasPendientes: multas[0]?.total || 0,
            alquileresActivos: alquileres[0]?.total || 0,
            totalPropietarios: propietarios[0]?.total || 0
        };
    }

    static async obtenerActividadRecienteAdmin() {
        // 1. Multas
        let multas = [];
        try {
            const [rows] = await pool.query(`
                SELECT m.id, m.numero, m.nombre, m.descripcion, 'multa' as tipo,
                       b.nombre as bloque, ap.numero as apto,
                       TIMESTAMPDIFF(SECOND, m.fecha_creacion, NOW()) as segundos_atras,
                       m.fecha_creacion
                FROM multa m
                JOIN apartamento ap ON m.id_apartamento = ap.id
                JOIN interior i ON ap.id_interior = i.id
                JOIN bloque b ON i.id_bloque = b.id
                ORDER BY m.id DESC LIMIT 2
            `);
            multas = rows;
        } catch (e) {
            const [rows] = await pool.query(`
                SELECT m.id, m.numero, m.nombre, m.descripcion, 'multa' as tipo,
                       b.nombre as bloque, ap.numero as apto
                FROM multa m
                JOIN apartamento ap ON m.id_apartamento = ap.id
                JOIN interior i ON ap.id_interior = i.id
                JOIN bloque b ON i.id_bloque = b.id
                ORDER BY m.id DESC LIMIT 2
            `);
            multas = rows;
        }

        // 2. PQRs
        const [pqrs] = await pool.query(`
            SELECT qs.id, qs.titulo_pqr as nombre, qs.descripcion_pqr as descripcion,
                   TIMESTAMPDIFF(SECOND, qs.fecha, NOW()) as segundos_atras,
                   qs.fecha as fecha_evento, 'pqr' as tipo,
                   b.nombre as bloque, ap.numero as apto
            FROM queja_sugerencia qs
            JOIN pqr_especifica pe ON qs.id = pe.id_queja_sugerencia
            JOIN apartamento ap ON pe.id_apartamento = ap.id
            JOIN interior i ON ap.id_interior = i.id
            JOIN bloque b ON i.id_bloque = b.id
            ORDER BY qs.id DESC LIMIT 2
        `);

        // 3. Alquileres
        const [alquileres] = await pool.query(`
            SELECT a.id, a.descripcion as nombre, a.estado as descripcion,
                   TIMESTAMPDIFF(SECOND, a.hora_inicio, NOW()) as segundos_atras,
                   a.hora_inicio as fecha_evento, 'alquiler' as tipo,
                   ud.primer_nombre, ud.primer_apellido
            FROM alquiler a
            JOIN propietario p ON a.id_propietario = p.id
            JOIN user_data ud ON p.id_user_data = ud.id
            ORDER BY a.id DESC LIMIT 2
        `);

        // 4. Residentes
        const [residentes] = await pool.query(`
            SELECT pga.id, CONCAT(ud.primer_nombre, ' ', ud.primer_apellido) as nombre,
                   CONCAT('Torre ', b.nombre, ' - Apto ', ap.numero) as descripcion,
                   pga.fecha_registro as fecha_evento, 'residente' as tipo
            FROM propietario_gestion_apartamento pga
            JOIN propietario p ON pga.id_propietario = p.id
            JOIN user_data ud ON p.id_user_data = ud.id
            JOIN apartamento ap ON pga.id_apartamento = ap.id
            JOIN interior i ON ap.id_interior = i.id
            JOIN bloque b ON i.id_bloque = b.id
            ORDER BY pga.id DESC LIMIT 2
        `);

        // 5. Noticias
        const [noticias] = await pool.query(`
            SELECT id, descripcion as nombre, 'Nueva noticia' as descripcion,
                   TIMESTAMPDIFF(SECOND, fecha_publicacion, NOW()) as segundos_atras,
                   fecha_publicacion as fecha_evento, 'noticia' as tipo
            FROM noticia
            ORDER BY id DESC LIMIT 2
        `);

        return { multas, pqrs, alquileres, residentes, noticias };
    }

    // --- CONSULTAS RESIDENTE ---
    static async obtenerDatosResidente(idUsuario) {
        const [rows] = await pool.query(`
            SELECT p.id as id_propietario, ud.primer_nombre, ud.primer_apellido,
                   ap.id as id_apartamento, ap.numero as apto, b.nombre as bloque, i.numero as interior
            FROM user_data ud
            JOIN propietario p ON p.id_user_data = ud.id
            LEFT JOIN propietario_gestion_apartamento pga ON pga.id_propietario = p.id AND pga.estado = 'Activo'
            LEFT JOIN apartamento ap ON pga.id_apartamento = ap.id
            LEFT JOIN interior i ON ap.id_interior = i.id
            LEFT JOIN bloque b ON i.id_bloque = b.id
            WHERE ud.id_usuario = ?
            LIMIT 1
        `, [idUsuario]);
        return rows[0] || null;
    }

    static async obtenerMultasResidente(idApartamento) {
        if (!idApartamento) return [];
        try {
            const [rows] = await pool.query(`
                SELECT m.id, m.numero, m.nombre, m.descripcion, m.estado, tm.valor as monto,
                       TIMESTAMPDIFF(SECOND, m.fecha_creacion, NOW()) as segundos_atras,
                       m.fecha_creacion
                FROM multa m
                JOIN tipo_multa tm ON m.id_tipo_multa = tm.id
                WHERE m.id_apartamento = ?
                ORDER BY m.id DESC
            `, [idApartamento]);
            return rows;
        } catch (e) {
            const [rows] = await pool.query(`
                SELECT m.id, m.numero, m.nombre, m.descripcion, m.estado, tm.valor as monto
                FROM multa m
                JOIN tipo_multa tm ON m.id_tipo_multa = tm.id
                WHERE m.id_apartamento = ?
                ORDER BY m.id DESC
            `, [idApartamento]);
            return rows;
        }
    }

    static async obtenerReservasResidente(idPropietario) {
        if (!idPropietario) return [];
        const [rows] = await pool.query(`
            SELECT a.id, a.descripcion, a.hora_inicio, a.hora_fin, a.valor_hora, a.estado
            FROM alquiler a
            WHERE a.id_propietario = ?
            ORDER BY a.hora_inicio DESC LIMIT 5
        `, [idPropietario]);
        return rows;
    }

    static async obtenerPqrsResidente(idPropietario) {
        if (!idPropietario) return [];
        const [rows] = await pool.query(`
            SELECT qs.id, qs.titulo_pqr, qs.descripcion_pqr, qs.estado, qs.fecha,
                   TIMESTAMPDIFF(SECOND, qs.fecha, NOW()) as segundos_atras
            FROM queja_sugerencia qs
            WHERE qs.id_propietario = ?
            ORDER BY qs.fecha DESC LIMIT 5
        `, [idPropietario]);
        return rows;
    }

    static async obtenerNoticiasResidente() {
        const [rows] = await pool.query(`
            SELECT id, descripcion, fecha_publicacion, archivo_url,
                   TIMESTAMPDIFF(SECOND, fecha_publicacion, NOW()) as segundos_atras,
                   COALESCE(estado, 'Activa') as estado
            FROM noticia
            ORDER BY id DESC LIMIT 5
        `);
        return rows;
    }
}

module.exports = DashboardModel;