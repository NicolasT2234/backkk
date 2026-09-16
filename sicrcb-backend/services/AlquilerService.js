// sicrcb-backend/services/AlquilerService.js
const AlquilerModel = require('../models/AlquilerModel');

class AlquilerService {
    static async obtenerConfiguracion() {
        return await AlquilerModel.obtenerConfiguracion();
    }

    static async actualizarConfiguracion(datos) {
        await AlquilerModel.actualizarConfiguracion(datos);
        return { mensaje: 'Tarifas e inventario actualizados con éxito' };
    }

    // Cálculo dinámico de bloques de 10:00 a 19:00
    static async consultarOcupacion(fecha) {
        if (!fecha) {
            const err = new Error('Debes proporcionar la fecha (YYYY-MM-DD).');
            err.statusCode = 400;
            throw err;
        }

        const config = await AlquilerModel.obtenerConfiguracion();
        const reservas = await AlquilerModel.obtenerReservasPorFecha(fecha);

        const franjas = [];
        for (let h = 10; h < 19; h++) {
            const inicio = `${String(h).padStart(2, '0')}:00`;
            const fin = `${String(h + 1).padStart(2, '0')}:00`;

            let salonOcupado = false;
            let sillasOcupadas = 0;

            for (const r of reservas) {
                if (inicio < r.hora_fin && fin > r.hora_inicio) {
                    if (r.id_salon_comunal !== null) salonOcupado = true;
                    sillasOcupadas += Number(r.cantidad_sillas || 0);
                }
            }

            franjas.push({
                hora: h,
                inicio,
                fin,
                etiqueta: `${inicio} – ${fin}`,
                salonOcupado,
                sillasOcupadas,
                sillasDisponibles: Math.max(0, config.totalSillas - sillasOcupadas)
            });
        }

        return {
            fecha,
            horarioOperacion: { inicio: '10:00', fin: '19:00' },
            reservasDelDia: reservas,
            franjas,
            totalSillas: config.totalSillas
        };
    }

    static async listarTodos() {
        return await AlquilerModel.listarTodos();
    }

    static async listarMisAlquileres(idUsuario) {
        return await AlquilerModel.listarPorUsuario(idUsuario);
    }

    static async obtenerPorId(id) {
        const alquiler = await AlquilerModel.obtenerPorId(id);
        if (!alquiler) {
            const err = new Error('Alquiler no encontrado');
            err.statusCode = 404;
            throw err;
        }
        return alquiler;
    }

    static async crear(idUsuario, { descripcion, horaInicio, horaFin, tipoAlquiler, cantidadSillas }) {
        const inicio = new Date(horaInicio);
        const fin = new Date(horaFin);

        if (inicio >= fin) {
            const err = new Error('La hora de inicio debe ser anterior a la hora de finalización.');
            err.statusCode = 400;
            throw err;
        }

        // Regla de negocio: Horario de 10:00 a.m. a 7:00 p.m.
        const minInicio = inicio.getHours() * 60 + inicio.getMinutes();
        const minFin = fin.getHours() * 60 + fin.getMinutes();
        if (minInicio < 10 * 60 || minFin > 19 * 60) {
            const err = new Error('El horario permitido para reservas es exclusivamente de 10:00 a.m. a 7:00 p.m.');
            err.statusCode = 400;
            throw err;
        }

        const cantidad = parseInt(cantidadSillas || 0, 10);
        const resultado = await AlquilerModel.crearReserva(idUsuario, {
            descripcion,
            horaInicio,
            horaFin,
            tipoAlquiler,
            cantidadSillas: cantidad
        });

        return {
            message: 'Alquiler creado exitosamente',
            id: resultado.id,
            valorHora: resultado.valorHora
        };
    }

    static async actualizarEstado(id, estado) {
        await AlquilerModel.actualizarEstado(id, estado);
        return { message: 'Estado actualizado exitosamente' };
    }

    static async cancelarReserva(id, idUsuario, esAdmin) {
        const alquiler = await AlquilerModel.obtenerPorId(id);
        if (!alquiler) {
            const err = new Error('Alquiler no encontrado');
            err.statusCode = 404;
            throw err;
        }

        if (!esAdmin && alquiler.id_usuario !== idUsuario) {
            const err = new Error('No tienes permiso para eliminar esta reserva');
            err.statusCode = 403;
            throw err;
        }

        // Regla de 24 horas de anticipación para residentes
        if (!esAdmin) {
            const fechaInicio = new Date(alquiler.hora_inicio);
            const ahora = new Date();
            const horasRestantes = (fechaInicio.getTime() - ahora.getTime()) / (1000 * 60 * 60);

            if (horasRestantes < 24) {
                const err = new Error('No puedes cancelar una reserva con menos de 24 horas de anticipación.');
                err.statusCode = 400;
                throw err;
            }
        }

        await AlquilerModel.eliminarReserva(id);
        return { message: 'Reserva eliminada exitosamente' };
    }
}

module.exports = AlquilerService;