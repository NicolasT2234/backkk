const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all apartamentos
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM apartamento');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET apartamento by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM apartamento WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Apartamento no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE apartamento
router.post('/', async (req, res) => {
  try {
    const { estado, numero, id_interior } = req.body;

    const [result] = await pool.query(
      'INSERT INTO apartamento (estado, numero, id_interior) VALUES (?, ?, ?)',
      [estado, numero, id_interior]
    );

    res.status(201).json({ id: result.insertId, estado, numero, id_interior });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE apartamento
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, numero, id_interior } = req.body;

    const [result] = await pool.query(
      'UPDATE apartamento SET estado = ?, numero = ?, id_interior = ? WHERE id = ?',
      [estado, numero, id_interior, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Apartamento no encontrado' });
    }

    res.json({ message: 'Apartamento actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE apartamento
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM apartamento WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Apartamento no encontrado' });
    }

    res.json({ message: 'Apartamento eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;