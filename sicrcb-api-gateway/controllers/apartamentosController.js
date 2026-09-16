// sicrcb-api-gateway/controllers/apartamentosController.js
const ApartamentoService = require('../../sicrcb-backend/services/ApartamentoService');

async function listarTodos(req, res, next) {
    try {
        const lista = await ApartamentoService.listarTodos();
        return res.status(200).json(lista);
    } catch (error) {
        next(error);
    }
}

async function obtenerPorId(req, res, next) {
    try {
        const apto = await ApartamentoService.obtenerPorId(req.params.id);
        return res.status(200).json(apto);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

async function crear(req, res, next) {
    try {
        const resultado = await ApartamentoService.crear(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
}

async function actualizar(req, res, next) {
    try {
        const resultado = await ApartamentoService.actualizar(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

async function eliminar(req, res, next) {
    try {
        const resultado = await ApartamentoService.eliminar(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
}

module.exports = { listarTodos, obtenerPorId, crear, actualizar, eliminar };