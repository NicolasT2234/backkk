const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/noticias')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Helper: map descripcion to titulo and contenido for frontend compatibility
const mapNoticia = (row) => ({
  id: row.id,
  titulo: row.descripcion,
  contenido: row.descripcion,
  fecha_publicacion: row.fecha_publicacion,
  archivo_url: row.archivo_url
});

// GET /noticias (solo administradores)
router.get('/', verificarToken, verificarRol('Administrador'), async (req, res, next) => {
  try {
    const [noticias] = await pool.query(
      'SELECT id, descripcion, fecha_publicacion, archivo_url FROM noticia ORDER BY id DESC'
    );
    res.json(noticias.map(mapNoticia));
  } catch (error) {
    console.error('Error al obtener noticias:', error);
    next(error);
  }
});

// GET /noticias/destacadas (público)
router.get('/destacadas', async (req, res, next) => {
  try {
    const [noticias] = await pool.query(
      'SELECT id, descripcion, fecha_publicacion, archivo_url FROM noticia ORDER BY id DESC LIMIT 3'
    );
    res.json(noticias.map(mapNoticia));
  } catch (error) {
    console.error('Error al obtener noticias destacadas:', error);
    next(error);
  }
});

// GET /noticias/:id (solo administradores)
router.get('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  try {
    const { id } = req.params;
    const [noticias] = await pool.query(
      'SELECT id, descripcion, fecha_publicacion, archivo_url FROM noticia WHERE id = ?',
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

// POST /noticias (Crear noticia - Solución de hora exacta)
router.post('/', verificarToken, verificarRol('Administrador'), upload.single('archivo'), async (req, res) => {
  const { descripcion, fechaPublicacion } = req.body;

  if (!descripcion) {
    return res.status(400).json({ error: 'Descripción requerida' });
  }

  // Si fechaPublicacion viene sin hora (formato YYYY-MM-DD de input type="date"),
  // se usa la hora y segundo actual exacto en lugar de medianoche 00:00:00
  let fechaPublicacionParsed = new Date();
  if (fechaPublicacion && fechaPublicacion.includes('T') && fechaPublicacion.length > 10) {
    fechaPublicacionParsed = new Date(fechaPublicacion);
  }

  const archivoUrl = req.file ? `/uploads/noticias/${req.file.filename}` : null;

  try {
    const [result] = await pool.query(
      'INSERT INTO noticia (descripcion, fecha_publicacion, archivo_url, estado, id_administrador) VALUES (?, ?, ?, ?, ?)',
      [descripcion, fechaPublicacionParsed, archivoUrl, 'Activa', req.usuario.id]
    );
    res.status(201).json({ message: 'Noticia creada exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error al crear noticia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /noticias/:id
router.put('/:id', verificarToken, verificarRol('Administrador'), upload.single('archivo'), async (req, res) => {
  const { descripcion, fechaPublicacion } = req.body;
  const { id } = req.params;

  if (!descripcion) {
    return res.status(400).json({ error: 'Descripción requerida' });
  }

  let fechaPublicacionParsed = new Date();
  if (fechaPublicacion && fechaPublicacion.includes('T') && fechaPublicacion.length > 10) {
    fechaPublicacionParsed = new Date(fechaPublicacion);
  }

  const archivoUrl = req.file ? `/uploads/noticias/${req.file.filename}` : null;

  try {
    if (archivoUrl) {
      await pool.query(
        'UPDATE noticia SET descripcion = ?, fecha_publicacion = ?, archivo_url = ? WHERE id = ?',
        [descripcion, fechaPublicacionParsed, archivoUrl, id]
      );
    } else {
      await pool.query(
        'UPDATE noticia SET descripcion = ?, fecha_publicacion = ? WHERE id = ?',
        [descripcion, fechaPublicacionParsed, id]
      );
    }
    res.json({ message: 'Noticia actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar noticia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /noticias/:id
router.delete('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM noticia WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Noticia no encontrada' });
    }
    res.json({ message: 'Noticia eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar noticia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;