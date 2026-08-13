const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all alquiler_silla
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM alquiler_silla');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET alquiler_silla by ID (requires both id_alquiler and id_silla)
router.get('/:id_alquiler/:id_silla', async (req, res) => {
  try {
    const { id_alquiler, id_silla } = req.params;

    const [rows] = await pool.query(
      'SELECT * FROM alquiler_silla WHERE id_alquiler = ? AND id_silla = ?',
      [id_alquiler, id_silla]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Relación alquiler-silla no encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE alquiler_silla
router.post('/', async (req, res) => {
  try {
    const { id_alquiler, id_silla } = req.body;

    const [result] = await pool.query(
      'INSERT INTO alquiler_silla (id_alquiler, id_silla) VALUES (?, ?)',
      [id_alquiler, id_silla]
    );

    res.status(201).json({ id_alquiler, id_silla });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE alquiler_silla (not typically used for junction tables)
router.put('/:id_alquiler/:id_silla', async (req, res) => {
  try {
    // Since this is a junction table with composite key, updating doesn't make much sense
    // We would typically delete and create a new relation
    res.status(400).json({ message: 'Use delete followed by create to modify relations' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE alquiler_silla
router.delete('/:id_alquiler/:id_silla', async (req, res) => {
  try {
    const { id_alquiler, id_silla } = req.params;

    const [result] = await pool.query(
      'DELETE FROM alquiler_silla WHERE id_alquiler = ? AND id_silla = ?',
      [id_alquiler, id_silla]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Relación alquiler-silla no encontrada' });
    }

    res.json({ message: 'Relación alquiler-silla eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;