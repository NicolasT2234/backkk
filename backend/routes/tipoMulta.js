const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all tipo_multa
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tipo_multa');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET tipo_multa by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tipo_multa WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Tipo de multa no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE tipo_multa
router.post('/', async (req, res) => {
  try {
    const { numero, descripcion, valor, estado } = req.body;

    const [result] = await pool.query(
      'INSERT INTO tipo_multa (numero, descripcion, valor, estado) VALUES (?, ?, ?, ?)',
      [numero, descripcion, valor, estado]
    );

    res.status(201).json({ id: result.insertId, numero, descripcion, valor, estado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE tipo_multa
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, descripcion, valor, estado } = req.body;

    const [result] = await pool.query(
      'UPDATE tipo_multa SET numero = ?, descripcion = ?, valor = ?, estado = ? WHERE id = ?',
      [numero, descripcion, valor, estado, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Tipo de multa no encontrado' });
    }

    res.json({ message: 'Tipo de multa actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE tipo_multa
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM tipo_multa WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Tipo de multa no encontrado' });
    }

    res.json({ message: 'Tipo de multa eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;