const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');

const router = express.Router();

// GET /tipos_multa (obtener todos los tipos de multa)
router.get('/', verificarToken, async (req, res) => {
  try {
    const [tiposMulta] = await pool.query(
      `SELECT id, numero, descripcion, valor, estado
       FROM tipo_multa
       ORDER BY id`
    );
    res.json(tiposMulta);
  } catch (error) {
    console.error('Error al obtener tipos de multa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /tipos_multa/:id (obtener un tipo de multa específico)
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [tiposMulta] = await pool.query(
      `SELECT id, numero, descripcion, valor, estado
       FROM tipo_multa
       WHERE id = ?`,
      [id]
    );

    if (tiposMulta.length === 0) {
      return res.status(404).json({ error: 'Tipo de multa no encontrado' });
    }

    res.json(tiposMulta[0]);
  } catch (error) {
    console.error('Error al obtener tipo de multa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /tipos_multa (crear un nuevo tipo de multa - solo administradores)
router.post('/', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { numero, descripcion, valor, estado } = req.body;

  if (!numero || !descripcion || !valor || !estado) {
    return res.status(400).json({ error: 'Faltan campos requeridos: numero, descripcion, valor, estado' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO tipo_multa (numero, descripcion, valor, estado) VALUES (?, ?, ?, ?)',
      [numero, descripcion, valor, estado]
    );
    res.status(201).json({ message: 'Tipo de multa creado exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error al crear tipo de multa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /tipos_multa/:id (actualizar un tipo de multa - solo administradores)
router.put('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { numero, descripcion, valor, estado } = req.body;
  const { id } = req.params;

  if (!numero && !descripcion && !valor && !estado) {
    return res.status(400).json({ error: 'Al menos un campo debe proporcionarse' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const updates = [];
    const values = [];

    if (numero !== undefined) {
      updates.push('numero = ?');
      values.push(numero);
    }
    if (descripcion !== undefined) {
      updates.push('descripcion = ?');
      values.push(descripcion);
    }
    if (valor !== undefined) {
      updates.push('valor = ?');
      values.push(valor);
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
      `UPDATE tipo_multa SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    await connection.commit();
    res.json({ message: 'Tipo de multa actualizado exitosamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar tipo de multa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

// DELETE /tipos_multa/:id (eliminar un tipo de multa - solo administradores)
router.delete('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tipo_multa WHERE id = ?', [id]);
    res.json({ message: 'Tipo de multa eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar tipo de multa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;