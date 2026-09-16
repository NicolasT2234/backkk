// sicrcb-api-gateway/middlewares/auth.js
const jwt = require('jsonwebtoken');

// 1. Middleware para validar la sesión / JWT
function verificarToken(req, res, next) {
    // Busca el token en la cookie 'sicrcb_token' o en el encabezado Authorization
    const token = req.cookies?.sicrcb_token || req.headers['authorization']?.split(' ');

    if (!token) {
        return res.status(401).json({ 
            error: 'Acceso no autorizado', 
            mensaje: 'No se encontró una sesión activa.' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded; // Inyecta los datos del usuario en la petición
        next();
    } catch (error) {
        return res.status(401).json({ 
            error: 'Token inválido o expirado', 
            mensaje: 'Por favor, inicia sesión nuevamente.' 
        });
    }
}

// 2. Middleware para control de acceso por roles (RBAC)
function verificarRol(...rolesPermitidos) {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        const userRole = (req.usuario.rol || '').toLowerCase();
        const tienePermiso = rolesPermitidos.some(r => r.toLowerCase() === userRole);

        if (!tienePermiso) {
            return res.status(403).json({ 
                error: 'Acceso denegado', 
                mensaje: 'No tienes los permisos necesarios para realizar esta acción.' 
            });
        }

        next();
    };
}

module.exports = { verificarToken, verificarRol };