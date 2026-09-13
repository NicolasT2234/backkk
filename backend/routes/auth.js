const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const nodemailer = require('nodemailer');

// Configuración del transporte de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 1. POST /auth/solicitar-recuperacion
router.post('/solicitar-recuperacion', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Por favor ingresa un correo electrónico.' });
  }

  try {
    const [usuarios] = await pool.query(
      'SELECT id, email FROM usuario WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'No existe ninguna cuenta registrada con este correo.' });
    }

    const usuario = usuarios[0];

    // Token temporal con expiración de 30 minutos
    const tokenRecuperacion = jwt.sign(
      { id: usuario.id, email: usuario.email, proposito: 'recuperacion' },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const enlaceRecuperacion = `${baseUrl}/restablecer-password?token=${tokenRecuperacion}`;

    // Imprimir en consola de desarrollo por si no hay SMTP configurado
    console.log('----------------------------------------------------');
    console.log('ENLACE DE RECUPERACIÓN GENERADO:');
    console.log(enlaceRecuperacion);
    console.log('----------------------------------------------------');

    // Plantilla HTML con estilo SICRCB
    const mailOptions = {
      from: `"SICRCB Casa Blanca" <${process.env.EMAIL_USER || 'no-reply@sicrcb.com'}>`,
      to: usuario.email,
      subject: 'Restablecimiento de Contraseña - SICRCB Casa Blanca',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #fcf9f6; border-radius: 12px; overflow: hidden; border: 1px solid rgba(140,50,0,0.15);">
          <div style="background: linear-gradient(135deg, #8c3200 0%, #6e2600 100%); padding: 24px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0; font-size: 22px; color: #ffd0a0;">SICRCB CASA BLANCA</h2>
            <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Recuperación de Acceso al Sistema</p>
          </div>
          <div style="padding: 28px; color: #2c1203;">
            <p style="font-size: 16px; margin-top: 0;">Hola,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #594234;">
              Has solicitado restablecer tu contraseña para ingresar al sistema de convivencia y administración del <strong>Conjunto Residencial Casa Blanca</strong>.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${enlaceRecuperacion}" style="background-color: #f47820; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 25px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(244,120,32,0.3);">
                Restablecer mi Contraseña
              </a>
            </div>
            <p style="font-size: 12px; color: #8c7364; line-height: 1.5;">
              Este enlace es de un solo uso y vencerá en <strong>30 minutos</strong>. Si no realizaste esta solicitud, puedes ignorar este mensaje de forma segura.
            </p>
          </div>
          <div style="background-color: #f5ebe1; padding: 14px; text-align: center; font-size: 11px; color: #8c3200;">
            Conjunto Residencial Casa Blanca &bull; Sistema Integral de Gestión
          </div>
        </div>
      `
    };

    // Intentar enviar el correo
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail(mailOptions);
    }

    res.json({ message: 'Correo de recuperación enviado exitosamente.' });
  } catch (error) {
    console.error('Error al procesar recuperación:', error);
    res.status(500).json({ error: 'Error al enviar el correo de recuperación.' });
  }
});

// POST /auth/restablecer-password
router.post('/restablecer-password', async (req, res) => {
  const { token, nuevaPassword } = req.body;

  if (!token || !nuevaPassword) {
    return res.status(400).json({ error: 'Datos incompletos.' });
  }

  if (nuevaPassword.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    // 1. Verificar el token de recuperación
    const decodificado = jwt.verify(token, process.env.JWT_SECRET);

    if (decodificado.proposito !== 'recuperacion') {
      return res.status(400).json({ error: 'Token no autorizado para esta operación.' });
    }

    // 2. Actualizar contraseña (sin la columna inexistente)
    await pool.query(
      'UPDATE usuario SET contraseña = SHA2(?, 256) WHERE id = ?',
      [nuevaPassword, decodificado.id]
    );

    res.json({ message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'El enlace de recuperación ha expirado. Solicita uno nuevo.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ error: 'El enlace de recuperación es inválido.' });
    }
    return res.status(500).json({ error: 'Error al actualizar la contraseña en el servidor.' });
  }
});

// POST /login
router.post(
  '/login',
  [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false })
      .withMessage('Email válido requerido'),
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
        `SELECT 
           u.id, 
           u.email, 
           u.estado, 
           r.nombre as rol, 
           COALESCE(ud.primer_nombre, 'Administrador') as nombre, 
           COALESCE(ud.primer_apellido, '') as apellido
         FROM usuario u
         JOIN rol_usuario ru ON u.id = ru.id_user
         JOIN rol r ON ru.id_rol = r.id
         LEFT JOIN user_data ud ON u.id = ud.id_usuario
         WHERE u.email = ? AND u.contraseña = SHA2(?, 256)`,
        [email, contraseña]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const usuario = rows[0];

      // Verificación de cuenta inactiva
      if (usuario.estado !== 'Activo') {
        return res.status(403).json({
          error: 'Su cuenta se encuentra inactiva. Comuníquese con la administración del conjunto.'
        });
      }

      const token = jwt.sign(
        { id: usuario.id, rol: usuario.rol },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.cookie('sicrcb_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });

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

// ==========================================
// POST /recuperar-password
// Restablece la contraseña validando Email + Cédula
// ==========================================
router.post('/recuperar-password', async (req, res, next) => {
  const { email, numeroDocumento, nuevaContraseña } = req.body;

  if (!email || !numeroDocumento || !nuevaContraseña) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  if (nuevaContraseña.trim().length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    // 1. Validar que el correo coincida con el documento del usuario
    const [coincidencias] = await pool.query(
      `SELECT u.id 
       FROM usuario u
       INNER JOIN user_data ud ON u.id = ud.id_usuario
       WHERE u.email = ? AND ud.numero_documento = ? AND u.estado = 'Activo'`,
      [email.trim().toLowerCase(), numeroDocumento.toString().trim()]
    );

    if (coincidencias.length === 0) {
      return res.status(404).json({
        error: 'Los datos no coinciden con ningún residente activo registrado.'
      });
    }

    const idUsuario = coincidencias[0].id;

    await pool.query(
      'UPDATE usuario SET contraseña = SHA2(?, 256) WHERE id = ?',
      [nuevaPassword, decodificado.id]
    );

    res.json({ message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error('Error al recuperar contraseña:', error);
    next(error);
  }
});

// POST /logout
router.post('/logout', (req, res) => {
  res.clearCookie('sicrcb_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.json({ message: 'Sesión cerrada exitosamente' });
});

module.exports = router;