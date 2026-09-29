// sicrcb-backend/models/AdminUsuarioModel.js
const AdminUsuarioRepository = require('../repositories/AdminUsuarioRepository');

// Instancia única del repositorio
const adminUsuarioRepository = new AdminUsuarioRepository();

class AdminUsuarioModel {
    // 1. Listar usuarios con búsqueda y unión de apartamentos
    static async listarUsuarios(search) {
        return await adminUsuarioRepository.listarUsuarios(search);
    }

    // 2. Obtener catálogos de documentos y apartamentos libres
    static async obtenerCatalogos(idUsuario) {
        return await adminUsuarioRepository.obtenerCatalogos(idUsuario);
    }

    // 3. Crear residente con transacción
    static async crearResidente({
        email, contrasenaProvisional, primerNombre, segundoNombre,
        primerApellido, segundoApellido, idTipoDocumento, numeroDocumento,
        listaApartamentos, rol
    }) {
        return await adminUsuarioRepository.crearResidente({
            email, contrasenaProvisional, primerNombre, segundoNombre,
            primerApellido, segundoApellido, idTipoDocumento, numeroDocumento,
            listaApartamentos, rol
        });
    }

    // 4. Actualizar residente y asignaciones
    static async actualizarResidente(id, { email, primerNombre, segundoNombre, primerApellido, segundoApellido, idTipoDocumento, numeroDocumento, idApartamentos }) {
        return await adminUsuarioRepository.actualizarResidente(id, { email, primerNombre, segundoNombre, primerApellido, segundoApellido, idTipoDocumento, numeroDocumento, idApartamentos });
    }

    // 5. Cambio de estado con blindaje de reactivación
    static async cambiarEstado(id, nuevoEstado) {
        return await adminUsuarioRepository.cambiarEstado(id, nuevoEstado);
    }
}

module.exports = AdminUsuarioModel;