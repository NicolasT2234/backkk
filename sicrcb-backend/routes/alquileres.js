const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../middlewares/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

/**
 * ==============================================================================
 * 1. GET /configuracion
 * IMPORTANTE: Debe estar ANTES de router.get('/:id') para que Express no confunda
 * la palabra 'configuracion' con un ID paramétrico y devuelva 403.
 * ==============================================================================
 */
router.get('/configuracion', verificarToken, async (req, res, next) => {
  try {
    const [salonRows] = await pool.query('SELECT valor_hora FROM salon_comunal WHERE id = 1 LIMIT 1');
    const valorHoraSalon = salonRows.length > 0 ? salonRows[0].valor_hora : 50000;

    const [sillasRows] = await pool.query('SELECT cantidad, valor_hora FROM silla WHERE id = 1 LIMIT 1');
    const totalSillas = sillasRows.length > 0 ? sillasRows[0].cantidad : 120;
    const valorHoraSillas = sillasRows.length > 0 ? (sillasRows[0].valor_hora || 20000) : 20000;

    res.json({
      valorHoraSalon,
      valorHoraSillas,
      totalSillas
    });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    next(error);
  }
});

/**
 * ==============================================================================
 * 2. PUT /configuracion (Solo Administradores)
 * ==============================================================================
 */
router.put('/configuracion', verificarToken, verificarRol('Administrador'), async (req, res, next) => {
  try {
    const { valorHoraSalon, valorHoraSillas, totalSillas } = req.body;

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

    res.json({ mensaje: 'Tarifas e inventario actualizados con éxito' });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    next(error);
  }
});

/**
 * ==============================================================================
 * 3. GET /ocupacion?fecha=YYYY-MM-DD
 * Consulta qué bloques de 10:00 a 19:00 están ocupados o libres.
 * Debe estar ANTES de router.get('/:id').
 * ==============================================================================
 */
router.get('/ocupacion', verificarToken, async (req, res, next) => {
  try {
    const { fecha } = req.query;
    if (!fecha) {
      return res.status(400).json({ error: 'Debes proporcionar la fecha (YYYY-MM-DD).' });
    }

    // 1. Total de sillas en inventario
    const [sillasRows] = await pool.query('SELECT cantidad FROM silla WHERE id = 1 LIMIT 1');
    const totalSillas = sillasRows.length > 0 ? sillasRows[0].cantidad : 120;

    // 2. Alquileres de esa fecha
    const [reservas] = await pool.query(
      `SELECT 
        a.id,
        a.id_salon_comunal,
        DATE_FORMAT(a.hora_inicio, '%H:%i') AS hora_inicio,
        DATE_FORMAT(a.hora_fin, '%H:%i') AS hora_fin,
        a.hora_inicio AS fecha_hora_inicio,
        a.hora_fin AS fecha_hora_fin,
        a.descripcion,
        a.estado,
        COALESCE(als.cantidad, 0) AS cantidad_sillas
       FROM alquiler a
       LEFT JOIN alquiler_silla als ON a.id = als.id_alquiler
       WHERE DATE(a.hora_inicio) = ?
         AND a.estado IN ('Reservado', 'Confirmado')
       ORDER BY a.hora_inicio ASC`,
      [fecha]
    );

    // 3. Franjas de 10:00 a 19:00 (9 bloques de 1 hora)
    const franjas = [];
    for (let h = 10; h < 19; h++) {
      const inicio = `${String(h).padStart(2, '0')}:00`;
      const fin = `${String(h + 1).padStart(2, '0')}:00`;

      let salonOcupado = false;
      let sillasOcupadas = 0;

      for (const r of reservas) {
        // Solapamiento: inicio < r.hora_fin && fin > r.hora_inicio
        if (inicio < r.hora_fin && fin > r.hora_inicio) {
          if (r.id_salon_comunal !== null) {
            salonOcupado = true;
          }
          sillasOcupadas += Number(r.cantidad_sillas || 0);
        }
      }

      franjas.push({
        hora: h,
        inicio,
        fin,
        etiqueta: `${inicio} – ${fin}`,
        salonOcupado,
        sillasOcupadas,
        sillasDisponibles: Math.max(0, totalSillas - sillasOcupadas)
      });
    }

    res.json({
      fecha,
      horarioOperacion: { inicio: '10:00', fin: '19:00' },
      reservasDelDia: reservas,
      franjas,
      totalSillas
    });
  } catch (error) {
    console.error('Error al consultar ocupación:', error);
    next(error);
  }
});

