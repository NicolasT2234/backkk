const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');

const router = express.Router();

// GET /apartamentos (solo lectura pública o según necesiten)
router.get('/', verificarToken, async (req, res) => {
  try {
    const [apartamentos] = await pool.query(
      `SELECT a.id, a.numero, a.estado,
              b.nombre as bloque_nombre,
              i.descripcion as interior,
              ud.nombre as nombre_propietario, ud.apellido as apellido_propietario
       FROM apartamento a
       JOIN interior i ON a.id_interior = i.id
       JOIN bloque b ON i.id_bloque = b.id
       LEFT JOIN propietario p ON a.id = p.id_apartamento
       LEFT JOIN user_data ud ON p.id_user_data = ud.id_usuario
       ORDER BY b.nombre, a.numero`
    );
    res.json(apartamentos);
  } catch (error) {
    console.error('Error al obtener apartamentos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /apartamentos/:id
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [apartamentos] = await pool.query(
      `SELECT a.id, a.numero, a.estado,
              b.nombre as bloque_nombre,
              i.descripcion as interior,
              ud.nombre as nombre_propietario, ud.apellido as apellido_propietario
       FROM apartamento a
       JOIN interior i ON a.id_interior = i.id
       JOIN bloque b ON i.id_bloque = b.id
       LEFT JOIN propietario p ON a.id = p.id_apartamento
       LEFT JOIN user_data ud ON p.id_user_data = ud.id_usuario
       WHERE a.id = ?`,
      [id]
    );

    if (apartamentos.length === 0) {
      return res.status(404).json({ error: 'Apartamento no encontrado' });
    }

    res.json(apartamentos[0]);
  } catch (error) {
    console.error('Error al obtener apartamento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /apartamentos (solo administradores)
router.post('/', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { numero, estado, idInterior } = req.body;

  if (!numero || !estado || !idInterior) {
    return res.status(400).json({ error: 'Número, estado y idInterior requeridos' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO apartamento (numero, estado, id_interior) VALUES (?, ?, ?)',
      [numero, estado, idInterior]
    );
    res.status(201).json({ message: 'Apartamento creado exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error al crear apartamento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

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