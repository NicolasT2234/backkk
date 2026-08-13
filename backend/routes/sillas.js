const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all sillas
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM silla');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET silla by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM silla WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Silla no encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE silla
router.post('/', async (req, res) => {
  try {
    const { cantidad, estado } = req.body;

    const [result] = await pool.query(
      'INSERT INTO silla (cantidad, estado) VALUES (?, ?)',
      [cantidad, estado]
    );

    res.status(201).json({ id: result.insertId, cantidad, estado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE silla
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad, estado } = req.body;

    const [result] = await pool.query(
      'UPDATE silla SET cantidad = ?, estado = ? WHERE id = ?',
      [cantidad, estado, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Silla no encontrada' });
    }

    res.json({ message: 'Silla actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE silla
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM silla WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Silla no encontrada' });
    }

    res.json({ message: 'Silla eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;