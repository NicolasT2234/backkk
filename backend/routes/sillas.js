const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');

const router = express.Router();

// GET /sillas (solo administradores para escritura, lectura pública o filtro)
router.get('/', verificarToken, async (req, res) => {
  try {
    const [sillas] = await pool.query(
      'SELECT id, numero, estado FROM silla ORDER BY numero'
    );
    res.json(sillas);
  } catch (error) {
    console.error('Error al obtener sillas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /sillas/:id
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [sillas] = await pool.query(
      'SELECT id, numero, estado FROM silla WHERE id = ?',
      [id]
    );

    if (sillas.length === 0) {
      return res.status(404).json({ error: 'Silla no encontrada' });
    }

    res.json(sillas[0]);
  } catch (error) {
    console.error('Error al obtener silla:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /sillas (solo administradores)
router.post('/', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { numero, estado } = req.body;

  if (!numero) {
    return res.status(400).json({ error: 'Número de silla requerido' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO silla (numero, estado) VALUES (?, ?)',
      [numero, estado || 'Disponible']
    );
    res.status(201).json({ message: 'Silla creada exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error al crear silla:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /sillas/:id (solo administradores)
router.put('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { numero, estado } = req.body;
  const { id } = req.params;

  if (!numero && estado === undefined) {
    return res.status(400).json({ error: 'Al menos un campo deve proporcionarse' });
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
      `UPDATE silla SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    await connection.commit();
    res.json({ message: 'Silla actualizada exitosamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar silla:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

// DELETE /sillas/:id (solo administradores)
router.delete('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM silla WHERE id = ?', [id]);
    res.json({ message: 'Silla eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar silla:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;