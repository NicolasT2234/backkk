const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');

const router = express.Router();

// GET /salon-comunal (solo administradores para escritura, lectura pública o filtro)
router.get('/', verificarToken, async (req, res) => {
  try {
    const [salones] = await pool.query(
      'SELECT id, nombre, descripcion, capacidad, costo_hora FROM salon_comunal ORDER BY nombre'
    );
    res.json(salones);
  } catch (error) {
    console.error('Error al obtener salones comunales:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /salon-comunal/:id
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [salones] = await pool.query(
      'SELECT id, nombre, descripcion, capacidad, costo_hora FROM salon_comunal WHERE id = ?',
      [id]
    );

    if (salones.length === 0) {
      return res.status(404).json({ error: 'Salón comunal no encontrado' });
    }

    res.json(salones[0]);
  } catch (error) {
    console.error('Error al obtener salón comunal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /salon-comunal (solo administradores)
router.post('/', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { nombre, descripcion, capacidad, costoHora } = req.body;

  if (!nombre || !descripcion || !capacidad || !costoHora) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO salon_comunal (nombre, descripcion, capacidad, costo_hora) VALUES (?, ?, ?, ?)',
      [nombre, descripcion, capacidad, costoHora]
    );
    res.status(201).json({ message: 'Salón comunal creado exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error al crear salón comunal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /salon-comunal/:id (solo administradores)
router.put('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { nombre, descripcion, capacidad, costoHora } = req.body;
  const { id } = req.params;

  if (!nombre && !descripcion && !capacidad && costoHora === undefined) {
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
    if (capacidad !== undefined) {
      updates.push('capacidad = ?');
      values.push(capacidad);
    }
    if (costoHora !== undefined) {
      updates.push('costo_hora = ?');
      values.push(costoHora);
    }

    if (updates.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    values.push(id);
    await connection.query(
      `UPDATE salon_comunal SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    await connection.commit();
    res.json({ message: 'Salón comunal actualizado exitosamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar salón comunal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

// DELETE /salon-comunal/:id (solo administradores)
router.delete('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM salon_comunal WHERE id = ?', [id]);
    res.json({ message: 'Salón comunal eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar salón comunal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;