// sicrcb-backend/services/DashboardService.js
const DashboardModel = require('../models/DashboardModel');

class DashboardService {
    // 1. Estadísticas del Administrador
    static async obtenerEstadisticasAdmin(startTime) {
        const metricas = await DashboardModel.obtenerMetricasAdmin();
        const { multas, pqrs, alquileres, residentes, noticias } = await DashboardModel.obtenerActividadRecienteAdmin();

        const nowMs = Date.now();
        const eventos = [];

        multas.forEach(m => {
            const fecha = (m.segundos_atras !== null && m.segundos_atras >= 0)
                ? new Date(nowMs - m.segundos_atras * 1000).toISOString()
                : (m.fecha_creacion || new Date().toISOString());

            eventos.push({
                id: `multa-${m.id}`,
                tipo: 'multa',
                titulo: `Sanción #${m.numero || m.id}: ${m.nombre}`,
                detalle: `Apto ${m.bloque}-${m.apto}: ${(m.descripcion || '').substring(0, 55)}...`,
                fecha
            });
        });

        pqrs.forEach(p => {
            const fecha = (p.segundos_atras !== null && p.segundos_atras >= 0)
                ? new Date(nowMs - p.segundos_atras * 1000).toISOString()
                : (p.fecha_evento || new Date().toISOString());

            eventos.push({
                id: `pqr-${p.id}`,
                tipo: 'pqr',
                titulo: `PQR radicada: ${p.nombre}`,
                detalle: `Apto ${p.bloque}-${p.apto}: ${(p.descripcion || '').substring(0, 55)}...`,
                fecha
            });
        });

        alquileres.forEach(a => {
            const fecha = (a.segundos_atras !== null && a.segundos_atras >= 0)
                ? new Date(nowMs - a.segundos_atras * 1000).toISOString()
                : (a.fecha_evento || new Date().toISOString());

            eventos.push({
                id: `alquiler-${a.id}`,
                tipo: 'alquiler',
                titulo: `Reserva: ${a.nombre}`,
                detalle: `Por ${a.primer_nombre || ''} ${a.primer_apellido || ''}`,
                fecha
            });
        });

        residentes.forEach(r => {
            eventos.push({
                id: `residente-${r.id}`,
                tipo: 'residente',
                titulo: `Residente acreditado: ${r.nombre}`,
                detalle: r.descripcion,
                fecha: r.fecha_evento
            });
        });

        noticias.forEach(n => {
            const fecha = (n.segundos_atras !== null && n.segundos_atras >= 0)
                ? new Date(nowMs - n.segundos_atras * 1000).toISOString()
                : (n.fecha_evento || new Date().toISOString());

            eventos.push({
                id: `noticia-${n.id}`,
                tipo: 'noticia',
                titulo: 'Nuevo comunicado oficial',
                detalle: (n.nombre || '').substring(0, 55) + '...',
                fecha
            });
        });

        eventos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        return {
            metricas,
            actividadReciente: eventos.slice(0, 5),
            sistema: {
                apiOk: true,
                dbOk: true,
                dbLatencyMs: Date.now() - startTime,
                servidorTimestamp: new Date().toISOString()
            }
        };
    }

    // 2. Dashboard del Residente
    static async obtenerDashboardResidente(idUsuario, startTime) {
        const propietario = await DashboardModel.obtenerDatosResidente(idUsuario);
        const idProp = propietario?.id_propietario;
        const idApto = propietario?.id_apartamento;

        const multas = await DashboardModel.obtenerMultasResidente(idApto);
        const reservas = await DashboardModel.obtenerReservasResidente(idProp);
        const pqrs = await DashboardModel.obtenerPqrsResidente(idProp);
        const noticias = await DashboardModel.obtenerNoticiasResidente();

        const multasPendientes = multas.filter(m => (m.estado || '').toLowerCase() === 'pendiente');
        const multasResueltas = multas.filter(m => ['resuelta', 'pagado', 'pagada'].includes((m.estado || '').toLowerCase()));

        const nowMs = Date.now();
        const notificaciones = [];

        // Notificaciones de multas
        multasPendientes.forEach(m => {
            const fecha = (m.segundos_atras !== null && m.segundos_atras >= 0)
                ? new Date(nowMs - m.segundos_atras * 1000).toISOString()
                : (m.fecha_creacion || null);

            notificaciones.push({
                id: `notif-multa-${m.id}`,
                tipo: 'multa',
                urgencia: 'urgente',
                titulo: `Sanción pendiente: ${m.nombre}`,
                mensaje: `Multa de $${Number(m.monto || 0).toLocaleString()} (#${m.numero || m.id}) por conciliar.`,
                fecha
            });
        });

        // Notificaciones de noticias
        noticias.forEach(n => {
            const fecha = (n.segundos_atras !== null && n.segundos_atras >= 0)
                ? new Date(nowMs - n.segundos_atras * 1000).toISOString()
                : (n.fecha_publicacion || new Date().toISOString());

            notificaciones.push({
                id: `notif-noticia-${n.id}`,
                tipo: 'noticia',
                urgencia: 'info',
                titulo: 'Nuevo comunicado administrativo',
                mensaje: (n.descripcion || '').substring(0, 95) + ((n.descripcion || '').length > 95 ? '...' : ''),
                fecha
            });
        });

        // Notificaciones de PQRs
        pqrs.forEach(p => {
            const est = (p.estado || '').toLowerCase();
            const fecha = (p.segundos_atras !== null && p.segundos_atras >= 0)
                ? new Date(nowMs - p.segundos_atras * 1000).toISOString()
                : (p.fecha || new Date().toISOString());

            notificaciones.push({
                id: `notif-pqr-${p.id}`,
                tipo: 'pqr',
                urgencia: est === 'resuelta' ? 'exito' : 'alerta',
                titulo: `PQR #${p.id} (${p.estado})`,
                mensaje: p.titulo_pqr,
                fecha
            });
        });

        return {
            propietario: {
                nombre: propietario ? `${propietario.primer_nombre} ${propietario.primer_apellido}` : 'Residente',
                apartamento: propietario && propietario.apto ? `Torre ${propietario.bloque || ''} - Apto ${propietario.apto}` : 'Apartamento asignado',
                alDia: multasPendientes.length === 0
            },
            metricas: {
                multasPendientes: multasPendientes.length,
                multasResueltas: multasResueltas.length,
                reservasActivas: reservas.filter(r => ['reservado', 'confirmado', 'activo'].includes((r.estado || '').toLowerCase())).length,
                noticiasActivas: noticias.length,
                pqrsActivas: pqrs.filter(p => (p.estado || '').toLowerCase() !== 'resuelta').length
            },
            notificaciones,
            proximasReservas: reservas,
            ultimasNoticias: noticias.map(n => ({
                id: n.id,
                titulo: 'Aviso a la Comunidad',
                descripcion: n.descripcion,
                fecha_publicacion: (n.segundos_atras !== null && n.segundos_atras >= 0)
                    ? new Date(nowMs - n.segundos_atras * 1000).toISOString()
                    : n.fecha_publicacion,
                archivo_url: n.archivo_url
            })),
            sistema: {
                latenciaMs: Date.now() - startTime,
                servidorTimestamp: new Date().toISOString()
            }
        };
    }
}

module.exports = DashboardService;