const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Debug middleware para registrar las peticiones entrantes
router.use((req, res, next) => {
  console.log(`[USUARIOS DEBUG] ${req.method} ${req.path}`);
  next();
});

// GET /usuarios (solo administradores)
router.get('/', verificarToken, verificarRol('Administrador'), async (req, res, next) => {
  try {
    const [usuarios] = await pool.query(
      `SELECT u.id, u.email, r.nombre as rol,
              ud.primer_nombre as nombres,
              ud.primer_nombre as nombre,
              ud.primer_apellido as apellidos,
              ud.primer_apellido as apellido,
              ud.numero_documento as numeroDocumento,
              td.nombre_documento as tipoDocumento
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
    next(error);
  }
});

// GET /usuarios/me (usuario autenticado obtiene sus propios datos)
// NOTA: Debe ir ANTES de "/:id" para evitar colisiones de rutas en Express
router.get('/me', verificarToken, async (req, res, next) => {
  try {
    const [usuarios] = await pool.query(
      `SELECT u.id, u.email, r.nombre as rol,
              ud.primer_nombre as nombres,
              ud.primer_nombre as nombre,
              ud.primer_apellido as apellidos,
              ud.primer_apellido as apellido,
              ud.numero_documento as numeroDocumento,
              td.nombre_documento as tipoDocumento
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

    res.json(usuarios[0]);
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    next(error);
  }
});

// PUT /usuarios/me (cualquier usuario autenticado edita su propio perfil)
router.put('/me',
  [
    body('nombres').optional().trim().notEmpty().withMessage('Nombre no puede estar vacío'),
    body('apellidos').optional().trim().notEmpty().withMessage('Apellido no puede estar vacío'),
    body('contraseña').optional().trim().isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
  ],
  verificarToken, async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const idUsuario = req.usuario.id;
    const { nombres, apellidos, contraseña } = req.body;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Actualizar contraseña en tabla usuario si fue proporcionada
      if (contraseña && contraseña.trim() !== '') {
        await connection.query(
          'UPDATE usuario SET contraseña = SHA2(?, 256) WHERE id = ?',
          [contraseña, idUsuario]
        );
      }

      // 2. Actualizar nombres y apellidos en user_data
      const userDataUpdates = [];
      const userDataValues = [];

      if (nombres) {
        userDataUpdates.push('primer_nombre = ?');
        userDataValues.push(nombres);
      }
      if (apellidos) {
        userDataUpdates.push('primer_apellido = ?');
        userDataValues.push(apellidos);
      }

      if (userDataUpdates.length > 0) {
        userDataValues.push(idUsuario);
        await connection.query(
          `UPDATE user_data SET ${userDataUpdates.join(', ')} WHERE id_usuario = ?`,
          userDataValues
        );
      }

      await connection.commit();

      // 3. Devolver perfil actualizado
      const [usuarios] = await pool.query(
        `SELECT u.id, u.email, r.nombre as rol,
                ud.primer_nombre as nombres,
                ud.primer_nombre as nombre,
                ud.primer_apellido as apellidos,
                ud.primer_apellido as apellido,
                ud.numero_documento as numeroDocumento,
                td.nombre_documento as tipoDocumento
         FROM usuario u
         JOIN rol_usuario ru ON u.id = ru.id_user
         JOIN rol r ON ru.id_rol = r.id
         LEFT JOIN user_data ud ON u.id = ud.id_usuario
         LEFT JOIN tipo_documento td ON ud.id_tipo_documento = td.id
         WHERE u.id = ?`,
        [idUsuario]
      );

      res.json(usuarios[0]);
    } catch (error) {
      await connection.rollback();
      console.error('Error al actualizar perfil propio:', error);
      next(error);
    } finally {
      connection.release();
    }
  }
);

// GET /usuarios/:id (solo administradores)
router.get('/:id', verificarToken, verificarRol('Administrador'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const [usuarios] = await pool.query(
      `SELECT u.id, u.email, r.nombre as rol,
              ud.primer_nombre as nombres,
              ud.primer_nombre as nombre,
              ud.primer_apellido as apellidos,
              ud.primer_apellido as apellido,
              ud.numero_documento as numeroDocumento,
              td.nombre_documento as tipoDocumento
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
    next(error);
  }
});

// PUT /usuarios/:id (solo administradores)
router.put('/:id',
  [
    body('email').optional().trim().isEmail().normalizeEmail().withMessage('Email válido'),
    body('nombre').optional().trim().notEmpty().withMessage('Nombre no puede estar vacío'),
    body('apellido').optional().trim().notEmpty().withMessage('Apellido no puede estar vacío'),
    body('tipoDocumento').optional().trim().notEmpty().withMessage('Tipo de documento no puede estar vacío'),
    body('numeroDocumento').optional().trim().notEmpty().withMessage('Número de documento no puede estar vacío')
  ],
  verificarToken, verificarRol('Administrador'), async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const connection = await pool.getConnection();
    try {
      const { id } = req.params;
      const { email, nombre, apellido, tipoDocumento, numeroDocumento } = req.body;

      await connection.beginTransaction();

      // Actualizar email en usuario
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
        values.push(id);
        await connection.query(
          `UPDATE user_data SET ${updates.join(', ')} WHERE id_usuario = ?`,
          values
        );
      }

      await connection.commit();
      res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (error) {
      await connection.rollback();
      if (error.message === 'Tipo de documento no encontrado' ||
          error.message === 'Usuario data no encontrada' ||
          error.message === 'Administrador no encontrado para este usuario') {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error al actualizar usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
      connection.release();
    }
  }
);

// DELETE /usuarios/:id (solo administradores)
router.delete('/:id', verificarToken, verificarRol('Administrador'), async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    await connection.beginTransaction();

    // Eliminar en orden respetando claves foráneas
    await connection.query('DELETE FROM propietario WHERE id_user_data = ?', [id]);
    await connection.query('DELETE FROM user_data WHERE id_usuario = ?', [id]);
    await connection.query('DELETE FROM rol_usuario WHERE id_user = ?', [id]);
    await connection.query('DELETE FROM usuario WHERE id = ?', [id]);

    await connection.commit();
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al eliminar usuario:', error);
    next(error);
  } finally {
    connection.release();
  }
});

module.exports = router;