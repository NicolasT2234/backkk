const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');

const router = express.Router();

// GET /multas (solo administradores)
router.get('/', verificarToken, verificarRol('Administrador'), async (req, res) => {
  try {
    const [multas] = await pool.query(
      `SELECT m.id, m.descripcion, m.monto, m.fecha_vencimiento, m.fecha_pago, m.estado,
              ap.bloque, ap.numero, i.descripcion as interior,
              ud.nombre as nombre_propietario, ud.apellido as apellido_propietario
       FROM multa m
       JOIN apartamento ap ON m.id_apartamento = ap.id
       JOIN bloque b ON ap.id_bloque = b.id
       JOIN interior i ON ap.id_interior = i.id
       JOIN propietario p ON ap.id = p.id_apartamento
       JOIN user_data ud ON p.id_user_data = ud.id_usuario
       ORDER BY m.fecha_vencimiento ASC`
    );
    res.json(multas);
  } catch (error) {
    console.error('Error al obtener multas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /multas/:id (solo administradores)
router.get('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  try {
    const { id } = req.params;
    const [multas] = await pool.query(
      `SELECT m.id, m.descripcion, m.monto, m.fecha_vencimiento, m.fecha_pago, m.estado,
              ap.bloque, ap.numero, i.descripcion as interior,
              ud.nombre as nombre_propietario, ud.apellido as apellido_propietario
       FROM multa m
       JOIN apartamento ap ON m.id_apartamento = ap.id
       JOIN bloque b ON ap.id_bloque = b.id
       JOIN interior i ON ap.id_interior = i.id
       JOIN propietario p ON ap.id = p.id_apartamento
       JOIN user_data ud ON p.id_user_data = ud.id_usuario
       WHERE m.id = ?`,
      [id]
    );

    if (multas.length === 0) {
      return res.status(404).json({ error: 'Multa no encontrada' });
    }

    res.json(multas[0]);
  } catch (error) {
    console.error('Error al obtener multa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /multas (solo administradores)
router.post('/', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { descripcion, monto, fechaVencimiento, idApartamento } = req.body;

  if (!descripcion || !monto || !fechaVencimiento || !idApartamento) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO multa (descripcion, monto, fecha_vencimiento, estado, id_apartamento) VALUES (?, ?, ?, ?, ?)',
      [descripcion, monto, fechaVencimiento, 'Pendiente', idApartamento]
    );
    res.status(201).json({ message: 'Multa creada exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error al crear multa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /multas/:id (solo administradores)
router.put('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { descripcion, monto, fechaVencimiento, fechaPago, estado } = req.body;
  const { id } = req.params;

  if (!descripcion && !monto && !fechaVencimiento && !fechaPago && !estado) {
    return res.status(400).json({ error: 'Al menos un campo debe proporcionarse' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const updates = [];
    const values = [];

    if (descripcion !== undefined) {
      updates.push('descripcion = ?');
      values.push(descripcion);
    }
    if (monto !== undefined) {
      updates.push('monto = ?');
      values.push(monto);
    }
    if (fechaVencimiento !== undefined) {
      updates.push('fecha_vencimiento = ?');
      values.push(fechaVencimiento);
    }
    if (fechaPago !== undefined) {
      updates.push('fecha_pago = ?');
      values.push(fechaPago);
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
      `UPDATE multa SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    await connection.commit();
    res.json({ message: 'Multa actualizada exitosamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar multa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

// DELETE /multas/:id (solo administradores)
router.delete('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM multa WHERE id = ?', [id]);
    res.json({ message: 'Multa eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar multa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /mis-multas
router.get('/mis-multas', verificarToken, async (req, res) => {
  try {
    const idUsuario = req.usuario.id;

    const [multas] = await pool.query(
      `SELECT m.id, m.descripcion, m.monto, m.fecha_vencimiento, m.fecha_pago, m.estado,
              ap.bloque, ap.numero, i.descripcion as interior
       FROM multa m
       JOIN apartamento ap ON m.id_apartamento = ap.id
       JOIN bloque b ON ap.id_bloque = b.id
       JOIN interior i ON ap.id_interior = i.id
       WHERE ap.id IN (
         SELECT ap.id FROM apartamento ap
         JOIN propietario pt ON ap.id = pt.id_apartamento
         JOIN user_data ud ON pt.id_user_data = ud.id_usuario
         WHERE ud.id_usuario = ?
       )
       AND m.estado = ?
       ORDER BY m.fecha_vencimiento ASC`,
      [idUsuario, 'Pendiente']
    );

    res.json(multas);
  } catch (error) {
    console.error('Error al obtener mis multas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;