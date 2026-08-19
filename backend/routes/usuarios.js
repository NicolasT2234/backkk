const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');

const router = express.Router();

// GET /usuarios (solo administradores)
router.get('/', verificarToken, verificarRol('Administrador'), async (req, res) => {
  try {
    const [usuarios] = await pool.query(
      `SELECT u.id, u.email, r.nombre as rol,
              ud.primer_nombre as nombres,
              ud.primer_apellido as apellidos,
              ud.numero_documento as numeroDocumento,
              td.sigla as tipoDocumento,
              '' as celular
       FROM usuario u
       JOIN rol_usuario ru ON u.id = ru.id_user
       JOIN rol r ON ru.id_rol = r.id
       LEFT JOIN user_data ud ON u.id = ud.id_usuario
       LEFT JOIN tipo_documento td ON ud.id_tipo_documento = td.id
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
      `SELECT u.id, u.email, r.nombre as rol,
              ud.primer_nombre as nombres,
              ud.primer_apellido as apellidos,
              ud.numero_documento as numeroDocumento,
              td.sigla as tipoDocumento,
              '' as celular
       FROM usuario u
       JOIN rol_usuario ru ON u.id = ru.id_user
       JOIN rol r ON ru.id_rol = r.id
       LEFT JOIN user_data ud ON u.id = ud.id_usuario
       LEFT JOIN tipo_documento td ON ud.id_tipo_documento = td.id
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

// PUT /usuarios/:id (solo administrar)
router.put('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { email, nombre, apellido, tipoDocumento, numeroDocumento } = req.body;

    await connection.beginTransaction();

    // Actualizar usuario
    if (email !== undefined) {
      await connection.query(
        'UPDATE usuario SET email = ? WHERE id = ?',
        [email, id]
      );
    }

    // Actualizar user_data
    const updates = [];
    const values = [];

    if (nombre !== undefined) {
      updates.push('primer_nombre = ?');
      values.push(nombre);
    }
    if (apellido !== undefined) {
      updates.push('primer_apellido = ?');
      values.push(apellido);
    }
    if (numeroDocumento !== undefined) {
      updates.push('numero_documento = ?');
      values.push(numeroDocumento);
    }
    if (tipoDocumento !== undefined) {
      // Obtener id_tipo_documento desde nombre_documento
      const [tipoResult] = await connection.query(
        'SELECT id FROM tipo_documento WHERE nombre_documento = ?',
        [tipoDocumento]
      );
      if (tipoResult.length === 0) {
        throw new Error('Tipo de documento no encontrado');
      }
      values.push(tipoResult[0].id);
      updates.push('id_tipo_documento = ?');
    }

    if (updates.length > 0) {
      values.push(id); // for WHERE id_usuario = ?
      await connection.query(
        `UPDATE user_data SET ${updates.join(', ')} WHERE id_usuario = ?`,
        values
      );
    }

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
    await connection.query('DELETE FROM rol_usuario WHERE id_user = ?', [id]);
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
      `SELECT u.id, u.email, r.nombre as rol,
              ud.primer_nombre as nombres,
              ud.primer_apellido as apellidos,
              ud.numero_documento as numeroDocumento,
              td.sigla as tipoDocumento,
              '' as celular
       FROM usuario u
       JOIN rol_usuario ru ON u.id = ru.id_user
       JOIN rol r ON ru.id_rol = r.id
       LEFT JOIN user_data ud ON u.id = ud.id_usuario
       LEFT JOIN tipo_documento td ON ud.id_tipo_documento = td.id
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