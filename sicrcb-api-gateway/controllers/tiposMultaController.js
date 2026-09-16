// sicrcb-api-gateway/controllers/tiposMultaController.js
const TipoMultaService = require('../../sicrcb-backend/services/TipoMultaService');

async function listarTodos(req, res, next) {
    try {
        const lista = await TipoMultaService.listarTodos();
        return res.status(200).json(lista);
    } catch (error) {
        next(error);
    }
}

async function obtenerPorId(req, res, next) {
    try {
        const item = await TipoMultaService.obtenerPorId(req.params.id);
        return res.status(200).json(item);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

async function crear(req, res, next) {
    try {
        const resultado = await TipoMultaService.crear(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
}

async function actualizar(req, res, next) {
    try {
        const resultado = await TipoMultaService.actualizar(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

async function eliminar(req, res, next) {
    try {
        const resultado = await TipoMultaService.eliminar(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
}

module.exports = { listarTodos, obtenerPorId, crear, actualizar, eliminar };