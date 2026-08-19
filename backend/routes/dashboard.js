const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');

const router = express.Router();

// GET /dashboard/estadisticas (solo administradores)
router.get('/estadisticas', verificarToken, verificarRol('Administrador'), async (req, res) => {
  try {
    // PQRs pendientes
    const [pqrsPendientes] = await pool.query(
      'SELECT COUNT(*) as total FROM pqr WHERE estado = ?',
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

    // Total de propietarios
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
    res.status(500).json({ error: 'Error interno del servidor' });
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
      `SELECT m.id, m.descripcion, m.monto, m.fecha_vencimiento, m.estado,
              a.bloque, a.numero, i.descripcion as interior
       FROM multa m
       JOIN apartamento a ON m.id_apartamento = a.id
       JOIN bloque b ON a.id_bloque = b.id
       JOIN interior i ON a.id_interior = i.id
       WHERE a.id IN (
         SELECT ap.id FROM apartamento ap
         JOIN propietario pt ON ap.id = pt.id_apartamento
         WHERE pt.id_user_data = ?
       ) AND m.estado = ?`,
      [idUsuario, 'Pendiente']
    );

    // Próximas reservas de alquiler
    const [alquileres] = await pool.query(
      `SELECT a.id, a.fecha_inicio, a.fecha_fin, a.monto_total, a.estado,
              ap.bloque, ap.numero, i.descripcion as interior
       FROM alquiler a
       JOIN apartamento ap ON a.id_apartamento = ap.id
       JOIN bloque b ON ap.id_bloque = b.id
       JOIN interior i ON ap.id_interior = i.id
       WHERE a.id_propietario = ? AND a.estado IN (?, ?)
       ORDER BY a.fecha_inicio ASC
       LIMIT 5`,
      [idPropietario, 'Activo', 'Reservado']
    );

    // Últimas 3 noticias
    const [noticias] = await pool.query(
      `SELECT id, titulo, contenido, fecha_publicacion
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
          monto: m.monto,
          fechaVencimiento: m.fecha_vencimiento,
          estado: m.estado,
          apartamento: `${m.bloque}-${m.numero}${m.interior ? '-' + m.interior : ''}`
        }))
      },
      proximasReservas: alquileres.map(a => ({
        id: a.id,
        fechaInicio: a.fecha_inicio,
        fechaFin: a.fecha_fin,
        montoTotal: a.monto_total,
        estado: a.estado,
        apartamento: `${a.bloque}-${a.numero}${a.interior ? '-' + a.interior : ''}`
      })),
      ultimasNoticias: noticias.map(n => ({
        id: n.id,
        titulo: n.titulo,
        contenido: n.contenido.substring(0, 100) + '...',
        fechaPublicacion: n.fecha_publicacion
      }))
    });
  } catch (error) {
    console.error('Error al obtener datos del residente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;