const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all noticias
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM noticia');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET noticia by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM noticia WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Noticia no encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE noticia
router.post('/', async (req, res) => {
  try {
    const { descripcion, estado, fecha_publicacion, id_administrador } = req.body;

    const [result] = await pool.query(
      'INSERT INTO noticia (descripcion, estado, fecha_publicacion, id_administrador) VALUES (?, ?, ?, ?)',
      [descripcion, estado, fecha_publicacion, id_administrador]
    );

    res.status(201).json({ id: result.insertId, descripcion, estado, fecha_publicacion, id_administrador });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE noticia
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, estado, fecha_publicacion, id_administrador } = req.body;

    const [result] = await pool.query(
      'UPDATE noticia SET descripcion = ?, estado = ?, fecha_publicacion = ?, id_administrador = ? WHERE id = ?',
      [descripcion, estado, fecha_publicacion, id_administrador, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Noticia no encontrada' });
    }

    res.json({ message: 'Noticia actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE noticia
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM noticia WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Noticia no encontrada' });
    }

    res.json({ message: 'Noticia eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;