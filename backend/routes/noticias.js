const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Add debug middleware to see what's happening
router.use((req, res, next) => {
  console.log(`[DEBUG] Noticias route: ${req.method} ${req.path}`);
  next();
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/noticias')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Helper: map descripcion to titulo and contenido for frontend compatibility
const mapNoticia = (row) => ({
  id: row.id,
  titulo: row.descripcion, // frontend expects titulo
  contenido: row.descripcion, // frontend expects contenido
  fecha_publicacion: row.fecha_publicacion,
  archivo_url: row.archivo_url
});

// GET /noticias (solo administradores para escritura, lectura pública para destacados)
router.get('/', verificarToken, verificarRol('Administrador'), async (req, res) => {
  console.log('[DEBUG] GET /noticias');
  try {
    const [noticias] = await pool.query(
      'SELECT id, descripcion, fecha_publicacion, archivo_url FROM noticia ORDER BY fecha_publicacion DESC'
    );
    console.log(`[DEBUG] GET /noticias - Found ${noticias.length} noticias`);
    res.json(noticias.map(mapNoticia));
  } catch (error) {
    console.error('Error al obtener noticias:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /noticias/destacadas (público, sin autenticación)
router.get('/destacadas', async (req, res) => {
  console.log('[DEBUG] GET /noticias/destacadas - PUBLIC ENDPOINT');
  try {
    console.log('[DEBUG] About to execute query for destacados');
    const [noticias] = await pool.query(
      'SELECT id, descripcion, fecha_publicacion, archivo_url FROM noticia ORDER BY fecha_publicacion DESC LIMIT 3'
    );
    console.log(`[DEBUG] Query executed, found ${noticias.length} noticias`);
    if (noticias.length > 0) {
      console.log('[DEBUG] First noticia:', noticias[0]);
    }
    res.json(noticias.map(mapNoticia));
  } catch (error) {
    console.error('Error al obtener noticias destacadas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /noticias/:id (solo administradores)
router.get('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  console.log(`[DEBUG] GET /noticias/${req.params.id}`);
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

// POST /noticias (solo administradores)
router.post('/', verificarToken, verificarRol('Administrador'), upload.single('archivo'), async (req, res) => {
  console.log('[DEBUG] POST /noticias');
  const { descripcion, fechaPublicacion } = req.body;

  if (!descripcion) {
    return res.status(400).json({ error: 'Descripción requerida' });
  }

  let fechaPublicacionParsed;
  if (fechaPublicacion) {
    // Convertir la fecha del formato datetime-local (YYYY-MM-DDTHH:MM) a un objeto Date
    fechaPublicacionParsed = new Date(fechaPublicacion);
  } else {
    fechaPublicacionParsed = new Date();
  }

  // Construir la URL del archivo si se subió uno
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

// PUT /noticias/:id (solo administradores)
router.put('/:id', verificarToken, verificarRol('Administrador'), upload.single('archivo'), async (req, res) => {
  console.log(`[DEBUG] PUT /noticias/${req.params.id}`);
  const { descripcion, fechaPublicacion } = req.body;
  const { id } = req.params;

  if (!descripcion) {
    return res.status(400).json({ error: 'Descripción requerida' });
  }

  let fechaPublicacionParsed;
  if (fechaPublicacion) {
    // Convertir la fecha del formato datetime-local (YYYY-MM-DDTHH:MM) a un objeto Date
    fechaPublicacionParsed = new Date(fechaPublicacion);
  } else {
    fechaPublicacionParsed = new Date();
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Primero obtener la noticia actual para mantener el archivo_url si no se sube uno nuevo
    const [currentNews] = await connection.query(
      'SELECT archivo_url FROM noticia WHERE id = ?',
      [id]
    );

    let archivoUrl = null;
    if (req.file) {
      // Se subió un nuevo archivo
      archivoUrl = `/uploads/noticias/${req.file.filename}`;
    } else if (currentNews.length > 0) {
      // Mantener el archivo existente
      archivoUrl = currentNews[0].archivo_url;
    }

    await connection.query(
      'UPDATE noticia SET descripcion = ?, fecha_publicacion = ?, archivo_url = ?, estado = ? WHERE id = ?',
      [descripcion, fechaPublicacionParsed, archivoUrl, 'Activa', id]
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
  console.log(`[DEBUG] DELETE /noticias/${req.params.id}`);
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM noticia WHERE id = ?', [id]);
    res.json({ message: 'Noticia eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar noticia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;