// sicrcb-api-gateway/controllers/alquileresController.js
// ✅ Importa el servicio del Backend, NUNCA la base de datos directamente
const AlquilerService = require('../../sicrcb-backend/services/AlquilerService');

async function obtenerConfiguracion(req, res, next) {
    try {
        const config = await AlquilerService.obtenerConfiguracion();
        return res.status(200).json(config);
    } catch (error) {
        next(error);
    }
}

async function actualizarConfiguracion(req, res, next) {
    try {
        const respuesta = await AlquilerService.actualizarConfiguracion(req.body);
        return res.status(200).json(respuesta);
    } catch (error) {
        next(error);
    }
}

async function consultarOcupacion(req, res, next) {
    try {
        const ocupacion = await AlquilerService.consultarOcupacion(req.query.fecha);
        return res.status(200).json(ocupacion);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

async function listarTodos(req, res, next) {
    try {
        const lista = await AlquilerService.listarTodos();
        return res.status(200).json(lista);
    } catch (error) {
        next(error);
    }
}

async function listarMisAlquileres(req, res, next) {
    try {
        const lista = await AlquilerService.listarMisAlquileres(req.usuario.id);
        return res.status(200).json(lista);
    } catch (error) {
        next(error);
    }
}

async function obtenerPorId(req, res, next) {
    try {
        const alquiler = await AlquilerService.obtenerPorId(req.params.id);
        return res.status(200).json(alquiler);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

async function crear(req, res, next) {
    try {
        const horaInicio = req.body.horaInicio || req.body.hora_inicio;
        const horaFin = req.body.horaFin || req.body.hora_fin;
        const tipoAlquiler = req.body.tipoAlquiler || req.body.tipo_alquiler;
        const cantidadSillas = req.body.cantidadSillas || req.body.cantidad_sillas;

        const resultado = await AlquilerService.crear(req.usuario.id, {
            descripcion: req.body.descripcion,
            horaInicio,
            horaFin,
            tipoAlquiler,
            cantidadSillas
        });
        return res.status(201).json(resultado);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

async function actualizarEstado(req, res, next) {
    try {
        const esAdmin = req.usuario.rol === 'Administrador';
        if (!esAdmin) {
            return res.status(403).json({ error: 'Solo el administrador puede actualizar el estado.' });
        }
        const resultado = await AlquilerService.actualizarEstado(req.params.id, req.body.estado);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
}

async function cancelar(req, res, next) {
    try {
        const esAdmin = req.usuario.rol === 'Administrador';
        const resultado = await AlquilerService.cancelarReserva(req.params.id, req.usuario.id, esAdmin);
        return res.status(200).json(resultado);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

module.exports = {
    obtenerConfiguracion,
    actualizarConfiguracion,
    consultarOcupacion,
    listarTodos,
    listarMisAlquileres,
    obtenerPorId,
    crear,
    actualizarEstado,
    cancelar
};