const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// GET /tipos_multa (Obtener todos los tipos de multa - Administrador y Residente)
router.get('/', verificarToken, async (req, res, next) => {
  try {
    const [tiposMulta] = await pool.query(
      `SELECT id, numero, descripcion, valor, estado
       FROM tipo_multa
       ORDER BY CAST(numero AS UNSIGNED) ASC, numero ASC`
    );
    res.json(tiposMulta);
  } catch (error) {
    console.error('Error al obtener tipos de multa:', error);
    next(error);
  }
});

// GET /tipos_multa/:id (Obtener un tipo de multa específico)
router.get('/:id', verificarToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const [tiposMulta] = await pool.query(
      `SELECT id, numero, descripcion, valor, estado
       FROM tipo_multa
       WHERE id = ?`,
      [id]
    );

    if (tiposMulta.length === 0) {
      return res.status(404).json({ error: 'Tipo de multa no encontrado' });
    }

    res.json(tiposMulta[0]);
  } catch (error) {
    console.error('Error al obtener tipo de multa:', error);
    next(error);
  }
});

// POST /tipos_multa (Crear un nuevo tipo de multa - Solo Administrador)
router.post(
  '/',
  [
    body('numero').trim().notEmpty().withMessage('El número o código de la infracción es obligatorio'),
    body('descripcion').trim().notEmpty().withMessage('La descripción reglamentaria es obligatoria'),
    body('valor').isFloat({ gt: 0 }).withMessage('El valor debe ser un número positivo'),
    body('estado')
      .optional()
      .isIn(['Activa', 'Inactiva'])
      .withMessage('El estado debe ser Activa o Inactiva')
  ],
  verificarToken,
  verificarRol('Administrador'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { numero, descripcion, valor, estado } = req.body;
    const numeroTrim = numero.trim();
    const descripcionTrim = descripcion.trim();
    const valorNum = parseFloat(valor);
    
    // Asignación estricta a 'Activa' o 'Inactiva'
    let estadoTrim = 'Activa';
    if (estado) {
      const e = estado.trim().toLowerCase();
      estadoTrim = (e === 'activa' || e === 'activo') ? 'Activa' : 'Inactiva';
    }

    try {
      const [result] = await pool.query(
        'INSERT INTO tipo_multa (numero, descripcion, valor, estado) VALUES (?, ?, ?, ?)',
        [numeroTrim, descripcionTrim, valorNum, estadoTrim]
      );
      res.status(201).json({
        message: 'Tipo de multa registrado exitosamente',
        id: result.insertId
      });
    } catch (error) {
      console.error('Error al crear tipo de multa:', error);
      next(error);
    }
  }
);

// PUT /tipos_multa/:id (Actualizar tipo de multa o solo su estado)
router.put(
  '/:id',
  [
    body('numero').optional().trim().notEmpty().withMessage('El número no puede estar vacío'),
    body('descripcion').optional().trim().notEmpty().withMessage('La descripción no puede estar vacía'),
    body('valor').optional().isFloat({ gt: 0 }).withMessage('El valor debe ser positivo'),
    body('estado')
      .optional()
      .isIn(['Activa', 'Inactiva'])
      .withMessage('El estado debe ser Activa o Inactiva')
  ],
  verificarToken,
  verificarRol('Administrador'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { numero, descripcion, valor, estado } = req.body;

    if (!numero && !descripcion && valor === undefined && !estado) {
      return res.status(400).json({ error: 'Debe proporcionar al menos un campo para actualizar' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const updates = [];
      const values = [];

      if (numero !== undefined) {
        updates.push('numero = ?');
        values.push(numero.trim());
      }
      if (descripcion !== undefined) {
        updates.push('descripcion = ?');
        values.push(descripcion.trim());
      }
      if (valor !== undefined) {
        updates.push('valor = ?');
        values.push(parseFloat(valor));
      }
      if (estado !== undefined) {
        const e = estado.trim().toLowerCase();
        const estadoFinal = (e === 'activa' || e === 'activo') ? 'Activa' : 'Inactiva';
        updates.push('estado = ?');
        values.push(estadoFinal);
      }

      values.push(id);
      await connection.query(
        `UPDATE tipo_multa SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      await connection.commit();
      res.json({ message: 'Tipo de multa actualizado correctamente' });
    } catch (error) {
      await connection.rollback();
      console.error('Error al actualizar tipo de multa:', error);
      res.status(500).json({ error: 'Error en el servidor al actualizar el tipo de multa' });
    } finally {
      connection.release();
    }
  }
);

// DELETE /tipos_multa/:id (Eliminar tipo de multa - Solo Administrador)
router.delete('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { id } = req.params;
  try {
    const [multasAsociadas] = await pool.query(
      'SELECT id FROM multa WHERE id_tipo_multa = ? LIMIT 1',
      [id]
    );

    if (multasAsociadas.length > 0) {
      return res.status(400).json({
        error: 'No es posible eliminar este tipo de multa porque cuenta con sanciones asociadas en el historial. Puedes marcarla como Inactiva.'
      });
    }

    await pool.query('DELETE FROM tipo_multa WHERE id = ?', [id]);
    res.json({ message: 'Tipo de multa eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar tipo de multa:', error);
    res.status(500).json({ error: 'Error interno del servidor al eliminar el tipo de multa' });
  }
});

module.exports = router;