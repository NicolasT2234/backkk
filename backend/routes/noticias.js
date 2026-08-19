const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');

const router = express.Router();

// Helper: map descripcion to titulo and contenido for frontend compatibility
const mapNoticia = (row) => ({
  id: row.id,
  titulo: row.descripcion, // frontend expects titulo
  contenido: row.descripcion, // frontend expects contenido
  fecha_publicacion: row.fecha_publicacion
});

// GET /noticias (solo administradores para escritura, lectura pública para destacados)
router.get('/', verificarToken, verificarRol('Administrador'), async (req, res) => {
  try {
    const [noticias] = await pool.query(
      'SELECT id, descripcion, fecha_publicacion FROM noticia ORDER BY fecha_publicacion DESC'
    );
    res.json(noticias.map(mapNoticia));
  } catch (error) {
    console.error('Error al obtener noticias:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /noticias/:id (solo administradores)
router.get('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  try {
    const { id } = req.params;
    const [noticias] = await pool.query(
      'SELECT id, descripcion, fecha_publicacion FROM noticia WHERE id = ?',
      [id]
    );

    if (noticias.length === 0) {
      return res.status(404).json({ error: 'Noticia no encontrada' });
    }

    res.json(mapNoticia(noticias[0]));
  } catch (error) {
    console.error('Error al obtener noticia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /noticias (solo administradores)
router.post('/', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { descripcion } = req.body;

  if (!descripcion) {
    return res.status(400).json({ error: 'Descripción requerida' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO noticia (descripcion, fecha_publicacion) VALUES (?, NOW())',
      [descripcion]
    );
    res.status(201).json({ message: 'Noticia creada exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error al crear noticia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /noticias/:id (solo administradores)
router.put('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { descripcion } = req.body;
  const { id } = req.params;

  if (!descripcion) {
    return res.status(400).json({ error: 'Descripción requerida' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      'UPDATE noticia SET descripcion = ?, fecha_publicacion = NOW() WHERE id = ?',
      [descripcion, id]
    );

    await connection.commit();
    res.json({ message: 'Noticia actualizada exitosamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar noticia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

// DELETE /noticias/:id (solo administradores)
router.delete('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM noticia WHERE id = ?', [id]);
    res.json({ message: 'Noticia eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar noticia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /noticias/destacadas (público, sin autenticación)
router.get('/destacadas', async (req, res) => {
  try {
    const [noticias] = await pool.query(
      'SELECT id, descripcion, fecha_publicacion FROM noticia ORDER BY fecha_publicacion DESC LIMIT 3'
    );
    res.json(noticias.map(mapNoticia));
  } catch (error) {
    console.error('Error al obtener noticias destacadas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;