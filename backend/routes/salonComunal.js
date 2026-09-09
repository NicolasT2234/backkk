const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// GET /salon-comunal (solo administradores para escritura, lectura pública o filtro)
router.get('/', verificarToken, async (req, res, next) => {
  try {
    const [salones] = await pool.query(
      'SELECT id, nombre, descripcion, capacidad, costo_hora FROM salon_comunal ORDER BY nombre'
    );
    res.json(salones);
  } catch (error) {
    console.error('Error al obtener salones comunales:', error);
    next(error);
  }
});

// GET /salon-comunal/:id
router.get('/:id', verificarToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const [salones] = await pool.query(
      'SELECT id, nombre, descripcion, capacidad, costo_hora FROM salon_comunal WHERE id = ?',
      [id]
    );

    if (salones.length === 0) {
      return res.status(404).json({ error: 'Salón comunal no encontrado' });
    }

    res.json(salones[0]);
  } catch (error) {
    console.error('Error al obtener salón comunal:', error);
    next(error);
  }
});

// POST /salon-comunal (solo administradores)
router.post('/', verificarToken, verificarRol('Administrador'), async (req, res, next) => {
  const { nombre, descripcion, capacidad, costoHora } = req.body;

  if (!nombre || !descripcion || !capacidad || !costoHora) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO salon_comunal (nombre, descripcion, capacidad, costo_hora) VALUES (?, ?, ?, ?)',
      [nombre, descripcion, capacidad, costoHora]
    );
    res.status(201).json({ message: 'Salón comunal creado exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error al crear salón comunal:', error);
    next(error);
  }
});

// PUT /salon-comunal/:id (solo administradores)
router.put('/:id',
  [
    body('nombre').optional().trim().notEmpty().withMessage('Nombre no puede estar vacío si se proporciona'),
    body('descripcion').optional().trim().notEmpty().withMessage('Descripción no puede estar vacío si se proporciona'),
    body('capacidad').optional().isInt({ gt: 0 }).withMessage('Capacidad debe ser un entero positivo si se proporciona'),
    body('costoHora').optional().isFloat({ gt: 0 }).withMessage('Costo hora debe ser un número positivo si se proporciona')
  ],
  verificarToken, verificarRol('Administrador'), async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, descripcion, capacidad, costoHora } = req.body;
    const { id } = req.params;

    // Check that at least one field is provided
    if (!nombre && !descripcion && !capacidad && costoHora === undefined) {
      return res.status(400).json({ error: 'Al menos un campo debe proporcionarse' });
    }

    // Trim string fields and parse numbers
    const nombreTrim = nombre !== undefined ? nombre.trim() : undefined;
    const descripcionTrim = descripcion !== undefined ? descripcion.trim() : undefined;
    const capacidadNum = capacidad !== undefined ? parseInt(capacidad, 10) : undefined;
    const costoHoraNum = costoHora !== undefined ? parseFloat(costoHora) : undefined;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const updates = [];
      const values = [];

      if (nombreTrim !== undefined) {
        updates.push('nombre = ?');
        values.push(nombreTrim);
      }
      if (descripcionTrim !== undefined) {
        updates.push('descripcion = ?');
        values.push(descripcionTrim);
      }
      if (capacidadNum !== undefined) {
        updates.push('capacidad = ?');
        values.push(capacidadNum);
      }
      if (costoHoraNum !== undefined) {
        updates.push('costo_hora = ?');
        values.push(costoHoraNum);
      }

      if (updates.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'No hay campos para actualizar' });
      }

      values.push(id);
      await connection.query(
        `UPDATE salon_comunal SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      await connection.commit();
      res.json({ message: 'Salón comunal actualizado exitosamente' );
    } catch (error) {
      await connection.rollback();
      console.error('Error al actualizar salón comunal:', error);
      next(error);
    } finally {
      connection.release();
    }
  }
);

// DELETE /salon-comunal/:id (solo administradores)
router.delete('/:id', verificarToken, verificarRol('Administrador'), async (req, res, next) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM salon_comunal WHERE id = ?', [id]);
    res.json({ message: 'Salón comunal eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar salón comunal:', error);
    next(error);
  }
});

module.exports = router;