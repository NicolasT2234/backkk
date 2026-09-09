const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// GET /alquileres (solo administradores)
router.get('/', verificarToken, verificarRol('Administrador'), async (req, res) => {
  try {
    const [alquileres] = await pool.query(
      `SELECT a.id, a.descripcion, a.hora_inicio, a.hora_fin, a.valor_hora, a.estado,
              p.id as id_propietario,
              ud.primer_nombre as nombre_propietario, ud.primer_apellido as apellido_propietario,
              s.id as id_salon_comunal
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

// GET /mis-alquileres (debe ir ANTES de /:id, si no Express lo confunde con un :id)
router.get('/mis-alquileres', verificarToken, async (req, res) => {
  try {
    const idUsuario = req.usuario.id;

    const [alquileres] = await pool.query(
      `SELECT a.id, a.descripcion, a.hora_inicio, a.hora_fin, a.valor_hora, a.estado
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
router.get('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
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

// POST /alquileres (cualquier usuario autenticado puede crear su propia reserva)
router.post('/',
  [
    body('descripcion').trim().notEmpty().withMessage('Descripción requerida'),
    body('horaInicio').trim().notEmpty().withMessage('Hora de inicio requerida'),
    body('horaFin').trim().notEmpty().withMessage('Hora de fin requerida'),
    body('valorHora').isFloat({ gt: 0 }).withMessage('Valor hora debe ser un número positivo')
  ],
  verificarToken, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { descripcion, horaInicio, horaFin, valorHora } = req.body;

  const idUsuario = req.usuario.id;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Obtener id_propietario del usuario autenticado
    const [propietario] = await connection.query(
      'SELECT id FROM propietario WHERE id_user_data = (SELECT id FROM user_data WHERE id_usuario = ?)',
      [idUsuario]
    );

    if (propietario.length === 0) {
      await connection.rollback();
      return res.status(403).json({ error: 'No se encontró propietario para el usuario autenticado' });
    }

    const idPropietario = propietario[0].id;

    // Insertar alquiler
    const [result] = await connection.query(
      'INSERT INTO alquiler (id_propietario, id_salon_comunal, descripcion, hora_inicio, hora_fin, valor_hora, estado) VALUES (?, NULL, ?, ?, ?, ?, ?)',
      [idPropietario, descripcion, horaInicio, horaFin, valorHora, 'Reservado']
    );

    await connection.commit();
    res.status(201).json({ message: 'Alquiler creado exitosamente', id: result.insertId });
  } catch (error) {
    await connection.rollback();
    console.error('Error al crear alquiler:', error);
    next(error);
  } finally {
    connection.release();
  }
});

// PUT /alquileres/:id (solo administradores)
router.put('/:id',
  [
    body('descripcion').optional().trim().notEmpty().withMessage('Descripción no puede estar vacía'),
    body('horaInicio').optional().trim().notEmpty().withMessage('Hora de inicio requerida si se proporciona'),
    body('horaFin').optional().trim().notEmpty().withMessage('Hora de fin requerida si se proporciona'),
    body('valorHora').optional().isFloat({ gt: 0 }).withMessage('Valor hora debe ser un número positivo si se proporciona'),
    body('estado').optional().trim().notEmpty().withMessage('Estado no puede estar vacío si se proporciona')
  ],
  verificarToken, verificarRol('Administrador'), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { descripcion, horaInicio, horaFin, valorHora, estado } = req.body;
    const { id } = req.params;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const updates = [];
    const values = [];

    if (descripcion !== undefined) {
      updates.push('descripcion = ?');
      values.push(descripcion);
    }
    if (horaInicio !== undefined) {
      updates.push('hora_inicio = ?');
      values.push(horaInicio);
    }
    if (horaFin !== undefined) {
      updates.push('hora_fin = ?');
      values.push(horaFin);
    }
    if (valorHora !== undefined) {
      updates.push('valor_hora = ?');
      values.push(valorHora);
    }
    if (estado !== undefined) {
      updates.push('estado = ?');
      values.push(estado);
    }

    if (updates.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    values.push(id);
    await connection.query(
      `UPDATE alquiler SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    await connection.commit();
    res.json({ message: 'Alquiler actualizado exitosamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar alquiler:', error);
    next(error);
  } finally {
    connection.release();
  }
});

// DELETE /alquileres/:id (solo administradores)
router.delete('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM alquiler WHERE id = ?', [id]);
    res.json({ message: 'Alquiler eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar alquiler:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;