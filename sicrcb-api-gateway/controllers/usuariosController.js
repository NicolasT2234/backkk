// sicrcb-api-gateway/controllers/usuariosController.js
const UsuarioService = require('../../sicrcb-backend/services/UsuarioService');

// GET /api/usuarios/me
async function obtenerMiPerfil(req, res, next) {
    try {
        const idUsuario = req.usuario.id;
        const perfil = await UsuarioService.obtenerPerfil(idUsuario);
        return res.status(200).json(perfil);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

// PUT /api/usuarios/me
async function actualizarMiPerfil(req, res, next) {
    try {
        const idUsuario = req.usuario.id;
        const perfilActualizado = await UsuarioService.actualizarPerfil(idUsuario, req.body);
        return res.status(200).json(perfilActualizado);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

module.exports = { obtenerMiPerfil, actualizarMiPerfil };