const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all tipo_documento
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tipo_documento');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET tipo_documento by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tipo_documento WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Tipo de documento no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE tipo_documento
router.post('/', async (req, res) => {
  try {
    const { sigla, nombre_documento, estado } = req.body;

    const [result] = await pool.query(
      'INSERT INTO tipo_documento (sigla, nombre_documento, estado) VALUES (?, ?, ?)',
      [sigla, nombre_documento, estado]
    );

    res.status(201).json({ id: result.insertId, sigla, nombre_documento, estado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE tipo_documento
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { sigla, nombre_documento, estado } = req.body;

    const [result] = await pool.query(
      'UPDATE tipo_documento SET sigla = ?, nombre_documento = ?, estado = ? WHERE id = ?',
      [sigla, nombre_documento, estado, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Tipo de documento no encontrado' });
    }

    res.json({ message: 'Tipo de documento actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE tipo_documento
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM tipo_documento WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Tipo de documento no encontrado' });
    }

    res.json({ message: 'Tipo de documento eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;