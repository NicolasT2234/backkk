const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../middlewares/auth');

const router = express.Router();

// =========================================================================
// 1. DASHBOARD ADMINISTRADOR: GET /api/dashboard/estadisticas
// =========================================================================
router.get('/estadisticas', verificarToken, verificarRol('Administrador'), async (req, res, next) => {
  const startTime = Date.now();

  try {
    const [pqrsPendientes] = await pool.query(
      'SELECT COUNT(*) as total FROM queja_sugerencia WHERE estado = ?',
      ['Pendiente']
    );

    const [multasPendientes] = await pool.query(
      'SELECT COUNT(*) as total FROM multa WHERE estado = ?',
      ['Pendiente']
    );

    const [alquileres] = await pool.query(
      "SELECT COUNT(*) as total FROM alquiler WHERE estado IN ('Reservado', 'Confirmado', 'Activo')"
    );

    const [propietarios] = await pool.query(
      'SELECT COUNT(*) as total FROM propietario'
    );

    // 1. Multas recientes (con soporte para fecha_creacion si existe)
    let ultimasMultas = [];
    try {
      const [rows] = await pool.query(
        `SELECT m.id, m.numero, m.nombre, m.descripcion, 'multa' as tipo,
                b.nombre as bloque, ap.numero as apto,
                TIMESTAMPDIFF(SECOND, m.fecha_creacion, NOW()) as segundos_atras,
                m.fecha_creacion
         FROM multa m
         JOIN apartamento ap ON m.id_apartamento = ap.id
         JOIN interior i ON ap.id_interior = i.id
         JOIN bloque b ON i.id_bloque = b.id
         ORDER BY m.id DESC LIMIT 2`
      );
      ultimasMultas = rows;
    } catch (err) {
      const [rows] = await pool.query(
        `SELECT m.id, m.numero, m.nombre, m.descripcion, 'multa' as tipo,
                b.nombre as bloque, ap.numero as apto
         FROM multa m
         JOIN apartamento ap ON m.id_apartamento = ap.id
         JOIN interior i ON ap.id_interior = i.id
         JOIN bloque b ON i.id_bloque = b.id
         ORDER BY m.id DESC LIMIT 2`
      );
      ultimasMultas = rows;
    }

    // 2. PQRs recientes
    const [ultimasPqrs] = await pool.query(
      `SELECT qs.id, qs.titulo_pqr as nombre, qs.descripcion_pqr as descripcion,
              TIMESTAMPDIFF(SECOND, qs.fecha, NOW()) as segundos_atras,
              qs.fecha as fecha_evento, 'pqr' as tipo,
              b.nombre as bloque, ap.numero as apto
       FROM queja_sugerencia qs
       JOIN pqr_especifica pe ON qs.id = pe.id_queja_sugerencia
       JOIN apartamento ap ON pe.id_apartamento = ap.id
       JOIN interior i ON ap.id_interior = i.id
       JOIN bloque b ON i.id_bloque = b.id
       ORDER BY qs.id DESC LIMIT 2`
    );

    // 3. Alquileres recientes
    const [ultimosAlquileres] = await pool.query(
      `SELECT a.id, a.descripcion as nombre, a.estado as descripcion,
              TIMESTAMPDIFF(SECOND, a.hora_inicio, NOW()) as segundos_atras,
              a.hora_inicio as fecha_evento, 'alquiler' as tipo,
              ud.primer_nombre, ud.primer_apellido
       FROM alquiler a
       JOIN propietario p ON a.id_propietario = p.id
       JOIN user_data ud ON p.id_user_data = ud.id
       ORDER BY a.id DESC LIMIT 2`
    );

    // 4. Residentes acreditados
    const [ultimosResidentes] = await pool.query(
      `SELECT pga.id, CONCAT(ud.primer_nombre, ' ', ud.primer_apellido) as nombre,
              CONCAT('Torre ', b.nombre, ' - Apto ', ap.numero) as descripcion,
              pga.fecha_registro as fecha_evento, 'residente' as tipo
       FROM propietario_gestion_apartamento pga
       JOIN propietario p ON pga.id_propietario = p.id
       JOIN user_data ud ON p.id_user_data = ud.id
       JOIN apartamento ap ON pga.id_apartamento = ap.id
       JOIN interior i ON ap.id_interior = i.id
       JOIN bloque b ON i.id_bloque = b.id
       ORDER BY pga.id DESC LIMIT 2`
    );

    // 5. Noticias recientes
    const [ultimasNoticiasAdmin] = await pool.query(
      `SELECT id, descripcion as nombre, 'Nueva noticia' as descripcion,
              TIMESTAMPDIFF(SECOND, fecha_publicacion, NOW()) as segundos_atras,
              fecha_publicacion as fecha_evento, 'noticia' as tipo
       FROM noticia
       ORDER BY id DESC LIMIT 2`
    );

    const nowMs = Date.now();
    const eventos = [];

    ultimasMultas.forEach(m => {
      const fechaCalculada = (m.segundos_atras !== null && m.segundos_atras !== undefined && m.segundos_atras >= 0)
        ? new Date(nowMs - m.segundos_atras * 1000).toISOString()
        : (m.fecha_creacion || new Date().toISOString());

      eventos.push({
        id: `multa-${m.id}`,
        tipo: 'multa',
        titulo: `Sanción #${m.numero || m.id}: ${m.nombre}`,
        detalle: `Apto ${m.bloque}-${m.apto}: ${(m.descripcion || '').substring(0, 55)}...`,
        fecha: fechaCalculada
      });
    });

    ultimasPqrs.forEach(p => {
      const fechaCalculada = p.segundos_atras !== null && p.segundos_atras >= 0
        ? new Date(nowMs - p.segundos_atras * 1000).toISOString()
        : (p.fecha_evento || new Date().toISOString());

      eventos.push({
        id: `pqr-${p.id}`,
        tipo: 'pqr',
        titulo: `PQR radicada: ${p.nombre}`,
        detalle: `Apto ${p.bloque}-${p.apto}: ${(p.descripcion || '').substring(0, 55)}...`,
        fecha: fechaCalculada
      });
    });

    ultimosAlquileres.forEach(a => {
      const fechaCalculada = a.segundos_atras !== null && a.segundos_atras >= 0
        ? new Date(nowMs - a.segundos_atras * 1000).toISOString()
        : (a.fecha_evento || new Date().toISOString());

      eventos.push({
        id: `alquiler-${a.id}`,
        tipo: 'alquiler',
        titulo: `Reserva: ${a.nombre}`,
        detalle: `Por ${a.primer_nombre || ''} ${a.primer_apellido || ''}`,
        fecha: fechaCalculada
      });
    });

    ultimosResidentes.forEach(r => {
      eventos.push({
        id: `residente-${r.id}`,
        tipo: 'residente',
        titulo: `Residente acreditado: ${r.nombre}`,
        detalle: r.descripcion,
        fecha: r.fecha_evento
      });
    });

    ultimasNoticiasAdmin.forEach(n => {
      const fechaCalculada = n.segundos_atras !== null && n.segundos_atras >= 0
        ? new Date(nowMs - n.segundos_atras * 1000).toISOString()
        : (n.fecha_evento || new Date().toISOString());

      eventos.push({
        id: `noticia-${n.id}`,
        tipo: 'noticia',
        titulo: 'Nuevo comunicado oficial',
        detalle: (n.nombre || '').substring(0, 55) + '...',
        fecha: fechaCalculada
      });
    });

    eventos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    res.json({
      metricas: {
        pqrsPendientes: pqrsPendientes[0]?.total || 0,
        multasPendientes: multasPendientes[0]?.total || 0,
        alquileresActivos: alquileres[0]?.total || 0,
        totalPropietarios: propietarios[0]?.total || 0
      },
      actividadReciente: eventos.slice(0, 5),
      sistema: {
        apiOk: true,
        dbOk: true,
        dbLatencyMs: Date.now() - startTime,
        servidorTimestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard admin:', error);
    next(error);
  }
});

// =========================================================================
// 2. DASHBOARD RESIDENTE: GET /api/dashboard/residente
// =========================================================================
router.get('/residente', verificarToken, async (req, res, next) => {
  const startTime = Date.now();

  try {
    const idUsuario = req.usuario.id;

    // Obtener datos del residente y apartamento
    const [propRows] = await pool.query(
      `SELECT p.id as id_propietario, ud.primer_nombre, ud.primer_apellido,
              ap.id as id_apartamento, ap.numero as apto, b.nombre as bloque, i.numero as interior
       FROM user_data ud
       JOIN propietario p ON p.id_user_data = ud.id
       LEFT JOIN propietario_gestion_apartamento pga ON pga.id_propietario = p.id AND pga.estado = 'Activo'
       LEFT JOIN apartamento ap ON pga.id_apartamento = ap.id
       LEFT JOIN interior i ON ap.id_interior = i.id
       LEFT JOIN bloque b ON i.id_bloque = b.id
       WHERE ud.id_usuario = ?
       LIMIT 1`,
      [idUsuario]
    );

    const propietario = propRows[0] || null;
    const idPropietario = propietario ? propietario.id_propietario : null;
    const idApartamento = propietario ? propietario.id_apartamento : null;

    // Multas del apartamento (consulta con fallback de fecha_creacion)
    let multas = [];
    if (idApartamento) {
      try {
        const [multasRows] = await pool.query(
          `SELECT m.id, m.numero, m.nombre, m.descripcion, m.estado, tm.valor as monto,
                  TIMESTAMPDIFF(SECOND, m.fecha_creacion, NOW()) as segundos_atras,
                  m.fecha_creacion
           FROM multa m
           JOIN tipo_multa tm ON m.id_tipo_multa = tm.id
           WHERE m.id_apartamento = ?
           ORDER BY m.id DESC`,
          [idApartamento]
        );
        multas = multasRows;
      } catch (err) {
        const [multasRows] = await pool.query(
          `SELECT m.id, m.numero, m.nombre, m.descripcion, m.estado, tm.valor as monto
           FROM multa m
           JOIN tipo_multa tm ON m.id_tipo_multa = tm.id
           WHERE m.id_apartamento = ?
           ORDER BY m.id DESC`,
          [idApartamento]
        );
        multas = multasRows;
      }
    }

    const multasPendientes = multas.filter(m => (m.estado || '').toLowerCase() === 'pendiente');
    const multasResueltas = multas.filter(m => ['resuelta', 'pagado', 'pagada'].includes((m.estado || '').toLowerCase()));

    // Reservas del residente
    let reservas = [];
    if (idPropietario) {
      const [resRows] = await pool.query(
        `SELECT a.id, a.descripcion, a.hora_inicio, a.hora_fin, a.valor_hora, a.estado
         FROM alquiler a
         WHERE a.id_propietario = ?
         ORDER BY a.hora_inicio DESC LIMIT 5`,
        [idPropietario]
      );
      reservas = resRows;
    }

    // PQRs del residente
    let pqrs = [];
    if (idPropietario) {
      const [pqrRows] = await pool.query(
        `SELECT qs.id, qs.titulo_pqr, qs.descripcion_pqr, qs.estado, qs.fecha,
                TIMESTAMPDIFF(SECOND, qs.fecha, NOW()) as segundos_atras
         FROM queja_sugerencia qs
         WHERE qs.id_propietario = ?
         ORDER BY qs.fecha DESC LIMIT 5`,
        [idPropietario]
      );
      pqrs = pqrRows;
    }

    // Noticias con cálculo de segundos exactos
    const [noticias] = await pool.query(
      `SELECT id, descripcion, fecha_publicacion, archivo_url,
              TIMESTAMPDIFF(SECOND, fecha_publicacion, NOW()) as segundos_atras,
              COALESCE(estado, 'Activa') as estado
       FROM noticia
       ORDER BY id DESC LIMIT 5`
    );

    const nowMs = Date.now();
    const notificaciones = [];

    // 1. Notificaciones de Multas (Con fecha real calculada)
    multasPendientes.forEach(m => {
      const fechaCalculada = (m.segundos_atras !== null && m.segundos_atras !== undefined && m.segundos_atras >= 0)
        ? new Date(nowMs - m.segundos_atras * 1000).toISOString()
        : (m.fecha_creacion || null);

      notificaciones.push({
        id: `notif-multa-${m.id}`,
        tipo: 'multa',
        urgencia: 'urgente',
        titulo: `Sanción pendiente: ${m.nombre}`,
        mensaje: `Multa de $${Number(m.monto || 0).toLocaleString()} (#${m.numero || m.id}) por conciliar.`,
        fecha: fechaCalculada
      });
    });

    // 2. Notificaciones de Comunicados Oficiales
    noticias.forEach(n => {
      const fechaCalculada = (n.segundos_atras !== null && n.segundos_atras >= 0)
        ? new Date(nowMs - n.segundos_atras * 1000).toISOString()
        : (n.fecha_publicacion || new Date().toISOString());

      notificaciones.push({
        id: `notif-noticia-${n.id}`,
        tipo: 'noticia',
        urgencia: 'info',
        titulo: 'Nuevo comunicado administrativo',
        mensaje: (n.descripcion || '').substring(0, 95) + ((n.descripcion || '').length > 95 ? '...' : ''),
        fecha: fechaCalculada
      });
    });

    // 3. Notificaciones de PQRs
    pqrs.forEach(p => {
      const est = (p.estado || '').toLowerCase();
      const fechaCalculada = (p.segundos_atras !== null && p.segundos_atras >= 0)
        ? new Date(nowMs - p.segundos_atras * 1000).toISOString()
        : (p.fecha || new Date().toISOString());

      notificaciones.push({
        id: `notif-pqr-${p.id}`,
        tipo: 'pqr',
        urgencia: est === 'resuelta' ? 'exito' : 'alerta',
        titulo: `PQR #${p.id} (${p.estado})`,
        mensaje: p.titulo_pqr,
        fecha: fechaCalculada
      });
    });

    res.json({
      propietario: {
        nombre: propietario ? `${propietario.primer_nombre} ${propietario.primer_apellido}` : 'Residente',
        apartamento: propietario && propietario.apto ? `Torre ${propietario.bloque || ''} - Apto ${propietario.apto}` : 'Apartamento asignado',
        alDia: multasPendientes.length === 0
      },
      metricas: {
        multasPendientes: multasPendientes.length,
        multasResueltas: multasResueltas.length,
        reservasActivas: reservas.filter(r => ['reservado', 'confirmado', 'activo'].includes((r.estado || '').toLowerCase())).length,
        noticiasActivas: noticias.length,
        pqrsActivas: pqrs.filter(p => (p.estado || '').toLowerCase() !== 'resuelta').length
      },
      notificaciones,
      proximasReservas: reservas,
      ultimasNoticias: noticias.map(n => ({
        id: n.id,
        titulo: 'Aviso a la Comunidad',
        descripcion: n.descripcion,
        fecha_publicacion: (n.segundos_atras !== null && n.segundos_atras >= 0)
          ? new Date(nowMs - n.segundos_atras * 1000).toISOString()
          : n.fecha_publicacion,
        archivo_url: n.archivo_url
      })),
      sistema: {
        latenciaMs: Date.now() - startTime,
        servidorTimestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error al obtener datos del residente:', error);
    next(error);
  }
});

module.exports = router;