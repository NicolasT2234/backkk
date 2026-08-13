const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all pqr_especifica
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pqr_especifica');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET pqr_especifica by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pqr_especifica WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'PQR específica no encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE pqr_especifica
router.post('/', async (req, res) => {
  try {
    const { id_queja_sugerencia, id_apartamento } = req.body;

    const [result] = await pool.query(
      'INSERT INTO pqr_especifica (id_queja_sugerencia, id_apartamento) VALUES (?, ?)',
      [id_queja_sugerencia, id_apartamento]
    );

    res.status(201).json({ id: result.insertId, id_queja_sugerencia, id_apartamento });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE pqr_especifica
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { id_queja_sugerencia, id_apartamento } = req.body;

    const [result] = await pool.query(
      'UPDATE pqr_especifica SET id_queja_sugerencia = ?, id_apartamento = ? WHERE id = ?',
      [id_queja_sugerencia, id_apartamento, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'PQR específica no encontrada' });
    }

    res.json({ message: 'PQR específica actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE pqr_especifica
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM pqr_especifica WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'PQR específica no encontrada' });
    }

    res.json({ message: 'PQR específica eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;