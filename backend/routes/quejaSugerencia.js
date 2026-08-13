const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all quejas_sugerencias
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM queja_sugerencia');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET queja_sugerencia by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM queja_sugerencia WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Queja/sugerencia no encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE queja_sugerencia
router.post('/', async (req, res) => {
  try {
    const { id_propietario, id_administrador, descripcion_pqr, titulo_pqr, estado, fecha, evidencias } = req.body;

    const [result] = await pool.query(
      'INSERT INTO queja_sugerencia (id_propietario, id_administrador, descripcion_pqr, titulo_pqr, estado, fecha, evidencias) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id_propietario, id_administrador, descripcion_pqr, titulo_pqr, estado, fecha, evidencias]
    );

    res.status(201).json({ id: result.insertId, id_propietario, id_administrador, descripcion_pqr, titulo_pqr, estado, fecha, evidencias });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE queja_sugerencia
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { id_propietario, id_administrador, descripcion_pqr, titulo_pqr, estado, fecha, evidencias } = req.body;

    const [result] = await pool.query(
      'UPDATE queja_sugerencia SET id_propietario = ?, id_administrador = ?, descripcion_pqr = ?, titulo_pqr = ?, estado = ?, fecha = ?, evidencias = ? WHERE id = ?',
      [id_propietario, id_administrador, descripcion_pqr, titulo_pqr, estado, fecha, evidencias, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Queja/sugerencia no encontrada' });
    }

    res.json({ message: 'Queja/sugerencia actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE queja_sugerencia
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM queja_sugerencia WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Queja/sugerencia no encontrada' });
    }

    res.json({ message: 'Queja/sugerencia eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;