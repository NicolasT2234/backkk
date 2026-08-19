const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');

const router = express.Router();

// GET /usuarios (solo administradores)
router.get('/', verificarToken, verificarRol('Administrador'), async (req, res) => {
  try {
    const [usuarios] = await pool.query(
      `SELECT u.id, u.email, r.nombre as rol, ud.nombre, ud.apellido, ud.telefono, ud.direccion
       FROM usuario u
       JOIN rol_usuario ru ON u.id = ru.id_usuario
       JOIN rol r ON ru.id_rol = r.id
       LEFT JOIN user_data ud ON u.id = ud.id_usuario
       ORDER BY u.id`
    );
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /usuarios/:id (solo administradores)
router.get('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  try {
    const { id } = req.params;
    const [usuarios] = await pool.query(
      `SELECT u.id, u.email, r.nombre as rol, ud.nombre, ud.apellido, ud.telefono, ud.direccion
       FROM usuario u
       JOIN rol_usuario ru ON u.id = ru.id_usuario
       JOIN rol r ON ru.id_rol = r.id
       LEFT JOIN user_data ud ON u.id = ud.id_usuario
       WHERE u.id = ?`,
      [id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuarios[0]);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /usuarios/:id (solo administradores)
router.put('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { email, nombre, apellido, telefono, direccion } = req.body;

    await connection.beginTransaction();

    // Actualizar usuario
    await connection.query(
      'UPDATE usuario SET email = ? WHERE id = ?',
      [email, id]
    );

    // Actualizar user_data
    await connection.query(
      'UPDATE user_data SET nombre = ?, apellido = ?, telefono = ?, direccion = ? WHERE id_usuario = ?',
      [nombre, apellido, telefono || null, direccion || null, id]
    );

    await connection.commit();
    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

// DELETE /usuarios/:id (solo administradores)
router.delete('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    await connection.beginTransaction();

    // Eliminar en orden debido a claves foráneas
    await connection.query('DELETE FROM propietario WHERE id_user_data = ?', [id]);
    await connection.query('DELETE FROM user_data WHERE id_usuario = ?', [id]);
    await connection.query('DELETE FROM rol_usuario WHERE id_usuario = ?', [id]);
    await connection.query('DELETE FROM usuario WHERE id = ?', [id]);

    await connection.commit();
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

// GET /usuarios/me
router.get('/me', verificarToken, async (req, res) => {
  try {
    const [usuarios] = await pool.query(
      `SELECT u.id, u.email, r.nombre as rol, ud.nombre, ud.apellido, ud.telefono, ud.direccion
       FROM usuario u
       JOIN rol_usuario ru ON u.id = ru.id_usuario
       JOIN rol r ON ru.id_rol = r.id
       LEFT JOIN user_data ud ON u.id = ud.id_usuario
       WHERE u.id = ?`,
      [req.usuario.id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Excluir la contraseña (ya no se selecciona en la query)
    res.json(usuarios[0]);
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;