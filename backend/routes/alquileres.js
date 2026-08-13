const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all alquileres
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM alquiler');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET alquiler by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM alquiler WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Alquiler no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE alquiler
router.post('/', async (req, res) => {
  try {
    const { id_propietario, id_salon_comunal, descripcion, hora_inicio, hora_fin, valor_hora, estado } = req.body;

    const [result] = await pool.query(
      'INSERT INTO alquiler (id_propietario, id_salon_comunal, descripcion, hora_inicio, hora_fin, valor_hora, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id_propietario, id_salon_comunal, descripcion, hora_inicio, hora_fin, valor_hora, estado]
    );

    res.status(201).json({ id: result.insertId, id_propietario, id_salon_comunal, descripcion, hora_inicio, hora_fin, valor_hora, estado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE alquiler
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { id_propietario, id_salon_comunal, descripcion, hora_inicio, hora_fin, valor_hora, estado } = req.body;

    const [result] = await pool.query(
      'UPDATE alquiler SET id_propietario = ?, id_salon_comunal = ?, descripcion = ?, hora_inicio = ?, hora_fin = ?, valor_hora = ?, estado = ? WHERE id = ?',
      [id_propietario, id_salon_comunal, descripcion, hora_inicio, hora_fin, valor_hora, estado, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Alquiler no encontrado' });
    }

    res.json({ message: 'Alquiler actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE alquiler
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM alquiler WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Alquiler no encontrado' });
    }

    res.json({ message: 'Alquiler eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;