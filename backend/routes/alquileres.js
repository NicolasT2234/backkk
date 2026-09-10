const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// GET /alquileres (solo administradores)
router.get('/', verificarToken, verificarRol('Administrador'), async (req, res, next) => {
  try {
    const [alquileres] = await pool.query(
      `SELECT a.id, a.descripcion, a.hora_inicio, a.hora_fin, a.valor_hora, a.estado,
              p.id as id_propietario,
              ud.primer_nombre as nombre_propietario, ud.primer_apellido as apellido_propietario,
              s.id as id_salon_comunal,
              CASE 
                WHEN a.id_salon_comunal IS NOT NULL AND (SELECT COUNT(*) FROM alquiler_silla WHERE id_alquiler = a.id) > 0 THEN 'ambos'
                WHEN a.id_salon_comunal IS NOT NULL THEN 'salon'
                ELSE 'sillas'
              END as tipo_alquiler
       FROM alquiler a
       JOIN propietario p ON a.id_propietario = p.id
       JOIN user_data ud ON p.id_user_data = ud.id
       LEFT JOIN salon_comunal s ON a.id_salon_comunal = s.id
       ORDER BY a.hora_inicio DESC`
    );
    res.json(alquileres);
  } catch (error) {
    console.error('Error al obtener alquileres:', error);
    next(error);
  }
});

