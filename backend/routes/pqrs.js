const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// GET /pqrs (solo administradores)
router.get('/', verificarToken, verificarRol('Administrador'), async (req, res) => {
  try {
    const [pqrs] = await pool.query(
      `SELECT p.id, p.descripcion, p.fecha_creacion, p.estado, p.tipo,
              u.email as nombre_usuario, '' as apellido_usuario,
              b.nombre as bloque, ap.numero, i.numero as interior
       FROM pqr p
       JOIN usuario u ON p.id_usuario = u.id
       JOIN pqr_especifica pe ON p.id = pe.id_pqr
       JOIN apartamento ap ON pe.id_apartamento = ap.id
       JOIN bloque b ON ap.id_bloque = b.id
       JOIN interior i ON ap.id_interior = i.id
       ORDER BY p.fecha_creacion DESC`
    );
    res.json(pqrs);
  } catch (error) {
    console.error('Error al obtener PQRs:', error);
    next(error);
  }
});

// GET /pqrs/:id (solo administradores)
router.get('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  try {
    const { id } = req.params;
    const [pqrs] = await pool.query(
      `SELECT p.id, p.descripcion, p.fecha_creacion, p.estado, p.tipo,
              u.nombre as nombre_usuario, u.apellido as apellido_usuario,
              ap.bloque, ap.numero, i.descripcion as interior
       FROM pqr p
       JOIN usuario u ON p.id_usuario = u.id
       JOIN pqr_especifica pe ON p.id = pe.id_pqr
       JOIN apartamento ap ON pe.id_apartamento = ap.id
       JOIN bloque b ON ap.id_bloque = b.id
       JOIN interior i ON ap.id_interior = i.id
       WHERE p.id = ?`,
      [id]
    );

    if (pqrs.length === 0) {
      return res.status(404).json({ error: 'PQR no encontrada' });
    }

    res.json(pqrs[0]);
  } catch (error) {
    console.error('Error al obtener PQR:', error);
    next(error);
  }
});

// POST /pqrs (cualquier usuario autenticado puede crear su propia PQR)
router.post('/',
  [
    body('descripcion').trim().notEmpty().withMessage('Descripción requerida'),
    body('tipo').trim().notEmpty().withMessage('Tipo requerido'),
    body('idApartamento').isInt({ gt: 0 }).withMessage('ID de apartamento válido requerido')
  ],
  verificarToken, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { descripcion, tipo, idApartamento } = req.body;

  const idUsuario = req.usuario.id;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Verificar que el usuario autenticado es propietario del apartamento
    const [propietario] = await connection.query(
      'SELECT id FROM propietario WHERE id_user_data = (SELECT id FROM user_data WHERE id_usuario = ?) AND id_apartamento = ?',
      [idUsuario, idApartamento]
    );

    if (propietario.length === 0) {
      await connection.rollback();
      return res.status(403).json({ error: 'No tienes permiso para crear una PQR para este apartamento' });
    }

    // Insertar PQR
    const [pqrResult] = await connection.query(
      'INSERT INTO pqr (descripcion, fecha_creacion, estado, tipo, id_usuario) VALUES (?, NOW(), ?, ?, ?)',
      [descripcion, 'Pendiente', tipo, idUsuario]
    );
    const idPQR = pqrResult.insertId;

    // Insertar en pqr_especifica
    await connection.query(
      'INSERT INTO pqr_especifica (id_pqr, id_apartamento) VALUES (?, ?)',
      [idPQR, idApartamento]
    );

    await connection.commit();
    res.status(201).json({ message: 'PQR creada exitosamente', id: idPQR });
  } catch (error) {
    await connection.rollback();
    console.error('Error al crear PQR:', error);
    next(error);
  } finally {
    connection.release();
  }
});

// PUT /pqrs/:id (solo administradores)
router.put('/:id',
  [
    body('descripcion').optional().trim().notEmpty().withMessage('Descripción no puede estar vacía'),
    body('estado').optional().trim().notEmpty().withMessage('Estado no puede estar vacío'),
    body('tipo').optional().trim().notEmpty().withMessage('Tipo no puede estar vacío')
  ],
  verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { descripcion, estado, tipo } = req.body;
  const { id } = req.params;

  if (!descripcion && !estado && !tipo) {
    return res.status(400).json({ error: 'Al menos un campo debe proporcionarse' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const updates = [];
    const values = [];

    if (descripcion !== undefined) {
      updates.push('descripcion = ?');
      values.push(descripcion);
    }
    if (estado !== undefined) {
      updates.push('estado = ?');
      values.push(estado);
    }
    if (tipo !== undefined) {
      updates.push('tipo = ?');
      values.push(tipo);
    }

    if (updates.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    values.push(id);
    await connection.query(
      `UPDATE pqr SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    await connection.commit();
    res.json({ message: 'PQR actualizada exitosamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar PQR:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

// DELETE /pqrs/:id (solo administradores)
router.delete('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Eliminar de pqr_especifica primero (por clave foránea)
    await connection.query('DELETE FROM pqr_especifica WHERE id_pqr = ?', [id]);
    // Eliminar pqr
    await connection.query('DELETE FROM pqr WHERE id = ?', [id]);

    await connection.commit();
    res.json({ message: 'PQR eliminada exitosamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al eliminar PQR:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

// GET /mis-pqrs
router.get('/mis-pqrs', verificarToken, async (req, res) => {
  try {
    const idUsuario = req.usuario.id;

    const [pqrs] = await pool.query(
      `SELECT p.id, p.descripcion, p.fecha_creacion, p.estado, p.tipo,
              ap.bloque, ap.numero, i.descripcion as interior
       FROM pqr p
       JOIN usuario u ON p.id_usuario = u.id
       JOIN pqr_especifica pe ON p.id = pe.id_pqr
       JOIN apartamento ap ON pe.id_apartamento = ap.id
       JOIN bloque b ON ap.id_bloque = b.id
       JOIN interior i ON ap.id_interior = i.id
       WHERE u.id = ?
       ORDER BY p.fecha_creacion DESC`,
      [idUsuario]
    );

    res.json(pqrs);
  } catch (error) {
    console.error('Error al obtener mis PQRs:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;