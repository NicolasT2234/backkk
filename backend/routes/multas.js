const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');

const router = express.Router();

// GET /multas (solo administradores)
router.get('/', verificarToken, verificarRol('Administrador'), async (req, res) => {
  try {
    const [multas] = await pool.query(
      `SELECT m.id, m.numero, m.nombre, m.descripcion, m.estado,
              b.nombre as bloque, ap.numero,
              ud.primer_nombre as nombre_propietario, ud.primer_apellido as apellido_propietario,
              tm.valor as monto
       FROM multa m
       JOIN apartamento ap ON m.id_apartamento = ap.id
       JOIN interior i ON ap.id_interior = i.id
       JOIN bloque b ON i.id_bloque = b.id
       LEFT JOIN propietario_gestion_apartamento pga ON pga.id_apartamento = ap.id AND pga.estado = 'Activo'
       LEFT JOIN propietario p ON pga.id_propietario = p.id
       LEFT JOIN user_data ud ON p.id_user_data = ud.id
       JOIN tipo_multa tm ON m.id_tipo_multa = tm.id
       ORDER BY m.estado ASC, m.id DESC`
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
      `SELECT m.id, m.numero, m.nombre, m.descripcion, m.estado,
              b.nombre as bloque, ap.numero,
              ud.primer_nombre as nombre_propietario, ud.primer_apellido as apellido_propietario,
              tm.valor as monto
       FROM multa m
       JOIN apartamento ap ON m.id_apartamento = ap.id
       JOIN interior i ON ap.id_interior = i.id
       JOIN bloque b ON i.id_bloque = b.id
       LEFT JOIN propietario_gestion_apartamento pga ON pga.id_apartamento = ap.id AND pga.estado = 'Activo'
       LEFT JOIN propietario p ON pga.id_propietario = p.id
       LEFT JOIN user_data ud ON p.id_user_data = ud.id
       JOIN tipo_multa tm ON m.id_tipo_multa = tm.id
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
  const { nombre, descripcion, id_tipo_multa, id_administrador, evidencia, idApartamento } = req.body;

  if (!nombre || !descripcion || !id_tipo_multa || !id_administrador || !evidencia || !idApartamento) {
    return res.status(400).json({ error: 'Faltan campos requeridos: nombre, descripcion, id_tipo_multa, id_administrador, evidencia, idApartamento' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO multa (numero, nombre, descripcion, id_tipo_multa, id_administrador, evidencia, estado, id_apartamento) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [Date.now(), nombre, descripcion, id_tipo_multa, id_administrador, evidencia, 'Pendiente', idApartamento]
    );
    res.status(201).json({ message: 'Multa creada exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error al crear multa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /multas/:id (solo administradores)
router.put('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { nombre, descripcion, id_tipo_multa, id_administrador, evidencia, estado } = req.body;
  const { id } = req.params;

  if (!nombre && !descripcion && !id_tipo_multa && !id_administrador && !evidencia && !estado) {
    return res.status(400).json({ error: 'Al menos un campo debe proporcionarse' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const updates = [];
    const values = [];

    if (nombre !== undefined) {
      updates.push('nombre = ?');
      values.push(nombre);
    }
    if (descripcion !== undefined) {
      updates.push('descripcion = ?');
      values.push(descripcion);
    }
    if (id_tipo_multa !== undefined) {
      updates.push('id_tipo_multa = ?');
      values.push(id_tipo_multa);
    }
    if (id_administrador !== undefined) {
      updates.push('id_administrador = ?');
      values.push(id_administrador);
    }
    if (evidencia !== undefined) {
      updates.push('evidencia = ?');
      values.push(evidencia);
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
      `SELECT m.id, m.numero, m.nombre, m.descripcion, m.estado,
              b.nombre as bloque, ap.numero,
              tm.valor as monto
       FROM multa m
       JOIN apartamento ap ON m.id_apartamento = ap.id
       JOIN interior i ON ap.id_interior = i.id
       JOIN bloque b ON i.id_bloque = b.id
       JOIN tipo_multa tm ON m.id_tipo_multa = tm.id
       WHERE ap.id IN (
         SELECT pga.id_apartamento
         FROM propietario_gestion_apartamento pga
         JOIN propietario pt ON pga.id_propietario = pt.id
         JOIN user_data ud ON pt.id_user_data = ud.id
         WHERE ud.id_usuario = ? AND pga.estado = 'Activo'
       )
       AND m.estado = ?
       ORDER BY m.id DESC`,
      [idUsuario, 'Pendiente']
    );

    res.json(multas);
  } catch (error) {
    console.error('Error al obtener mis multas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;