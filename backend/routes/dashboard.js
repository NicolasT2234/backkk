const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');

const router = express.Router();

// GET /dashboard/estadisticas (solo administradores)
router.get('/estadisticas', verificarToken, verificarRol('Administrador'), async (req, res) => {
  try {
    // PQRs pendientes - using queja_sugerencia as per DDL
    const [pqrsPendientes] = await pool.query(
      'SELECT COUNT(*) as total FROM queja_sugerencia WHERE estado = ?',
      ['Pendiente']
    );

    // Multas pendientes
    const [multasPendientes] = await pool.query(
      'SELECT COUNT(*) as total FROM multa WHERE estado = ?',
      ['Pendiente']
    );

    // Alquileres activos/reservados
    const [alquileres] = await pool.query(
      'SELECT COUNT(*) as total FROM alquiler WHERE estado IN (?, ?)',
      ['Activo', 'Reservado']
    );

    // Total de proprietarios
    const [propietarios] = await pool.query(
      'SELECT COUNT(*) as total FROM propietario'
    );

    res.json({
      pqrsPendientes: pqrsPendientes[0].total,
      multasPendientes: multasPendientes[0].total,
      alquileresActivos: alquileres[0].total,
      totalPropietarios: propietarios[0].total
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    next(error);
  }
});

// GET /dashboard/residente
router.get('/residente', verificarToken, async (req, res) => {
  try {
    const idUsuario = req.usuario.id;

    // Obtener id_propietario del usuario
    const [propietarioResult] = await pool.query(
      `SELECT p.id as id_propietario
       FROM propietario p
       JOIN user_data ud ON p.id_user_data = ud.id_usuario
       WHERE ud.id_usuario = ?`,
      [idUsuario]
    );

    if (propietarioResult.length === 0) {
      return res.status(404).json({ error: 'Propietario no encontrado' });
    }

    const idPropietario = propietarioResult[0].id_propietario;

    // Multas pendientes del propietario
    const [multas] = await pool.query(
      `SELECT m.id, m.descripcion, m.fecha_vencimiento, m.fecha_pago, m.estado,
              b.nombre as bloque, a.numero, i.numero as interior,
              ud.primer_nombre as nombre_propietario, ud.primer_apellido as apellido_propietario,
              tm.valor as monto
       FROM multa m
       JOIN apartamento a ON m.id_apartamento = a.id
       JOIN interior i ON a.id_interior = i.id
       JOIN bloque b ON a.id_bloque = b.id
       LEFT JOIN (
           SELECT pga.id_apartamento, pga.id_propietario
           FROM propietario_gestion_apartamento pga
           WHERE pga.estado = 'Activo'
           AND pga.fecha_registro = (
               SELECT MAX(pga2.fecha_registro)
               FROM propietario_gestion_apartamento pga2
               WHERE pga2.id_apartamento = pga.id_apartamento
               AND pga2.estado = 'Activo'
           )
       ) latest_pga ON latest_pga.id_apartamento = a.id
       LEFT JOIN propietario p ON latest_pga.id_propietario = p.id
       LEFT JOIN user_data ud ON p.id_user_data = ud.id
       JOIN tipo_multa tm ON m.id_tipo_multa = tm.id
       WHERE a.id IN (
         SELECT ap.id FROM apartamento ap
         JOIN propietario pt ON ap.id = pt.id_apartamento
         JOIN user_data ud ON pt.id_user_data = ud.id
         WHERE ud.id_usuario = ?
       )
       AND m.estado = ?`,
      [idUsuario, 'Pendiente']
    );

    // Próximas reservas de alquiler
    const [alquileres] = await pool.query(
      `SELECT a.id, a.descripcion, a.hora_inicio, a.hora_fin, a.valor_hora, a.estado,
              b.nombre as bloque, a.numero, i.numero as interior,
              -- Calculate monto_total as duration in hours * valor_hora
              TIMESTAMPDIFF(HOUR, a.hora_inicio, a.hora_fin) * a.valor_hora as monto_total
       FROM alquiler a
       JOIN apartamento ap ON a.id_apartamento = ap.id
       JOIN bloque b ON ap.id_bloque = b.id
       JOIN interior i ON ap.id_interior = i.id
       WHERE a.id_propietario = ? AND a.estado IN (?, ?)
       ORDER BY a.hora_inicio ASC
       LIMIT 5`,
      [idPropietario, 'Activo', 'Reservado']
    );

    // Últimas 3 noticias
    const [noticias] = await pool.query(
      `SELECT id, descripcion as titulo, descripcion as contenido, fecha_publicacion
       FROM noticia
       ORDER BY fecha_publicacion DESC
       LIMIT 3`
    );

    res.json({
      multasPendientes: {
        count: multas.length,
        multas: multas.map(m => ({
          id: m.id,
          descripcion: m.descripcion,
          fechaVencimiento: m.fecha_vencimiento,
          fechaPago: m.fecha_pago,
          estado: m.estado,
          monto: m.monto,
          apartamento: `${m.bloque}-${m.numero}${m.interior ? '-' + m.interior : ''}`,
          nombrePropietario: m.nombre_propietario,
          apellidoPropietario: m.apellido_propietario
        }))
      },
      proximasReservas: alquileres.map(a => ({
        id: a.id,
        descripcion: a.descripcion,
        fechaInicio: a.hora_inicio,
        fechaFin: a.hora_fin,
        montoTotal: a.monto_total,
        estado: a.estado,
        apartamento: `${a.bloque}-${a.numero}${a.interior ? '-' + a.interior : ''}`
      })),
      ultimasNoticias: noticias.map(n => ({
        id: n.id,
        titulo: n.titulo,
        contenido: n.contenido,
        fechaPublicacion: n.fecha_publicacion
      }))
    });
  } catch (error) {
    console.error('Error al obtener datos del residente:', error);
    next(error);
  }
});

module.exports = router;