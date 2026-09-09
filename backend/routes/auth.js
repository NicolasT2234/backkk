const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// POST /login
router.post('/login',
  [
    body('email').trim().isEmail().normalizeEmail().withMessage('Email válido requerido'),
    body('contraseña').trim().notEmpty().withMessage('Contraseña requerida')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, contraseña } = req.body;

    try {
      const [rows] = await pool.query(
        `SELECT u.id, u.email, r.nombre as rol, ud.primer_nombre as nombre, ud.primer_apellido as apellido
        FROM usuario u
        JOIN rol_usuario ru ON u.id = ru.id_user
        JOIN rol r ON ru.id_rol = r.id
        INNER JOIN user_data ud ON u.id = ud.id_usuario
        WHERE u.email = ? AND u.contraseña = SHA2(?, 256)`,
        [email, contraseña]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const usuario = rows[0];
      const token = jwt.sign(
        { id: usuario.id, rol: usuario.rol },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Set HTTP-only cookie
      res.cookie('sicrcb_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true in production
        sameSite: 'lax', // appropriate for same-site or subdomain usage
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      // Return user data without token
      res.json({
        user: {
          id: usuario.id,
          email: usuario.email,
          rol: usuario.rol,
          nombre: usuario.nombre,
          apellido: usuario.apellido
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      next(error);
    }
  }
);

// POST /registro
router.post('/registro',
  [
    body('email').trim().isEmail().normalizeEmail().withMessage('Email válido requerido'),
    body('contraseña').trim().isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
    body('apellido').trim().notEmpty().withMessage('Apellido requerido'),
    body('tipoDocumento').trim().notEmpty().withMessage('Tipo de documento requerido'),
    body('numeroDocumento').trim().notEmpty().withMessage('Número de documento requerido')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      email,
      contraseña,
      nombre,
      apellido,
      telefono,
      tipoDocumento,
      numeroDocumento
    } = req.body;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insertar usuario
      const [usuarioResult] = await connection.query(
        'INSERT INTO usuario (email, contraseña, estado) VALUES (?, SHA2(?, 256), ?)',
        [email, contraseña, 'Activo']
      );
      const idUsuario = usuarioResult.insertId;

      // Obtener id_tipo_documento desde tabla tipo_documento usando nombre_documento
      const [tipoResult] = await connection.query(
        'SELECT id FROM tipo_documento WHERE sigla = ?',
        [tipoDocumento]
      );
      if (tipoResult.length === 0) {
        throw new Error('Tipo de documento no encontrado');
      }
      const idTipoDocumento = tipoResult[0].id;

      // Insertar user_data
      const [userDataResult] = await connection.query(
        'INSERT INTO user_data (id_usuario, numero_documento, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, id_tipo_documento) VALUES (?, ?, ?, NULL, ?, NULL, ?)',
        [idUsuario, numeroDocumento, nombre, apellido, idTipoDocumento]
      );
      const idUserData = userDataResult.insertId;

      // Obtener rol de Propietario
      const [rolResult] = await connection.query(
        'SELECT id FROM rol WHERE nombre = ? LIMIT 1',
        ['Propietario']
      );

      if (rolResult.length === 0) {
        throw new Error('Rol Propietario no encontrado');
      }

      // Asignar rol al usuario
      await connection.query(
        'INSERT INTO rol_usuario (id_user, id_rol) VALUES (?, ?)',
        [idUsuario, rolResult[0].id]
      );

      // Insertar propietario (sin apartamento: el admin lo asigna después)
      await connection.query(
        'INSERT INTO propietario (id_user_data, estado) VALUES (?, ?)',
        [idUserData, 'Activo']
      );

      await connection.commit();
      res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
      await connection.rollback();
      // Handle specific known errors with appropriate status codes
      if (error.message === 'Tipo de documento no encontrado' ||
          error.message === 'Rol Propietario no encontrado' ||
          error.message === 'Usuario data no encontrada' ||
          error.message === 'Administrador no encontrado para este usuario') {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error en registro:', error);
      next(error);
    } finally {
      connection.release();
    }
  }
);

// POST /logout
router.post('/logout', (req, res) => {
  res.clearCookie('sicrcb_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.json({ message: 'Sesión cerrada' });
});

module.exports = router;