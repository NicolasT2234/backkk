const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');

// GET all administradores
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM administrador');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET administrador by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM administrador WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Administrador no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE administrador
router.post('/', async (req, res) => {
  try {
    const { id_user_data, estado, fecha_inicio, fecha_fin } = req.body;

    const [result] = await pool.query(
      'INSERT INTO administrador (id_user_data, estado, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?)',
      [id_user_data, estado, fecha_inicio, fecha_fin]
    );

    res.status(201).json({ id: result.insertId, id_user_data, estado, fecha_inicio, fecha_fin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE administrador
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { id_user_data, estado, fecha_inicio, fecha_fin } = req.body;

    const [result] = await pool.query(
      'UPDATE administrador SET id_user_data = ?, estado = ?, fecha_inicio = ?, fecha_fin = ? WHERE id = ?',
      [id_user_data, estado, fecha_inicio, fecha_fin, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Administrador no encontrado' });
    }

    res.json({ message: 'Administrador actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE administrador
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM administrador WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Administrador no encontrado' });
    }

    res.json({ message: 'Administrador eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;