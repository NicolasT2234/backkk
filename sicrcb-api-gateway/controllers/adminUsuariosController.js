// sicrcb-api-gateway/controllers/adminUsuariosController.js
const AdminUsuarioService = require('../../sicrcb-backend/services/AdminUsuarioService');

async function listarUsuarios(req, res, next) {
    try {
        const usuarios = await AdminUsuarioService.listarUsuarios(req.query.search);
        return res.status(200).json({ usuarios });
    } catch (error) {
        next(error);
    }
}

async function obtenerCatalogos(req, res, next) {
    try {
        const catalogos = await AdminUsuarioService.obtenerCatalogos(req.query.idUsuario);
        return res.status(200).json(catalogos);
    } catch (error) {
        next(error);
    }
}

async function registrarResidente(req, res, next) {
    try {
        const respuesta = await AdminUsuarioService.registrarResidente(req.body);
        return res.status(201).json(respuesta);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

async function actualizarResidente(req, res, next) {
    try {
        const respuesta = await AdminUsuarioService.actualizarResidente(req.params.id, req.body);
        return res.status(200).json(respuesta);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

async function cambiarEstado(req, res, next) {
    try {
        const respuesta = await AdminUsuarioService.cambiarEstado(req.params.id, req.body.nuevoEstado);
        return res.status(200).json(respuesta);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

module.exports = {
    listarUsuarios,
    obtenerCatalogos,
    registrarResidente,
    actualizarResidente,
    cambiarEstado
};