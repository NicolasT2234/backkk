const express = require('express');
const pool = require('../db');
const { verificarToken } = require('../middlewares/auth'); 
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Debug middleware para registrar las peticiones entrantes
router.use((req, res, next) => {
  console.log(`[USUARIOS DEBUG] ${req.method} ${req.path}`);
  next();
});


// GET /usuarios/me (usuario autenticado obtiene sus propios datos)
// NOTA: Debe ir ANTES de "/:id" para evitar colisiones de rutas en Express
router.get('/me', verificarToken, async (req, res, next) => {
  try {
    const [usuarios] = await pool.query(
      `SELECT u.id, u.email, r.nombre as rol,
              COALESCE(ud.primer_nombre, '') as nombres,
              COALESCE(ud.primer_nombre, '') as nombre,
              COALESCE(ud.primer_apellido, '') as apellidos,
              COALESCE(ud.primer_apellido, '') as apellido,
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
    body('nombres')
      .optional()
      .trim()
      .notEmpty().withMessage('Nombre no puede estar vacío')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/).withMessage('El nombre solo debe contener letras y espacios'),
    body('apellidos')
      .optional()
      .trim()
      .notEmpty().withMessage('Apellido no puede estar vacío')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/).withMessage('El apellido solo debe contener letras y espacios'),
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

      // 2. Actualizar o insertar nombres y apellidos en user_data (UPSERT para garantizar soporte a Administradores)
      const [existingUserData] = await connection.query(
        'SELECT id FROM user_data WHERE id_usuario = ?',
        [idUsuario]
      );

      if (existingUserData.length > 0) {
        const userDataUpdates = [];
        const userDataValues = [];

        if (nombres) {
          userDataUpdates.push('primer_nombre = ?');
          userDataValues.push(nombres.trim());
        }
        if (apellidos) {
          userDataUpdates.push('primer_apellido = ?');
          userDataValues.push(apellidos.trim());
        }

        if (userDataUpdates.length > 0) {
          userDataValues.push(idUsuario);
          await connection.query(
            `UPDATE user_data SET ${userDataUpdates.join(', ')} WHERE id_usuario = ?`,
            userDataValues
          );
        }
      } else {
        // Si no existía registro en user_data (caso de cuenta Administrador inicial), se inserta automáticamente
        const [tipoDocRows] = await connection.query(
          "SELECT id FROM tipo_documento WHERE estado = 'Activo' LIMIT 1"
        );
        const idTipoDoc = tipoDocRows.length > 0 ? tipoDocRows[0].id : 1;
        await connection.query(
          `INSERT INTO user_data (numero_documento, primer_nombre, primer_apellido, id_usuario, id_tipo_documento)
           VALUES (?, ?, ?, ?, ?)`,
          [0, (nombres || 'Admin').trim(), (apellidos || 'Principal').trim(), idUsuario, idTipoDoc]
        );
      }

      await connection.commit();

      // 3. Devolver perfil actualizado
      const [usuarios] = await pool.query(
        `SELECT u.id, u.email, r.nombre as rol,
                COALESCE(ud.primer_nombre, '') as nombres,
                COALESCE(ud.primer_nombre, '') as nombre,
                COALESCE(ud.primer_apellido, '') as apellidos,
                COALESCE(ud.primer_apellido, '') as apellido,
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

module.exports = router;