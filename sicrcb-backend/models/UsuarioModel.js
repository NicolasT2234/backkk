// sicrcb-backend/models/UsuarioModel.js
const UsuarioRepository = require('../repositories/UsuarioRepository');

// Instancia única del repositorio
const usuarioRepository = new UsuarioRepository();

class UsuarioModel {
    // 1. Validar credenciales y estado en login
    static async validarCredenciales(email, contraseña) {
        return await usuarioRepository.validarCredenciales(email, contraseña);
    }

    // 2. Buscar por email para recuperación de contraseña
    static async buscarPorEmail(email) {
        return await usuarioRepository.buscarPorEmail(email);
    }

    // 3. Actualizar contraseña con SHA-256
    static async actualizarPassword(idUsuario, nuevaPassword) {
        return await usuarioRepository.actualizarPassword(idUsuario, nuevaPassword);
    }

    // 4. Obtener perfil completo del usuario en sesión
    static async obtenerPerfilCompleto(idUsuario) {
        return await usuarioRepository.obtenerPerfilCompleto(idUsuario);
    }

    // 5. Actualizar perfil propio con transacción (contraseña y user_data)
    static async actualizarPerfilPropio(idUsuario, { nombres, apellidos, contraseña }) {
        return await usuarioRepository.actualizarPerfilPropio(idUsuario, { nombres, apellidos, contraseña });
    }
}

module.exports = UsuarioModel;