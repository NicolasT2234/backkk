// sicrcb-api-gateway/controllers/reportesController.js
const ReporteService = require('../../sicrcb-backend/services/ReporteService');

async function reporteMultas(req, res, next) {
    try {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Reporte_Multas_SICRCB_${Date.now()}.pdf`);
        await ReporteService.generarMultasPdf(res);
    } catch (error) {
        if (!res.headersSent) res.status(500).json({ error: 'Error al generar reporte de multas' });
    }
}

async function pazYSalvo(req, res, next) {
    try {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Paz_y_Salvo_SICRCB_${Date.now()}.pdf`);
        await ReporteService.generarPazYSalvoPdf(req.usuario.id, res);
    } catch (error) {
        if (!res.headersSent) res.status(error.statusCode || 500).json({ error: error.message });
    }
}

async function reporteAlquileres(req, res, next) {
    try {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Reporte_Alquileres_SICRCB_${Date.now()}.pdf`);
        await ReporteService.generarAlquileresPdf(res);
    } catch (error) {
        if (!res.headersSent) res.status(500).json({ error: 'Error al generar reporte de alquileres' });
    }
}

async function comprobanteReserva(req, res, next) {
    try {
        const esAdmin = req.usuario.rol === 'Administrador';
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Comprobante_Reserva_${req.params.id}.pdf`);
        await ReporteService.generarComprobanteReservaPdf(req.params.id, req.usuario.id, esAdmin, res);
    } catch (error) {
        if (!res.headersSent) res.status(error.statusCode || 500).json({ error: error.message });
    }
}

async function reportePqrs(req, res, next) {
    try {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Reporte_PQRS_SICRCB_${Date.now()}.pdf`);
        await ReporteService.generarPqrsPdf(res);
    } catch (error) {
        if (!res.headersSent) res.status(500).json({ error: 'Error al generar reporte de PQRS' });
    }
}

async function censoApartamentos(req, res, next) {
    try {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Censo_Inmuebles_SICRCB_${Date.now()}.pdf`);
        await ReporteService.generarCensoApartamentosPdf(res);
    } catch (error) {
        if (!res.headersSent) res.status(500).json({ error: 'Error al generar censo de apartamentos' });
    }
}

module.exports = {
    reporteMultas,
    pazYSalvo,
    reporteAlquileres,
    comprobanteReserva,
    reportePqrs,
    censoApartamentos
};