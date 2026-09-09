const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// GET /apartamentos (solo lectura pública o según necesiten)
router.get('/', verificarToken, async (req, res) => {
  try {
    const [apartamentos] = await pool.query(
      `SELECT a.id, a.numero, a.estado,
              b.nombre as bloque_nombre,
              i.numero as interior,
              ud.primer_nombre as nombre_propietario, ud.primer_apellido as apellido_propietario
       FROM apartamento a
       JOIN interior i ON a.id_interior = i.id
       JOIN bloque b ON i.id_bloque = b.id
       LEFT JOIN (
           SELECT pga.id_apartamento, pga.id_propietario
           FROM propietario_gestion_apartamento pga
           WHERE pga.estado = 'Activo'
           AND pga.fecha_registro = (
               SELECT MAX(pga2.fecha_registro)
               FROM propietario_gestion_apartamento pga2
               WHERE pga2.id_apartamento = pga.id_apartamento
               AND pga2.estado = 'Activo'
           )
       ) latest_pga ON latest_pga.id_apartamento = a.id
       LEFT JOIN propietario p ON latest_pga.id_propietario = p.id
       LEFT JOIN user_data ud ON p.id_user_data = ud.id
       ORDER BY b.nombre, a.numero`
    );
    res.json(apartamentos);
  } catch (error) {
    console.error('Error al obtener apartamentos:', error);
    next(error);
  }
});

// GET /apartamentos/:id
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [apartamentos] = await pool.query(
      `SELECT a.id, a.numero, a.estado,
              b.nombre as bloque_nombre,
              i.numero as interior,
              ud.primer_nombre as nombre_propietario, ud.primer_apellido as apellido_propietario
       FROM apartamento a
       JOIN interior i ON a.id_interior = i.id
       JOIN bloque b ON i.id_bloque = b.id
       LEFT JOIN (
           SELECT pga.id_apartamento, pga.id_propietario
           FROM propietario_gestion_apartamento pga
           WHERE pga.estado = 'Activo'
           AND pga.fecha_registro = (
               SELECT MAX(pga2.fecha_registro)
               FROM propietario_gestion_apartamento pga2
               WHERE pga2.id_apartamento = pga.id_apartamento
               AND pga2.estado = 'Activo'
           )
       ) latest_pga ON latest_pga.id_apartamento = a.id
       LEFT JOIN propietario p ON latest_pga.id_propietario = p.id
       LEFT JOIN user_data ud ON p.id_user_data = ud.id
       WHERE a.id = ?`,
      [id]
    );

    if (apartamentos.length === 0) {
      return res.status(404).json({ error: 'Apartamento no encontrado' });
    }

    res.json(apartamentos[0]);
  } catch (error) {
    console.error('Error al obtener apartamento:', error);
    next(error);
  }
});

// POST /apartamentos (solo administradores)
router.post('/',
  [
    body('numero').trim().notEmpty().withMessage('Número requerido'),
    body('estado').trim().notEmpty().withMessage('Estado requerido'),
    body('idInterior').isInt({ gt: 0 }).withMessage('ID de interior válido requerido')
  ],
  verificarToken, verificarRol('Administrador'), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { numero, estado, idInterior } = req.body;

    try {
      const [result] = await pool.query(
        'INSERT INTO apartamento (numero, estado, id_interior) VALUES (?, ?, ?)',
        [numero, estado, idInterior]
      );
      res.status(201).json({ message: 'Apartamento creado exitosamente', id: result.insertId });
    } catch (error) {
      console.error('Error al crear apartamento:', error);
      next(error);
    }
  }
);

// PUT /apartamentos/:id (solo administradores)
router.put('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { numero, estado, idInterior } = req.body;
  const { id } = req.params;

  if (!numero && !estado && idInterior === undefined) {
    return res.status(400).json({ error: 'Al menos un campo debe proporcionarse' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const updates = [];
    const values = [];

    if (numero !== undefined) {
      updates.push('numero = ?');
      values.push(numero);
    }
    if (estado !== undefined) {
      updates.push('estado = ?');
      values.push(estado);
    }
    if (idInterior !== undefined) {
      updates.push('id_interior = ?');
      values.push(idInterior);
    }

    if (updates.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    values.push(id);
    await connection.query(
      `UPDATE apartamento SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    await connection.commit();
    res.json({ message: 'Apartamento actualizado exitosamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar apartamento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

// DELETE /apartamentos/:id (solo administradores)
router.delete('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM apartamento WHERE id = ?', [id]);
    res.json({ message: 'Apartamento eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar apartamento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;