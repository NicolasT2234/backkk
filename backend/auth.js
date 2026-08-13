const jwt = require('jsonwebtoken');
const pool = require('./db');

// Verify token middleware
const verificarToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
  }

  try {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    const verified = jwt.verify(cleanToken, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Token inválido.' });
  }
};

// Verify role middleware
const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Acceso denegado. No autenticado.' });
    }

    // Assuming user role is stored in req.user.rol or similar
    // Adjust based on your user data structure
    const userRole = req.user.rol || req.user.role;

    if (!rolesPermitidos.includes(userRole)) {
      return res.status(403).json({ error: 'Acceso denegado. Rol no autorizado.' });
    }

    next();
  };
};

module.exports = { verificarToken, verificarRol };