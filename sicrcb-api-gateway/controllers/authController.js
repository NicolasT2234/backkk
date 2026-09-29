// sicrcb-api-gateway/controllers/authController.js
const jwt = require('jsonwebtoken');
const AuthService = require('../../sicrcb-backend/services/AuthService');

// Almacenamiento en memoria para intentos fallidos (en producción debería usar Redis o base de datos)
const failedLoginAttempts = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_ATTEMPTS = 5; // Máximo 5 intentos antes de bloqueo temporal

// Función para limpiar intentos antiguos
const cleanOldAttempts = () => {
  const now = Date.now();
  for (const [key, value] of failedLoginAttempts.entries()) {
    if (now - value.firstAttempt > WINDOW_MS) {
      failedLoginAttempts.delete(key);
    }
  }
};

// Limpiar cada minuto
setInterval(cleanOldAttempts, 60 * 1000);

// 1. Login
async function login(req, res, next) {
  try {
    const { email, contraseña } = req.body;

    // Validar entrada básica
    if (!email || !contraseña) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Normalizar email para evitar ataques de timing
    const normalizedEmail = email.trim().toLowerCase();

    // Crear clave para tracking de intentos fallidos
    const ip = req.headers['x-forwarded-for'] ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : 'unknown');
    const key = `${ip}:${normalizedEmail}`;

    // Limpiar intentos antiguos
    cleanOldAttempts();

    // Verificar si hay demasiados intentos fallidos
    const attemptData = failedLoginAttempts.get(key);
    if (attemptData && attemptData.count >= MAX_ATTEMPTS) {
      const timeLeft = Math.ceil((WINDOW_MS - (Date.now() - attemptData.firstAttempt)) / 60000);
      return res.status(429).json({
        error: `Demasiados intentos fallidos. Intente nuevamente en ${timeLeft} minutos.`
      });
    }

    // Intentar autenticación
    const usuario = await AuthService.autenticar(normalizedEmail, contraseña);

    // Resetear contador de intentos fallidos en caso de éxito
    if (failedLoginAttempts.has(key)) {
      failedLoginAttempts.delete(key);
    }

    // Generar token JWT con expiración más segura (2 horas en lugar de 24)
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '2h' } // Reducido de 24h a 2h para mejor seguridad
    );

    // Configurar cookie más segura
    res.cookie('sicrcb_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      sameSite: 'strict', // Más seguro que 'lax'
      maxAge: 2 * 60 * 60 * 1000, // 2 horas
      path: '/' // Disponible en todo el dominio
    });

    return res.status(200).json({
      user: {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        nombre: usuario.nombre,
        apellido: usuario.apellido
      }
    });
  } catch (error) {
    // Manejo seguro de errores - no filtrar información sensible
    let statusCode = error.statusCode || 500;
    let message = error.message;

    // Normalizar mensajes de error para evitar enumeration attacks
    if (message.includes('email') || message.includes('contraseña') ||
        message.includes('usuario') || message.includes('auth')) {
      message = 'Credenciales inválidas';
    }

    // Incrementar contador de intentos fallidos
    const email = req.body?.email?.trim().toLowerCase() || 'unknown';
    const ip = req.headers['x-forwarded-for'] ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : 'unknown');
    const key = `${ip}:${email}`;

    if (!failedLoginAttempts.has(key)) {
      failedLoginAttempts.set(key, { count: 1, firstAttempt: Date.now() });
    } else {
      const data = failedLoginAttempts.get(key);
      failedLoginAttempts.set(key, {
        count: data.count + 1,
        firstAttempt: data.firstAttempt
      });
    }

    // Log de seguridad para intentos fallidos
    console.log(`[SECURITY] Failed login attempt - IP: ${ip}, Email: ${email}, Reason: ${error.message}, Timestamp: ${new Date().toISOString()}`);

    return res.status(statusCode).json({ error: message });
  }
}

// 2. Solicitar Recuperación
async function solicitarRecuperacion(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'El email es requerido' });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const respuesta = await AuthService.solicitarRecuperacion(email.trim(), baseUrl);
    return res.status(200).json(respuesta);
  } catch (error) {
    // No filtrar información sensible aquí tampoco para evitar enumeration
    return res.status(error.statusCode || 500).json({
      error: 'Error al procesar la solicitud de recuperación'
    });
  }
}

// 3. Restablecer Contraseña
async function restablecerPassword(req, res, next) {
  try {
    const { token, nuevaPassword } = req.body;

    if (!token || !nuevaPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
    }

    if (nuevaPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const respuesta = await AuthService.restablecerPassword(token, nuevaPassword);
    return res.status(200).json(respuesta);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'El enlace de recuperación ha expirado. Solicita uno nuevo.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ error: 'El enlace de recuperación es inválido.' });
    }
    return res.status(error.statusCode || 500).json({ error: 'Error al restablecer la contraseña' });
  }
}

// 4. Logout
function logout(req, res) {
  res.clearCookie('sicrcb_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  return res.status(200).json({ message: 'Sesión cerrada exitosamente' });
}

module.exports = { login, solicitarRecuperacion, restablecerPassword, logout };