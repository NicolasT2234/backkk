// sicrcb-api-gateway/controllers/multasController.js
const MultaService = require('../../sicrcb-backend/services/MultaService');

async function listarTodas(req, res, next) {
    try {
        const multas = await MultaService.listarTodas();
        return res.status(200).json(multas);
    } catch (error) {
        next(error);
    }
}

async function listarMisMultas(req, res, next) {
    try {
        const multas = await MultaService.listarMisMultas(req.usuario.id);
        return res.status(200).json(multas);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

async function obtenerPorId(req, res, next) {
    try {
        const multa = await MultaService.obtenerPorId(req.params.id);
        return res.status(200).json(multa);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

async function crear(req, res, next) {
    try {
        const resultado = await MultaService.registrarMulta(req.usuario.id, req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

async function actualizar(req, res, next) {
    try {
        const resultado = await MultaService.actualizarMulta(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

async function eliminar(req, res, next) {
    try {
        const resultado = await MultaService.eliminarMulta(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

module.exports = { 
    listarTodas, 
    listarMisMultas, 
    obtenerPorId, 
    crear, 
    actualizar, 
    eliminar 
};