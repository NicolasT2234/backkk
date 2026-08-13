const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all roles
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rol');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET role by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rol WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE role
router.post('/', async (req, res) => {
  try {
    const { nombre } = req.body;

    const [result] = await pool.query(
      'INSERT INTO rol (nombre) VALUES (?)',
      [nombre]
    );

    res.status(201).json({ id: result.insertId, nombre });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE role
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    const [result] = await pool.query(
      'UPDATE rol SET nombre = ? WHERE id = ?',
      [nombre, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    res.json({ message: 'Rol actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE role
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM rol WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    res.json({ message: 'Rol eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;