// GET /mis-alquileres (reservas del usuario autenticado)
router.get('/mis-alquileres', verificarToken, async (req, res, next) => {
  try {
    const idUsuario = req.usuario.id;

    const [alquileres] = await pool.query(
      `SELECT a.id, a.descripcion, a.hora_inicio, a.hora_fin, a.valor_hora, a.estado,
              a.id_salon_comunal,
              CASE 
                WHEN a.id_salon_comunal IS NOT NULL AND (SELECT COUNT(*) FROM alquiler_silla WHERE id_alquiler = a.id) > 0 THEN 'ambos'
                WHEN a.id_salon_comunal IS NOT NULL THEN 'salon'
                ELSE 'sillas'
              END as tipo_alquiler
       FROM alquiler a
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

// GET /alquileres/:id (solo administradores)
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

// POST /alquileres (crear reserva de alquiler)
router.post('/',
  [
    body('descripcion').trim().notEmpty().withMessage('La descripción o motivo es requerida'),
    body('horaInicio').trim().notEmpty().withMessage('Hora de inicio requerida'),
    body('horaFin').trim().notEmpty().withMessage('Hora de fin requerida'),
    body('tipoAlquiler').isIn(['salon', 'sillas', 'ambos']).withMessage('Tipo de alquiler inválido'),
    body('valorHora').optional().isFloat({ gt: 0 })
  ],
  verificarToken, async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { descripcion, horaInicio, horaFin, tipoAlquiler, valorHora } = req.body;
    const idUsuario = req.usuario.id;
    const valorFinal = valorHora || 50000;

    // Validación cronológica: inicio debe ser anterior a fin
    const inicio = new Date(horaInicio);
    const fin = new Date(horaFin);
    if (inicio >= fin) {
      return res.status(400).json({
        error: 'La fecha y hora de inicio debe ser anterior a la fecha y hora de salida.'
      });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [propietario] = await connection.query(
        'SELECT id FROM propietario WHERE id_user_data = (SELECT id FROM user_data WHERE id_usuario = ?)',
        [idUsuario]
      );

      if (propietario.length === 0) {
        await connection.rollback();
        return res.status(403).json({ error: 'No se encontró un propietario asociado a este usuario' });
      }

      const idPropietario = propietario[0].id;

      let idSalonComunal = null;
      if (tipoAlquiler === 'salon' || tipoAlquiler === 'ambos') {
        const [salones] = await connection.query('SELECT id FROM salon_comunal LIMIT 1');
        idSalonComunal = salones.length > 0 ? salones[0].id : 1;
      }

      const [result] = await connection.query(
        'INSERT INTO alquiler (id_propietario, id_salon_comunal, descripcion, hora_inicio, hora_fin, valor_hora, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [idPropietario, idSalonComunal, descripcion.trim(), horaInicio, horaFin, valorFinal, 'Reservado']
      );

      const idAlquiler = result.insertId;

      if (tipoAlquiler === 'sillas' || tipoAlquiler === 'ambos') {
        const [sillas] = await connection.query('SELECT id FROM silla LIMIT 1');
        const idSilla = sillas.length > 0 ? sillas[0].id : 1;

        await connection.query(
          'INSERT INTO alquiler_silla (id_alquiler, id_silla) VALUES (?, ?)',
          [idAlquiler, idSilla]
        );
      }

      await connection.commit();
      res.status(201).json({ message: 'Alquiler creado exitosamente', id: idAlquiler });
    } catch (error) {
      await connection.rollback();
      console.error('Error al crear alquiler:', error);
      next(error);
    } finally {
      connection.release();
    }
  }
);

// PUT /alquileres/:id (Administrador O Residente dueño de la reserva)
router.put('/:id',
  [
    body('descripcion').optional().trim().notEmpty().withMessage('La descripción no puede estar vacía'),
    body('horaInicio').optional().trim().notEmpty().withMessage('Hora de inicio requerida'),
    body('horaFin').optional().trim().notEmpty().withMessage('Hora de fin requerida'),
    body('tipoAlquiler').optional().isIn(['salon', 'sillas', 'ambos']),
    body('valorHora').optional().isFloat({ gt: 0 })
  ],
  verificarToken, async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { descripcion, horaInicio, horaFin, tipoAlquiler, valorHora, estado } = req.body;
    const idUsuario = req.usuario.id;
    const esAdmin = req.usuario.rol === 'Administrador';

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [alquiler] = await connection.query(
        `SELECT a.id, a.id_propietario, a.hora_inicio, a.hora_fin, a.estado, ud.id_usuario 
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
        return res.status(403).json({ error: 'No tienes permiso para modificar esta reserva' });
      }

      // Validación cronológica en modificación
      const finalInicio = horaInicio ? new Date(horaInicio) : new Date(alquiler[0].hora_inicio);
      const finalFin = horaFin ? new Date(horaFin) : new Date(alquiler[0].hora_fin);

      if (finalInicio >= finalFin) {
        await connection.rollback();
        return res.status(400).json({
          error: 'La fecha y hora de inicio debe ser anterior a la fecha y hora de salida.'
        });
      }

      // Validación de 24 horas para residentes
      if (!esAdmin) {
        const fechaInicioActual = new Date(alquiler[0].hora_inicio);
        const ahora = new Date();
        const horasRestantes = (fechaInicioActual.getTime() - ahora.getTime()) / (1000 * 60 * 60);

        if (horasRestantes < 24) {
          await connection.rollback();
          return res.status(400).json({
            error: 'No es posible modificar la reserva: debe hacerse con al menos 24 horas de anticipación a la fecha de inicio.'
          });
        }

        if (horaInicio) {
          const nuevaFecha = new Date(horaInicio);
          const horasNueva = (nuevaFecha.getTime() - ahora.getTime()) / (1000 * 60 * 60);
          if (horasNueva < 24) {
            await connection.rollback();
            return res.status(400).json({
              error: 'La nueva fecha de inicio también debe tener al menos 24 horas de anticipación.'
            });
          }
        }
      }

      const updates = [];
      const values = [];

      if (descripcion) { updates.push('descripcion = ?'); values.push(descripcion.trim()); }
      if (horaInicio) { updates.push('hora_inicio = ?'); values.push(horaInicio); }
      if (horaFin) { updates.push('hora_fin = ?'); values.push(horaFin); }
      if (valorHora) { updates.push('valor_hora = ?'); values.push(valorHora); }
      if (estado && esAdmin) { updates.push('estado = ?'); values.push(estado); }

      if (tipoAlquiler) {
        let idSalonComunal = null;
        if (tipoAlquiler === 'salon' || tipoAlquiler === 'ambos') {
          const [salones] = await connection.query('SELECT id FROM salon_comunal LIMIT 1');
          idSalonComunal = salones.length > 0 ? salones[0].id : 1;
        }
        updates.push('id_salon_comunal = ?');
        values.push(idSalonComunal);

        await connection.query('DELETE FROM alquiler_silla WHERE id_alquiler = ?', [id]);
        if (tipoAlquiler === 'sillas' || tipoAlquiler === 'ambos') {
          const [sillas] = await connection.query('SELECT id FROM silla LIMIT 1');
          const idSilla = sillas.length > 0 ? sillas[0].id : 1;
          await connection.query('INSERT INTO alquiler_silla (id_alquiler, id_silla) VALUES (?, ?)', [id, idSilla]);
        }
      }

      if (updates.length > 0) {
        values.push(id);
        await connection.query(`UPDATE alquiler SET ${updates.join(', ')} WHERE id = ?`, values);
      }

      await connection.commit();
      res.json({ message: 'Reserva actualizada exitosamente' });
    } catch (error) {
      await connection.rollback();
      console.error('Error al actualizar alquiler:', error);
      next(error);
    } finally {
      connection.release();
    }
  }
);

// DELETE /alquileres/:id (Administrador O Residente dueño de la reserva)
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