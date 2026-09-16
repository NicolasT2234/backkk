// sicrcb-api-gateway/controllers/noticiasController.js
const NoticiaService = require('../../sicrcb-backend/services/NoticiaService');

async function listarTodas(req, res, next) {
    try {
        const noticias = await NoticiaService.listarTodas();
        return res.status(200).json(noticias);
    } catch (error) {
        next(error);
    }
}

async function listarDestacadas(req, res, next) {
    try {
        const noticias = await NoticiaService.listarDestacadas();
        return res.status(200).json(noticias);
    } catch (error) {
        next(error);
    }
}

async function obtenerPorId(req, res, next) {
    try {
        const noticia = await NoticiaService.obtenerPorId(req.params.id);
        return res.status(200).json(noticia);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

async function crear(req, res, next) {
    try {
        const archivoUrl = req.file ? `/uploads/noticias/${req.file.filename}` : null;
        const resultado = await NoticiaService.crear(req.usuario.id, {
            descripcion: req.body.descripcion,
            fechaPublicacion: req.body.fechaPublicacion,
            archivoUrl
        });
        return res.status(201).json(resultado);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

async function actualizar(req, res, next) {
    try {
        const archivoUrl = req.file ? `/uploads/noticias/${req.file.filename}` : null;
        const resultado = await NoticiaService.actualizar(req.params.id, {
            descripcion: req.body.descripcion,
            fechaPublicacion: req.body.fechaPublicacion,
            archivoUrl
        });
        return res.status(200).json(resultado);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

async function eliminar(req, res, next) {
    try {
        const resultado = await NoticiaService.eliminar(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

module.exports = { 
    listarTodas, 
    listarDestacadas, 
    obtenerPorId, 
    crear, 
    actualizar, 
    eliminar 
};