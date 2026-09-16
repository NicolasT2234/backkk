// sicrcb-api-gateway/controllers/pqrsController.js
const PqrsService = require('../../sicrcb-backend/services/PqrsService');

async function listarTodas(req, res, next) {
    try {
        const pqrs = await PqrsService.listarTodas();
        return res.status(200).json(pqrs);
    } catch (error) {
        next(error);
    }
}

async function obtenerMiApartamento(req, res, next) {
    try {
        const apto = await PqrsService.obtenerMiApartamento(req.usuario.id);
        return res.status(200).json({ apartamento: apto });
    } catch (error) {
        return res.status(500).json({ error: 'Error interno al consultar apartamento' });
    }
}

async function listarMisPqrs(req, res, next) {
    try {
        const pqrs = await PqrsService.listarMisPqrs(req.usuario.id);
        return res.status(200).json(pqrs);
    } catch (error) {
        return res.status(500).json({ error: 'Error interno al consultar mis PQRs' });
    }
}

async function obtenerPorId(req, res, next) {
    try {
        const pqr = await PqrsService.obtenerPorId(req.params.id);
        return res.status(200).json(pqr);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

async function crear(req, res, next) {
    try {
        const respuesta = await PqrsService.crear(req.usuario.id, req.body);
        return res.status(201).json(respuesta);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

async function actualizar(req, res, next) {
    try {
        const esAdmin = req.usuario.rol?.toLowerCase() === 'administrador';
        const respuesta = await PqrsService.actualizar(req.params.id, req.usuario.id, esAdmin, req.body);
        return res.status(200).json(respuesta);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

async function eliminar(req, res, next) {
    try {
        const respuesta = await PqrsService.eliminar(req.params.id);
        return res.status(200).json(respuesta);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

module.exports = {
    listarTodas,
    obtenerMiApartamento,
    listarMisPqrs,
    obtenerPorId,
    crear,
    actualizar,
    eliminar
};