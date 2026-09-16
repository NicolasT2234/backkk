// sicrcb-backend/services/UsuarioService.js
const UsuarioModel = require('../models/UsuarioModel');

class UsuarioService {
    static async obtenerPerfil(idUsuario) {
        if (!idUsuario) {
            const error = new Error('ID de usuario no proporcionado');
            error.statusCode = 400;
            throw error;
        }

        const perfil = await UsuarioModel.obtenerPerfilCompleto(idUsuario);
        if (!perfil) {
            const error = new Error('Usuario no encontrado');
            error.statusCode = 404;
            throw error;
        }

        return perfil;
    }

    static async actualizarPerfil(idUsuario, datos) {
        if (!idUsuario) {
            const error = new Error('ID de usuario no proporcionado');
            error.statusCode = 400;
            throw error;
        }

        return await UsuarioModel.actualizarPerfilPropio(idUsuario, datos);
    }
}

module.exports = UsuarioService;