/**
 * ==============================================================================
 * 4. GET / (Solo Administradores)
 * ==============================================================================
 */
router.get('/', verificarToken, verificarRol('Administrador'), async (req, res, next) => {
  try {
    const [alquileres] = await pool.query(
      `SELECT a.id, a.descripcion, a.hora_inicio, a.hora_fin, a.valor_hora, a.estado,
              p.id as id_propietario,
              ud.primer_nombre as nombre_propietario, ud.primer_apellido as apellido_propietario,
              s.id as id_salon_comunal,
              COALESCE(als.cantidad, 0) as cantidad_sillas_alquiladas,
              CASE 
                WHEN a.id_salon_comunal IS NOT NULL AND COALESCE(als.cantidad, 0) > 0 THEN 'ambos'
                WHEN a.id_salon_comunal IS NOT NULL THEN 'salon'
                ELSE 'sillas'
              END as tipo_alquiler
       FROM alquiler a
       JOIN propietario p ON a.id_propietario = p.id
       JOIN user_data ud ON p.id_user_data = ud.id
       LEFT JOIN salon_comunal s ON a.id_salon_comunal = s.id
       LEFT JOIN alquiler_silla als ON a.id = als.id_alquiler
       ORDER BY a.hora_inicio DESC`
    );
    res.json(alquileres);
  } catch (error) {
    console.error('Error al obtener alquileres:', error);
    next(error);
  }
});

/**
 * ==============================================================================
 * 5. GET /mis-alquileres (Reservas del usuario autenticado)
 * ==============================================================================
 */
router.get('/mis-alquileres', verificarToken, async (req, res, next) => {
  try {
    const idUsuario = req.usuario.id;

    const [alquileres] = await pool.query(
      `SELECT a.id, a.descripcion, a.hora_inicio, a.hora_fin, a.valor_hora, a.estado,
              a.id_salon_comunal,
              COALESCE(als.cantidad, 0) as cantidad_sillas_alquiladas,
              CASE 
                WHEN a.id_salon_comunal IS NOT NULL AND COALESCE(als.cantidad, 0) > 0 THEN 'ambos'
                WHEN a.id_salon_comunal IS NOT NULL THEN 'salon'
                ELSE 'sillas'
              END as tipo_alquiler
       FROM alquiler a
       LEFT JOIN alquiler_silla als ON a.id = als.id_alquiler
       WHERE a.id_propietario = (
         SELECT p.id FROM propietario p
         JOIN user_data ud ON p.id_user_data = ud.id
         WHERE ud.id_usuario = ?
       )
       ORDER BY a.hora_inicio DESC`,
      [idUsuario]
    );

    res.json(alquileres);
  } catch (error) {
    console.error('Error al obtener mis alquileres:', error);
    next(error);
  }
});

/**
 * ==============================================================================
 * 6. GET /:id (Solo administradores)
 * ==============================================================================
 */
router.get('/:id', verificarToken, verificarRol('Administrador'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const [alquileres] = await pool.query(
      `SELECT a.id, a.descripcion, a.hora_inicio, a.hora_fin, a.valor_hora, a.estado,
              p.id as id_propietario,
              ud.primer_nombre as nombre_propietario, ud.primer_apellido as apellido_propietario,
              s.id as id_salon_comunal
       FROM alquiler a
       JOIN propietario p ON a.id_propietario = p.id
       JOIN user_data ud ON p.id_user_data = ud.id
       LEFT JOIN salon_comunal s ON a.id_salon_comunal = s.id
       WHERE a.id = ?`,
      [id]
    );

    if (alquileres.length === 0) {
      return res.status(404).json({ error: 'Alquiler no encontrado' });
    }

    res.json(alquileres[0]);
  } catch (error) {
    console.error('Error al obtener alquiler:', error);
    next(error);
  }
});

/**
 * ==============================================================================
 * 7. POST / (Crear reserva)
 * Soporta tanto camelCase como snake_case para evitar errores 400 de validación.
 * Valida la ventana 10:00 a 19:00 y colisiones.
 * ==============================================================================
 */
