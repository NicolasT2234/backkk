// sicrcb-api-gateway/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// 1. IMPORTAR EL ARCHIVO DE RUTAS:
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const multasRoutes = require('./routes/multasRoutes');
const pqrsRoutes = require('./routes/pqrsRoutes');
const alquileresRoutes = require('./routes/alquileresRoutes');
const noticiasRoutes = require('./routes/noticiasRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminUsuariosRoutes = require('./routes/adminUsuariosRoutes');
const apartamentosRoutes = require('./routes/apartamentosRoutes');
const tiposMultaRoutes = require('./routes/tiposMultaRoutes');
const reportesRoutes = require('./routes/reportesRoutes');

// Middleware para logging de intentos fallidos de login
const failedLoginLogger = (req, res, next) => {
  // Guardar el método original de res.end
  const originalEnd = res.end;

  // Sobrescribir res.end para capturar la respuesta
  res.end = function(chunk, encoding) {
    // Restablecer el método original
    res.end = originalEnd;

    // Solo logging para rutas de auth/login con respuesta de error (4xx o 5xx)
    if (req.path.includes('/api/auth/login') &&
        (res.statusCode >= 400 && res.statusCode < 600)) {
      const ip = req.headers['x-forwarded-for'] ||
                 req.connection.remoteAddress ||
                 req.socket.remoteAddress ||
                 (req.connection.socket ? req.connection.socket.remoteAddress : null);
      const userAgent = req.headers['user-agent'] || 'unknown';
      const email = req.body?.email || 'unknown';

      console.log(`[SECURITY] Failed login attempt - IP: ${ip}, Email: ${email}, User-Agent: ${userAgent}, Status: ${res.statusCode}, Timestamp: ${new Date().toISOString()}`);
    }

    // Llamar al método original
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

const app = express();

// Seguridad: Headers HTTP seguros con Helmet
app.use(helmet({
  // Configurar políticas de seguridad específicas
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  // Otras configuraciones de helmet
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 año en segundos
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
}));

// Rate limiting general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana por IP
  standardHeaders: true, // devolver información de rate limit en headers `RateLimit-*`
  legacyHeaders: false, // deshabilitar headers `X-RateLimit-*`
  message: {
    error: 'Demasiadas solicitudes desde esta IP, por favor intente nuevamente después de 15 minutos'
  }
});

// Rate limiting más estricto para endpoints de autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // límite de 10 intentos de login por ventana por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos de inicio de sesión, por favor intente nuevamente después de 15 minutos'
  }
});

// Rate limiting para endpoints sensibles de usuarios
const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // límite de 50 requests por ventana por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes de usuario, por favor intente nuevamente después de 15 minutos'
  }
});

// Configuración CORS actualizada para soportar múltiples puertos de desarrollo
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5174'
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin origen (como las de Postman o aplicaciones móviles)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Aplicar middlewares de seguridad
app.use(generalLimiter); // Rate limiting general para todos los endpoints
app.use('/api/auth', authLimiter); // Rate limiting más estricto para auth
app.use('/api/usuarios', userLimiter); // Rate limiting para endpoints de usuarios
app.use(failedLoginLogger); // Middleware para logging de intentos fallidos

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 2. CONECTAR LAS RUTAS CON EL PREFIJO '/api/auth':
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/multas', multasRoutes);
app.use('/api/pqrs', pqrsRoutes);
app.use('/api/alquileres', alquileresRoutes);
app.use('/api/noticias', noticiasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin/usuarios', adminUsuariosRoutes);
app.use('/api/apartamentos', apartamentosRoutes);
app.use('/api/tipos_multa', tiposMultaRoutes);
app.use('/api/reportes', reportesRoutes);

// Puerto y arranque
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});