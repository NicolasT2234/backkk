// sicrcb-backend/services/AdminUsuarioService.js
const crypto = require('crypto');
const AdminUsuarioModel = require('../models/AdminUsuarioModel');

const REGEX_SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
const REGEX_SOLO_NUMEROS = /^\d+$/;

class AdminUsuarioService {
    static async listarUsuarios(search) {
        const rows = await AdminUsuarioModel.listarUsuarios(search);

        // Agrupación en memoria: evita filas duplicadas para residentes con múltiples apartamentos
        const usuariosMap = new Map();
        for (const row of rows) {
            if (!usuariosMap.has(row.id_usuario)) {
                usuariosMap.set(row.id_usuario, {
                    id_usuario: row.id_usuario,
                    email: row.email,
                    estado_usuario: row.estado_usuario,
                    numero_documento: row.numero_documento,
                    id_tipo_documento: row.id_tipo_documento,
                    tipo_documento: row.tipo_documento,
                    primer_nombre: row.primer_nombre,
                    segundo_nombre: row.segundo_nombre,
                    primer_apellido: row.primer_apellido,
                    segundo_apellido: row.segundo_apellido,
                    rol: row.rol || 'Propietario',
                    id_propietario: row.id_propietario,
                    id_apartamento: row.id_apartamento,
                    numero_apartamento: row.numero_apartamento,
                    numero_interior: row.numero_interior,
                    nombre_bloque: row.bloque,
                    apartamentos: []
                });
            }

            if (row.id_apartamento) {
                const usr = usuariosMap.get(row.id_usuario);
                if (!usr.apartamentos.some(ap => ap.id === row.id_apartamento)) {
                    usr.apartamentos.push({
                        id: row.id_apartamento,
                        numero: row.numero_apartamento,
                        interior: row.numero_interior,
                        bloque: row.bloque
                    });
                }
            }
        }

        return Array.from(usuariosMap.values());
    }

    static async obtenerCatalogos(idUsuario) {
        return await AdminUsuarioModel.obtenerCatalogos(idUsuario);
    }

    static async registrarResidente(datos) {
        let listaApartamentos = [];
        if (Array.isArray(datos.idApartamentos) && datos.idApartamentos.length > 0) {
            listaApartamentos = datos.idApartamentos.map(id => parseInt(id, 10)).filter(n => !isNaN(n));
        } else if (datos.idApartamento) {
            listaApartamentos = [parseInt(datos.idApartamento, 10)];
        }

        if (!datos.email || !datos.primerNombre || !datos.primerApellido || !datos.idTipoDocumento || !datos.numeroDocumento || listaApartamentos.length === 0) {
            const err = new Error('Todos los campos obligatorios y al menos un apartamento deben ser completados.');
            err.statusCode = 400;
            throw err;
        }

        if (!REGEX_SOLO_LETRAS.test(String(datos.primerNombre).trim())) {
            const err = new Error('El primer nombre solo puede contener letras y espacios.');
            err.statusCode = 400;
            throw err;
        }
        if (datos.segundoNombre && String(datos.segundoNombre).trim() !== '' && !REGEX_SOLO_LETRAS.test(String(datos.segundoNombre).trim())) {
            const err = new Error('El segundo nombre solo puede contener letras y espacios.');
            err.statusCode = 400;
            throw err;
        }
        if (!REGEX_SOLO_LETRAS.test(String(datos.primerApellido).trim())) {
            const err = new Error('El primer apellido solo puede contener letras y espacios.');
            err.statusCode = 400;
            throw err;
        }
        if (datos.segundoApellido && String(datos.segundoApellido).trim() !== '' && !REGEX_SOLO_LETRAS.test(String(datos.segundoApellido).trim())) {
            const err = new Error('El segundo apellido solo puede contener letras y espacios.');
            err.statusCode = 400;
            throw err;
        }
        if (!REGEX_SOLO_NUMEROS.test(String(datos.numeroDocumento).trim())) {
            const err = new Error('El número de documento solo debe contener números.');
            err.statusCode = 400;
            throw err;
        }

        const contrasenaProvisional = crypto.randomBytes(4).toString('hex');

        const resultado = await AdminUsuarioModel.crearResidente({
            email: datos.email.trim(),
            contrasenaProvisional,
            primerNombre: datos.primerNombre,
            segundoNombre: datos.segundoNombre,
            primerApellido: datos.primerApellido,
            segundoApellido: datos.segundoApellido,
            idTipoDocumento: datos.idTipoDocumento,
            numeroDocumento: datos.numeroDocumento,
            listaApartamentos,
            rol: datos.rol || 'Propietario'
        });

        return {
            message: 'Residente registrado y apartamentos asignados exitosamente.',
            credenciales: resultado
        };
    }

    static async actualizarResidente(id, datos) {
        await AdminUsuarioModel.actualizarResidente(id, datos);
        return { message: 'Residente y apartamentos actualizados exitosamente.' };
    }

    static async cambiarEstado(id, nuevoEstado) {
        if (!['Activo', 'Inactivo'].includes(nuevoEstado)) {
            const err = new Error("El estado debe ser 'Activo' o 'Inactivo'.");
            err.statusCode = 400;
            throw err;
        }

        const { advertencia, apartamentosOcupados } = await AdminUsuarioModel.cambiarEstado(id, nuevoEstado);
        return {
            message: `Estado del usuario actualizado a ${nuevoEstado}.`,
            advertencia,
            apartamentosOcupados
        };
    }
}

module.exports = AdminUsuarioService;