router.post('/',
  [
    body('descripcion').trim().notEmpty().withMessage('La descripción o motivo es requerida'),
    body('horaInicio').custom((val, { req }) => {
      const v = val || req.body.hora_inicio;
      if (!v || !v.trim()) throw new Error('Hora de inicio requerida');
      return true;
    }),
    body('horaFin').custom((val, { req }) => {
      const v = val || req.body.hora_fin;
      if (!v || !v.trim()) throw new Error('Hora de fin requerida');
      return true;
    }),
    body('tipoAlquiler').custom((val, { req }) => {
      const v = val || req.body.tipo_alquiler;
      if (!['salon', 'sillas', 'ambos'].includes(v)) {
        throw new Error('Tipo de alquiler inválido (debe ser salon, sillas o ambos)');
      }
      return true;
    })
  ],
  verificarToken, async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const descripcion = req.body.descripcion;
    const horaInicio = req.body.horaInicio || req.body.hora_inicio;
    const horaFin = req.body.horaFin || req.body.hora_fin;
    const tipoAlquiler = req.body.tipoAlquiler || req.body.tipo_alquiler;
    const cantidadSillas = parseInt(req.body.cantidadSillas || req.body.cantidad_sillas || 0, 10);
    const idUsuario = req.usuario.id;

    const inicio = new Date(horaInicio);
    const fin = new Date(horaFin);

    if (inicio >= fin) {
      return res.status(400).json({
        error: 'La hora de inicio debe ser anterior a la hora de finalización.'
      });
    }

    // Regla de Horario Permitido: 10:00 a.m. a 7:00 p.m.
    const minInicio = inicio.getHours() * 60 + inicio.getMinutes();
    const minFin = fin.getHours() * 60 + fin.getMinutes();
    if (minInicio < 10 * 60 || minFin > 19 * 60) {
      return res.status(400).json({
        error: 'El horario permitido para reservas es exclusivamente de 10:00 a.m. a 7:00 p.m.'
      });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Buscar propietario asociado al usuario en sesión
      const [propietario] = await connection.query(
        'SELECT id FROM propietario WHERE id_user_data = (SELECT id FROM user_data WHERE id_usuario = ?)',
        [idUsuario]
      );

      if (propietario.length === 0) {
        await connection.rollback();
        return res.status(403).json({ error: 'No se encontró un propietario asociado a este usuario.' });
      }

      const idPropietario = propietario[0].id;

      // Obtener tarifas oficiales de salon_comunal y silla
      const [salonCfg] = await connection.query('SELECT valor_hora FROM salon_comunal WHERE id = 1 LIMIT 1');
      const [sillasCfg] = await connection.query('SELECT valor_hora, cantidad FROM silla WHERE id = 1 LIMIT 1');

      const vhSalon = salonCfg.length > 0 ? salonCfg[0].valor_hora : 50000;
      const vhSillas = sillasCfg.length > 0 ? (sillasCfg[0].valor_hora || 20000) : 20000;
      const stockTotalSillas = sillasCfg.length > 0 ? sillasCfg[0].cantidad : 120;

      let valorFinal = vhSalon;
      if (tipoAlquiler === 'sillas') valorFinal = vhSillas;
      if (tipoAlquiler === 'ambos') valorFinal = vhSalon + vhSillas;

      let idSalonComunal = null;
      if (tipoAlquiler === 'salon' || tipoAlquiler === 'ambos') {
        const [salones] = await connection.query('SELECT id FROM salon_comunal LIMIT 1');
        idSalonComunal = salones.length > 0 ? salones[0].id : 1;

        // Validar que el salón no esté reservado en ese horario
        const [colisiones] = await connection.query(
          `SELECT id, DATE_FORMAT(hora_inicio, '%H:%i') as inicio, DATE_FORMAT(hora_fin, '%H:%i') as fin
           FROM alquiler
           WHERE id_salon_comunal IS NOT NULL
             AND estado IN ('Reservado', 'Confirmado')
             AND hora_inicio < ? AND hora_fin > ?
           LIMIT 1`,
          [horaFin, horaInicio]
        );

        if (colisiones.length > 0) {
          await connection.rollback();
          return res.status(409).json({
            error: `El Salón Comunal ya se encuentra ocupado de ${colisiones[0].inicio} a ${colisiones[0].fin}. Por favor elige otro horario.`
          });
        }
      }

      // Validar disponibilidad de sillas
      if (tipoAlquiler === 'sillas' || tipoAlquiler === 'ambos') {
        if (cantidadSillas <= 0) {
          await connection.rollback();
          return res.status(400).json({ error: 'Debes especificar al menos 1 silla.' });
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
          await connection.rollback();
          return res.status(409).json({
            error: `Solo quedan ${disponibles} sillas disponibles en ese horario (${sillasOcupadas} ya reservadas).`
          });
        }
      }

      // Insertar alquiler
      const [result] = await connection.query(
        'INSERT INTO alquiler (id_propietario, id_salon_comunal, descripcion, hora_inicio, hora_fin, valor_hora, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [idPropietario, idSalonComunal, descripcion.trim(), horaInicio, horaFin, valorFinal, 'Reservado']
      );

      const idAlquiler = result.insertId;

      // Insertar en alquiler_silla si aplica
      if (tipoAlquiler === 'sillas' || tipoAlquiler === 'ambos') {
        const [sillas] = await connection.query('SELECT id FROM silla LIMIT 1');
        const idSilla = sillas.length > 0 ? sillas[0].id : 1;

        try {
          await connection.query(
            'INSERT INTO alquiler_silla (id_alquiler, id_silla, cantidad) VALUES (?, ?, ?)',
            [idAlquiler, idSilla, cantidadSillas]
          );
        } catch (e) {
          // Fallback si no tiene columna cantidad
          await connection.query(
            'INSERT INTO alquiler_silla (id_alquiler, id_silla) VALUES (?, ?)',
            [idAlquiler, idSilla]
          );
        }
      }

      await connection.commit();
      res.status(201).json({ message: 'Alquiler creado exitosamente', id: idAlquiler, valorHora: valorFinal });
    } catch (error) {
      await connection.rollback();
      console.error('Error al crear alquiler:', error);
      next(error);
    } finally {
      connection.release();
    }
  }
);

