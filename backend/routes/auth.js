const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarToken } = require('../auth');

// POST login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
    }

    // Query user by email
    const [rows] = await pool.query(
      'SELECT u.id, u.email, u.contraseña, u.estado, u.image_url, r.nombre as rol FROM usuarios u JOIN roles r ON u.id_rol = r.id WHERE u.email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Credenciales inválidas.' });
    }

    const user = rows[0];

    // Verify password using SHA2 (matching database implementation)
    const passwordHash = require('crypto').createHash('sha256').update(password).digest('hex');
    if (user.contraseña !== passwordHash) {
      return res.status(400).json({ error: 'Credenciales inválidas.' });
    }

    // Check if user is active
    if (user.estado !== 1) {
      return res.status(400).json({ error: 'Usuario inactivo.' });
    }

    // Generate JWT token
    const token = require('jsonwebtoken').sign(
      {
        id: user.id,
        email: user.email,
        rol: user.rol,
        image_url: user.image_url
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Return user info (without password) and token
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
        image_url: user.image_url
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST registro
router.post('/registro', async (req, res) => {
  try {
    const { email, password, nombre, apellido, telefono, direccion, id_rol, image_url } = req.body;

    // Basic validation
    if (!email || !password || !nombre || !apellido || !id_rol) {
      return res.status(400).json({ error: 'Email, contraseña, nombre, apellido y rol son requeridos.' });
    }

    // Check if email already exists
    const [emailExists] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (emailExists.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado.' });
    }

    // Hash password with SHA2
    const passwordHash = require('crypto').createHash('sha256').update(password).digest('hex');

    // Insert new user
    const [result] = await pool.query(
      'INSERT INTO usuarios (email, contraseña, nombre, apellido, telefono, direccion, id_rol, image_url, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [email, passwordHash, nombre, apellido, telefono || null, direccion || null, id_rol, image_url || null]
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente.',
      usuarioId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST logout
router.post('/logout', verificarToken, (req, res) => {
  // In a more sophisticated implementation, you might add the token to a blacklist
  // For now, we just return a success message since the client should discard the token
  res.json({ message: 'Sesión cerrada exitosamente.' });
});

module.exports = router;