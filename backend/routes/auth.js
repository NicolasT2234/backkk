const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');

const router = express.Router();

// POST /login
router.post('/login', async (req, res) => {
  const { email, contraseña } = req.body;

  if (!email || !contraseña) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.email, r.nombre as rol, ud.nombre, ud.apellido
       FROM usuario u
       JOIN rol_usuario ru ON u.id = ru.id_usuario
       JOIN rol r ON ru.id_rol = r.id
       LEFT JOIN user_data ud ON u.id = ud.id_usuario
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

    res.json({
      token,
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
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /registro
router.post('/registro', async (req, res) => {
  const {
    email,
    contraseña,
    nombre,
    apellido,
    telefono,
    direccion
  } = req.body;

  if (!email || !contraseña || !nombre || !apellido) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Insertar usuario
    const [usuarioResult] = await connection.query(
      'INSERT INTO usuario (email, contraseña) VALUES (?, SHA2(?, 256))',
      [email, contraseña]
    );
    const idUsuario = usuarioResult.insertId;

    // Insertar user_data
    await connection.query(
      'INSERT INTO user_data (id_usuario, nombre, apellido, telefono, direccion) VALUES (?, ?, ?, ?, ?)',
      [idUsuario, nombre, apellido, telefono || null, direccion || null]
    );

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
      'INSERT INTO rol_usuario (id_usuario, id_rol) VALUES (?, ?)',
      [idUsuario, rolResult[0].id]
    );

    // Insertar propietario (asumiendo que hay apartamento disponible)
    // Primero obtener un apartamento disponible (por simplicidad, el primero)
    const [apartamento] = await connection.query(
      'SELECT id FROM apartamento LIMIT 1'
    );

    if (apartamento.length > 0) {
      await connection.query(
        'INSERT INTO propietario (id_user_data, id_apartamento) VALUES (?, ?)',
        [idUsuario, apartamento[0].id]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  } finally {
    connection.release();
  }
});

// POST /logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Sesión cerrada' });
});

module.exports = router;