/**
 * ==============================================================================
 * 8. PUT /:id (Actualizar alquiler o estado)
 * ==============================================================================
 */
router.put('/:id', verificarToken, async (req, res, next) => {
  const { id } = req.params;
  const { estado } = req.body;
  const esAdmin = req.usuario.rol === 'Administrador';

  if (!esAdmin) {
    return res.status(403).json({ error: 'Solo el administrador puede actualizar el estado.' });
  }

  try {
    await pool.query('UPDATE alquiler SET estado = ? WHERE id = ?', [estado, id]);
    res.json({ message: 'Estado actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    next(error);
  }
});

/**
 * ==============================================================================
 * 9. DELETE /:id (Cancelar reserva)
 * ==============================================================================
 */
router.delete('/:id', verificarToken, async (req, res, next) => {
  const { id } = req.params;
  const idUsuario = req.usuario.id;
  const esAdmin = req.usuario.rol === 'Administrador';

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [alquiler] = await connection.query(
      `SELECT a.id, a.id_propietario, a.hora_inicio, a.estado, ud.id_usuario 
       FROM alquiler a
       JOIN propietario p ON a.id_propietario = p.id
       JOIN user_data ud ON p.id_user_data = ud.id
       WHERE a.id = ?`,
      [id]
    );

    if (alquiler.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Alquiler no encontrado' });
    }

    if (!esAdmin && alquiler[0].id_usuario !== idUsuario) {
      await connection.rollback();
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta reserva' });
    }

    if (!esAdmin) {
      const fechaInicioActual = new Date(alquiler[0].hora_inicio);
      const ahora = new Date();
      const horasRestantes = (fechaInicioActual.getTime() - ahora.getTime()) / (1000 * 60 * 60);

      if (horasRestantes < 24) {
        await connection.rollback();
        return res.status(400).json({
          error: 'No puedes cancelar una reserva con menos de 24 horas de anticipación.'
        });
      }
    }

    await connection.query('DELETE FROM alquiler_silla WHERE id_alquiler = ?', [id]);
    await connection.query('DELETE FROM alquiler WHERE id = ?', [id]);

    await connection.commit();
    res.json({ message: 'Reserva eliminada exitosamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al eliminar alquiler:', error);
    next(error);
  } finally {
    connection.release();
  }
});

module.exports = router;