const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');

const router = express.Router();

// GET /alquileres (solo administradores)
router.get('/', verificarToken, verificarRol('Administrador'), async (req, res) => {
  try {
    const [alquileres] = await pool.query(
      `SELECT a.id, a.fecha_inicio, a.fecha_fin, a.monto_total, a.estado,
              ap.bloque, ap.numero, i.descripcion as interior,
              ud.nombre as nombre_propietario, ud.apellido as apellido_propietario
       FROM alquiler a
       JOIN apartamento ap ON a.id_apartamento = ap.id
       JOIN bloque b ON ap.id_bloque = b.id
       JOIN interior i ON ap.id_interior = i.id
       JOIN propietario p ON a.id_propietario = p.id
       JOIN user_data ud ON p.id_user_data = ud.id_usuario
       ORDER BY a.fecha_inicio DESC`
    );
    res.json(alquileres);
  } catch (error) {
    console.error('Error al obtener alquileres:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /alquileres/:id (solo administradores)
router.get('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  try {
    const { id } = req.params;
    const [alquileres] = await pool.query(
      `SELECT a.id, a.fecha_inicio, a.fecha_fin, a.monto_total, a.estado,
              ap.bloque, ap.numero, i.descripcion as interior,
              ud.nombre as nombre_propietario, ud.apellido as apellido_propietario
       FROM alquiler a
       JOIN apartamento ap ON a.id_apartamento = ap.id
       JOIN bloque b ON ap.id_bloque = b.id
       JOIN interior i ON ap.id_interior = i.id
       JOIN propietario p ON a.id_propietario = p.id
       JOIN user_data ud ON p.id_user_data = ud.id_usuario
       WHERE a.id = ?`,
      [id]
    );

    if (alquileres.length === 0) {
      return res.status(404).json({ error: 'Alquiler no encontrado' });
    }

    res.json(alquileres[0]);
  } catch (error) {
    console.error('Error al obtener alquiler:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /alquileres (cualquier usuario autenticado puede crear su propia reserva)
router.post('/', verificarToken, async (req, res) => {
  const { idApartamento, fechaInicio, fechaFin, montoTotal } = req.body;

  if (!idApartamento || !fechaInicio || !fechaFin || !montoTotal) {
    return res.status(400).json({ error: 'Faltan campos requeridos: idApartamento, fechaInicio, fechaFin, montoTotal' });
  }

  const idUsuario = req.usuario.id;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Verificar que el usuario autenticado es propietario del apartamento
    const [propietario] = await connection.query(
      'SELECT id FROM propietario WHERE id_user_data = (SELECT id FROM user_data WHERE id_usuario = ?) AND id_apartamento = ?',
      [idUsuario, idApartamento]
    );

    if (propietario.length === 0) {
      await connection.rollback();
      return res.status(403).json({ error: 'No tienes permiso para crear una reserva para este apartamento' });
    }

    const idPropietario = propietario[0].id;

    // Validar disponibilidad: no overlap con otras reservas activas para el mismo apartamento
    const [overlap] = await connection.query(
      `SELECT COUNT(*) as count FROM alquiler
       WHERE id_apartamento = ?
         AND estado IN ('Activo', 'Reservado')
         AND NOT (fecha_fin <= ? OR fecha_inicio >= ?)`,
      [idApartamento, fechaInicio, fechaFin]
    );

    if (overlap[0].count > 0) {
      await connection.rollback();
      return res.status(409).json({ error: 'El apartamento ya está reservado para las fechas solicitadas' });
    }

    // Insertar alquiler
    const [result] = await connection.query(
      'INSERT INTO alquiler (id_apartamento, id_propietario, fecha_inicio, fecha_fin, monto_total, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [idApartamento, idPropietario, fechaInicio, fechaFin, montoTotal, 'Reservado']
    );

    await connection.commit();
    res.status(201).json({ message: 'Alquiler creado exitosamente', id: result.insertId });
  } catch (error) {
    await connection.rollback();
    console.error('Error al crear alquiler:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

// PUT /alquileres/:id (solo administradores)
router.put('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { fechaInicio, fechaFin, montoTotal, estado } = req.body;
  const { id } = req.params;

  if (!fechaInicio && !fechaFin && !montoTotal && !estado) {
    return res.status(400).json({ error: 'Al menos un campo debe proporcionarse' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const updates = [];
    const values = [];

    if (fechaInicio !== undefined) {
      updates.push('fecha_inicio = ?');
      values.push(fechaInicio);
    }
    if (fechaFin !== undefined) {
      updates.push('fecha_fin = ?');
      values.push(fechaFin);
    }
    if (montoTotal !== undefined) {
      updates.push('monto_total = ?');
      values.push(montoTotal);
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
    res.status(500).json({ error: 'Error interno del servidor' });
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

// GET /mis-alquileres
router.get('/mis-alquileres', verificarToken, async (req, res) => {
  try {
    const idUsuario = req.usuario.id;

    const [alquileres] = await pool.query(
      `SELECT a.id, a.fecha_inicio, a.fecha_fin, a.monto_total, a.estado,
              ap.bloque, ap.numero, i.descripcion as interior
       FROM alquiler a
       JOIN apartamento ap ON a.id_apartamento = ap.id
       JOIN bloque b ON ap.id_bloque = b.id
       JOIN interior i ON ap.id_interior = i.id
       WHERE a.id_propietario = (
         SELECT p.id FROM propietario p
         JOIN user_data ud ON p.id_user_data = ud.id_usuario
         WHERE ud.id_usuario = ?
       )
       ORDER BY a.fecha_inicio DESC`,
      [idUsuario]
    );

    res.json(alquileres);
  } catch (error) {
    console.error('Error al obtener mis alquileres:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;