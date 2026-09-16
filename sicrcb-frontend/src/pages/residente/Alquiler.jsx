import {
    AlertCircle,
    AlertTriangle,
    Armchair,
    Ban,
    Building,
    Calendar,
    Check,
    CheckCircle,
    Clock,
    DollarSign,
    Home,
    Info,
    RotateCw,
    Search,
    Send,
    Trash2,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/css/alquiler.css";
import "../../assets/css/styles.css";
import BotonReporte from "../../components/BotonReporte.jsx";
import Footer from "../../components/Footer.jsx";
import NavbarApp from "../../components/NavbarApp.jsx";
import api from "../../services/api.js";

const TIPOS_RESERVA = [
    { id: "salon", label: "Salón Social", desc: "Solo espacio del salón comunal", icon: Home },
    { id: "sillas", label: "Solo Sillas", desc: "Mobiliario y silletería", icon: Armchair },
    { id: "ambos", label: "Salón + Sillas", desc: "Espacio completo y mobiliario", icon: Building },
];

// 9 Bloques de 1 hora entre las 10:00 y las 19:00
const BLOQUES_HORARIOS = [
    { id: 10, inicio: "10:00", fin: "11:00", label: "10:00 a.m. – 11:00 a.m." },
    { id: 11, inicio: "11:00", fin: "12:00", label: "11:00 a.m. – 12:00 m." },
    { id: 12, inicio: "12:00", fin: "13:00", label: "12:00 m. – 01:00 p.m." },
    { id: 13, inicio: "13:00", fin: "14:00", label: "01:00 p.m. – 02:00 p.m." },
    { id: 14, inicio: "14:00", fin: "15:00", label: "02:00 p.m. – 03:00 p.m." },
    { id: 15, inicio: "15:00", fin: "16:00", label: "03:00 p.m. – 04:00 p.m." },
    { id: 16, inicio: "16:00", fin: "17:00", label: "04:00 p.m. – 05:00 p.m." },
    { id: 17, inicio: "17:00", fin: "18:00", label: "05:00 p.m. – 06:00 p.m." },
    { id: 18, inicio: "18:00", fin: "19:00", label: "06:00 p.m. – 07:00 p.m." },
];

function Alquiler() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout");
        } catch (err) {
            console.error("Logout fallido:", err);
        } finally {
            navigate("/");
        }
    };

    // Fecha actual formateada (YYYY-MM-DD) para bloquear fechas pasadas
    const todayDateString = useMemo(() => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split("T")[0];
    }, []);

    // Parámetros oficiales fijados por el Administrador
    const [tarifas, setTarifas] = useState({
        valorHoraSalon: 50000,
        valorHoraSillas: 20000,
        totalSillas: 120,
    });

    // Datos de ocupación para el día seleccionado
    const [ocupacionDia, setOcupacionDia] = useState(null);
    const [cargandoOcupacion, setCargandoOcupacion] = useState(false);

    // Formulario de reserva
    const [formData, setFormData] = useState({
        descripcion: "",
        tipoAlquiler: "salon",
        fechaEvento: todayDateString,
        horaInicio: "",
        horaFin: "",
        cantidadSillas: 10,
    });

    // Apartamento asociado automático
    const [apartamentoAsociado, setApartamentoAsociado] = useState(null);
    const [loadingApto, setLoadingApto] = useState(true);

    // Estados de retroalimentación
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    // Historial
    const [historial, setHistorial] = useState([]);
    const [loadingHistorial, setLoadingHistorial] = useState(true);
    const [reservaACancelar, setReservaACancelar] = useState(null);
    const [cancelando, setCancelando] = useState(false);

    // Filtros de fecha en tabla
    const [filtroTiempo, setFiltroTiempo] = useState("todas");
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");
    const [busqueda, setBusqueda] = useState("");

    // 1. Cargar tarifas oficiales
    const fetchTarifas = async () => {
        try {
            const res = await api.get("/alquileres/configuracion");
            if (res.data) {
                setTarifas({
                    valorHoraSalon: Number(res.data.valorHoraSalon) || 50000,
                    valorHoraSillas: Number(res.data.valorHoraSillas) || 20000,
                    totalSillas: Number(res.data.totalSillas) || 120,
                });
            }
        } catch (err) {
            console.warn("No se pudieron cargar tarifas oficiales del servidor:", err);
        }
    };

    // 2. Cargar apartamento asociado al usuario
    useEffect(() => {
        const fetchDatosIniciales = async () => {
            setLoadingApto(true);
            try {
                const resUser = await api.get("/usuarios/me");
                const userData = resUser.data;

                const resAptos = await api.get("/apartamentos");
                if (Array.isArray(resAptos.data)) {
                    const miApto = resAptos.data.find(
                        a =>
                            a.nombre_propietario &&
                            userData.nombres &&
                            a.nombre_propietario.toLowerCase().trim() === userData.nombres.toLowerCase().trim() &&
                            a.apellido_propietario &&
                            userData.apellidos &&
                            a.apellido_propietario.toLowerCase().trim() === userData.apellidos.toLowerCase().trim(),
                    );

                    if (miApto) {
                        setApartamentoAsociado(miApto);
                    } else if (resAptos.data.length > 0) {
                        setApartamentoAsociado(resAptos.data[0]);
                    }
                }
            } catch (err) {
                console.warn("Error al cargar datos del usuario/apartamento:", err);
            } finally {
                setLoadingApto(false);
            }
        };

        fetchDatosIniciales();
        fetchTarifas();
    }, []);

    // 3. Cargar historial de alquileres
    const fetchHistorial = async () => {
        setLoadingHistorial(true);
        try {
            let res;
            try {
                res = await api.get("/alquileres/mis-alquileres");
            } catch (e) {
                res = await api.get("/alquileres");
            }
            setHistorial(Array.isArray(res.data) ? res.data : res.data?.data || []);
        } catch (err) {
            console.error("Error al obtener historial de alquileres:", err);
        } finally {
            setLoadingHistorial(false);
        }
    };

    useEffect(() => {
        fetchHistorial();
    }, []);

    // 4. Consultar ocupación cuando cambia la fecha del evento
    const consultarOcupacion = async fecha => {
        if (!fecha) {
            setOcupacionDia(null);
            return;
        }
        try {
            setCargandoOcupacion(true);
            const res = await api.get("/alquileres/ocupacion", {
                params: { fecha },
            });
            setOcupacionDia(res.data);
        } catch (err) {
            console.warn("Error al consultar ocupación del día:", err);
        } finally {
            setCargandoOcupacion(false);
        }
    };

    useEffect(() => {
        consultarOcupacion(formData.fechaEvento);
    }, [formData.fechaEvento]);

    // 5. Valor por hora oficial fijado por la administración (Bloqueado)
    const valorHoraFijo = useMemo(() => {
        if (formData.tipoAlquiler === "salon") return tarifas.valorHoraSalon;
        if (formData.tipoAlquiler === "sillas") return tarifas.valorHoraSillas;
        if (formData.tipoAlquiler === "ambos") return tarifas.valorHoraSalon + tarifas.valorHoraSillas;
        return tarifas.valorHoraSalon;
    }, [formData.tipoAlquiler, tarifas]);

    // Determinar si un bloque horario específico está ocupado en la fecha seleccionada
    const esBloqueOcupado = bloque => {
        if (!ocupacionDia?.reservasDelDia) return false;

        // Si alquila salón o ambos, revisar exclusividad del salón
        if (formData.tipoAlquiler === "salon" || formData.tipoAlquiler === "ambos") {
            const colision = ocupacionDia.reservasDelDia.some(r => {
                if (r.id_salon_comunal === null) return false;
                return bloque.inicio < r.hora_fin && bloque.fin > r.hora_inicio;
            });
            if (colision) return true;
        }

        // Si alquila solo sillas, verificar si quedan sillas
        if (formData.tipoAlquiler === "sillas") {
            const franja = ocupacionDia.franjas?.find(f => f.inicio === bloque.inicio);
            if (franja && franja.sillasDisponibles <= 0) return true;
        }

        return false;
    };

    // Selección de MÚLTIPLES HORAS CONSECUTIVAS de forma dinámica
    const handleSelectBloque = bloque => {
        if (esBloqueOcupado(bloque)) return;

        // Caso A: No hay selección previa -> este bloque es el punto de inicio (1 hora seleccionada)
        if (!formData.horaInicio) {
            setFormData(prev => ({
                ...prev,
                horaInicio: bloque.inicio,
                horaFin: bloque.fin,
            }));
            return;
        }

        const inicioActualH = parseInt(formData.horaInicio.split(":")[0], 10);
        const clickH = bloque.id;

        // Caso B: El usuario hace clic en el mismo bloque inicial -> deseleccionar / reiniciar
        if (bloque.inicio === formData.horaInicio && bloque.fin === formData.horaFin) {
            setFormData(prev => ({
                ...prev,
                horaInicio: "",
                horaFin: "",
            }));
            return;
        }

        // Caso C: El usuario hace clic en una hora posterior -> extender el rango (MÚLTIPLES HORAS)
        if (clickH >= inicioActualH) {
            // Validar que en todo el intervalo [inicioActualH, clickH] no haya ninguna hora ocupada
            let tieneCruce = false;
            for (let h = inicioActualH; h <= clickH; h++) {
                const b = BLOQUES_HORARIOS.find(item => item.id === h);
                if (b && esBloqueOcupado(b)) {
                    tieneCruce = true;
                    break;
                }
            }

            if (tieneCruce) {
                setError(
                    "El rango seleccionado contiene horas que ya están ocupadas. Elige horas consecutivas disponibles.",
                );
                setTimeout(() => setError(""), 4000);
                return;
            }

            // Rango válido: extiende hasta el fin del bloque clickeado
            setFormData(prev => ({
                ...prev,
                horaFin: bloque.fin,
            }));
            return;
        }

        // Caso D: El usuario hace clic en una hora anterior -> redefinir como nuevo inicio o reiniciar
        setFormData(prev => ({
            ...prev,
            horaInicio: bloque.inicio,
            horaFin: bloque.fin,
        }));
    };

    const limpiarSeleccionHorario = () => {
        setFormData(prev => ({ ...prev, horaInicio: "", horaFin: "" }));
    };

    // Cálculo de duración y costo total
    const calculoReserva = useMemo(() => {
        if (!formData.fechaEvento || !formData.horaInicio || !formData.horaFin) {
            return { horas: 0, total: 0, error: null };
        }

        const inicio = new Date(`${formData.fechaEvento}T${formData.horaInicio}:00`);
        const fin = new Date(`${formData.fechaEvento}T${formData.horaFin}:00`);
        const ahora = new Date();

        if (inicio < ahora) {
            return {
                horas: 0,
                total: 0,
                error: "Para eventos de hoy, la hora de inicio debe ser posterior a la hora actual.",
            };
        }

        const diffMs = fin.getTime() - inicio.getTime();
        if (diffMs <= 0) {
            return {
                horas: 0,
                total: 0,
                error: "La hora de finalización debe ser posterior a la de inicio.",
            };
        }

        const horas = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
        const total = Math.round(horas * valorHoraFijo);

        return { horas, total, error: null };
    }, [formData.fechaEvento, formData.horaInicio, formData.horaFin, valorHoraFijo]);

    // Filtrado reactivo en tabla
    const historialFiltrado = useMemo(() => {
        return historial.filter(item => {
            if (!item.hora_inicio) return false;
            const fechaItem = new Date(item.hora_inicio);
            const ahora = new Date();

            if (filtroTiempo === "proximas" && fechaItem < ahora) return false;
            if (filtroTiempo === "pasadas" && fechaItem >= ahora) return false;

            if (fechaDesde) {
                const dDesde = new Date(fechaDesde + "T00:00:00");
                if (fechaItem < dDesde) return false;
            }

            if (fechaHasta) {
                const dHasta = new Date(fechaHasta + "T23:59:59");
                if (fechaItem > dHasta) return false;
            }

            if (busqueda.trim()) {
                const q = busqueda.toLowerCase().trim();
                const coincide =
                    item.id?.toString().includes(q) ||
                    item.descripcion?.toLowerCase().includes(q) ||
                    item.tipo_alquiler?.toLowerCase().includes(q) ||
                    item.estado?.toLowerCase().includes(q);
                if (!coincide) return false;
            }

            return true;
        });
    }, [historial, filtroTiempo, fechaDesde, fechaHasta, busqueda]);

    const hayFiltrosActivos = fechaDesde !== "" || fechaHasta !== "" || filtroTiempo !== "todas" || busqueda !== "";

    const limpiarFiltros = () => {
        setFechaDesde("");
        setFechaHasta("");
        setFiltroTiempo("todas");
        setBusqueda("");
    };

    // Regla de 24 horas para cancelación
    const evaluarCancelacion = (horaInicioStr, estado) => {
        if (!horaInicioStr) return { cancelable: false, texto: "Fecha no válida" };
        if (estado?.toLowerCase() === "cancelado") return { cancelable: false, texto: "Cancelado" };
        if (estado?.toLowerCase() === "finalizado") return { cancelable: false, texto: "Finalizado" };

        const fechaInicio = new Date(horaInicioStr);
        const ahora = new Date();
        const diferenciaHoras = (fechaInicio.getTime() - ahora.getTime()) / (1000 * 60 * 60);

        if (diferenciaHoras < 0) {
            return { cancelable: false, texto: "Evento transcurrido" };
        }

        if (diferenciaHoras < 24) {
            const horasRestantes = Math.max(0, Math.floor(diferenciaHoras));
            return {
                cancelable: false,
                texto: `No cancelable (faltan ${horasRestantes}h · mín. 24h)`,
            };
        }

        return {
            cancelable: true,
            texto: "Cancelar",
            horasRestantes: Math.floor(diferenciaHoras),
        };
    };

    // Cancelar reserva
    const handleConfirmarCancelacion = async () => {
        if (!reservaACancelar) return;
        setCancelando(true);
        setError("");
        try {
            await api.delete(`/alquileres/${reservaACancelar.id}`);
            setSuccess(`La reserva #${reservaACancelar.id} fue eliminada exitosamente.`);
            setReservaACancelar(null);
            fetchHistorial();
            consultarOcupacion(formData.fechaEvento);
        } catch (err) {
            console.error("Error al cancelar alquiler:", err);
            const serverMsg =
                err.response?.data?.error ||
                err.response?.data?.message ||
                "No puedes cancelar una reserva con menos de 24 horas de anticipación.";
            setError(serverMsg);
            setReservaACancelar(null);
        } finally {
            setCancelando(false);
        }
    };

    // Envío del formulario
    const handleSubmit = async e => {
        e.preventDefault();
        setSuccess("");
        setError("");

        if (!formData.descripcion.trim()) {
            setError("La descripción o motivo es requerida.");
            return;
        }
        if (!formData.fechaEvento) {
            setError("Debes seleccionar la fecha del evento.");
            return;
        }
        if (!formData.horaInicio || !formData.horaFin) {
            setError("Por favor selecciona tu horario de reserva haciendo clic en los bloques horarios.");
            return;
        }
        if (calculoReserva.error) {
            setError(calculoReserva.error);
            return;
        }

        setLoading(true);
        try {
            const inicioCompleto = `${formData.fechaEvento} ${formData.horaInicio}:00`;
            const finCompleto = `${formData.fechaEvento} ${formData.horaFin}:00`;

            const payload = {
                descripcion: formData.descripcion.trim(),
                horaInicio: inicioCompleto,
                horaFin: finCompleto,
                hora_inicio: inicioCompleto,
                hora_fin: finCompleto,
                tipoAlquiler: formData.tipoAlquiler,
                tipo_alquiler: formData.tipoAlquiler,
                cantidadSillas: formData.tipoAlquiler === "salon" ? 0 : Number(formData.cantidadSillas),
                cantidad_sillas: formData.tipoAlquiler === "salon" ? 0 : Number(formData.cantidadSillas),
                valorHora: valorHoraFijo,
            };

            const res = await api.post("/alquileres", payload);
            const idGenerado = res.data?.id;

            setSuccess(
                idGenerado
                    ? `¡Reserva creada exitosamente por ${calculoReserva.horas} horas! Radicado: #${idGenerado}`
                    : "¡Reserva creada exitosamente!",
            );

            setFormData(prev => ({
                ...prev,
                descripcion: "",
                horaInicio: "",
                horaFin: "",
                cantidadSillas: 10,
            }));

            // Refrescar ocupación e historial
            consultarOcupacion(formData.fechaEvento);
            fetchHistorial();
        } catch (err) {
            console.error("Error al crear alquiler:", err);
            const serverMsg =
                err.response?.data?.error ||
                err.response?.data?.message ||
                (Array.isArray(err.response?.data?.errors) ? err.response.data.errors[0]?.msg : null) ||
                "Error al radicar la reserva. Verifica los datos ingresados.";
            setError(serverMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <NavbarApp onLogout={handleLogout} />

            <div className="alquiler-page">
                <div className="alquiler-container">
                    {/* Encabezado Original */}
                    <header className="alquiler-header">
                        <span className="alquiler-badge">Zonas Comunes</span>
                        <h1>Alquiler de Salón Comunal</h1>
                        <p className="alquiler-subtitle">
                            Reserva el salón social y silletería por horas para tus reuniones familiares en Casa Blanca.
                        </p>
                    </header>

                    {/* Banners de notificación */}
                    {success && (
                        <div className="alert-banner alert-success">
                            <CheckCircle size={18} />
                            <span>{success}</span>
                            <button type="button" className="alert-close" onClick={() => setSuccess("")}>
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="alert-banner alert-error">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                            <button type="button" className="alert-close" onClick={() => setError("")}>
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Grid Principal en 2 columnas */}
                    <div className="alquiler-main-grid">
                        {/* Formulario de Reserva */}
                        <section className="alquiler-card form-card">
                            <div className="card-header">
                                <div className="header-title-group">
                                    <Calendar className="header-icon" size={20} />
                                    <h2>Nueva Solicitud de Reserva</h2>
                                </div>
                                <span className="step-indicator">10:00 a.m. – 7:00 p.m.</span>
                            </div>

                            <form onSubmit={handleSubmit} className="alquiler-form">
                                {/* 1. Apartamento Solicitante */}
                                <div className="form-group">
                                    <label className="input-label">
                                        Apartamento Solicitante (Asignación Automática)
                                    </label>
                                    <div className="input-with-icon-static">
                                        <Building size={17} className="field-inner-icon" />
                                        <input
                                            type="text"
                                            className="form-input locked with-icon destaque-apto"
                                            value={
                                                loadingApto
                                                    ? "Cargando apartamento asignado..."
                                                    : apartamentoAsociado
                                                      ? `Apto ${apartamentoAsociado.numero} — Torre ${apartamentoAsociado.bloque_nombre || apartamentoAsociado.bloque || "A"} (Int. ${apartamentoAsociado.interior || "1"})`
                                                      : "Unidad Residencial Activa"
                                            }
                                            disabled
                                        />
                                    </div>
                                    <span className="field-hint">
                                        Asociado automáticamente a tu cuenta de propietario en Casa Blanca.
                                    </span>
                                </div>

                                {/* 2. Selector de Tipo de Alquiler */}
                                <div className="form-group">
                                    <label className="input-label">Tipo de Alquiler</label>
                                    <div className="tipo-alquiler-selector">
                                        {TIPOS_RESERVA.map(tipo => {
                                            const IconComponent = tipo.icon;
                                            const isSelected = formData.tipoAlquiler === tipo.id;
                                            return (
                                                <button
                                                    type="button"
                                                    key={tipo.id}
                                                    className={`btn-tipo-alquiler ${isSelected ? "selected" : ""}`}
                                                    onClick={() => {
                                                        setFormData({ ...formData, tipoAlquiler: tipo.id });
                                                        limpiarSeleccionHorario();
                                                    }}
                                                >
                                                    <IconComponent size={18} />
                                                    <div className="tipo-alquiler-text">
                                                        <strong>{tipo.label}</strong>
                                                        <small>{tipo.desc}</small>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 3. Cantidad de Sillas si aplica */}
                                {(formData.tipoAlquiler === "sillas" || formData.tipoAlquiler === "ambos") && (
                                    <div className="form-group">
                                        <label className="input-label" htmlFor="cantidadSillas">
                                            Cantidad de Sillas Requeridas <span className="required">*</span>
                                        </label>
                                        <div className="input-with-icon-static">
                                            <Armchair size={17} className="field-inner-icon" />
                                            <input
                                                id="cantidadSillas"
                                                type="number"
                                                min="1"
                                                max={tarifas.totalSillas}
                                                className="form-input with-icon"
                                                value={formData.cantidadSillas}
                                                onChange={e => {
                                                    const val = Number(e.target.value);
                                                    setFormData({
                                                        ...formData,
                                                        cantidadSillas: Math.min(val, tarifas.totalSillas),
                                                    });
                                                }}
                                                required
                                            />
                                        </div>
                                        <span className="field-hint">
                                            Stock total del conjunto: {tarifas.totalSillas} sillas registradas en
                                            inventario.
                                        </span>
                                    </div>
                                )}

                                {/* 4. Descripción del Evento */}
                                <div className="form-group">
                                    <label className="input-label" htmlFor="descripcion">
                                        Descripción o Motivo del Evento <span className="required">*</span>
                                    </label>
                                    <textarea
                                        id="descripcion"
                                        rows={3}
                                        maxLength={500}
                                        placeholder="Ej. Celebración de cumpleaños familiar, reunión de copropietarios..."
                                        className="form-input textarea"
                                        value={formData.descripcion}
                                        onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* 5. Fecha del Evento */}
                                <div className="form-group">
                                    <label className="input-label" htmlFor="fechaEvento">
                                        Fecha del Evento <span className="required">*</span>
                                    </label>
                                    <div className="input-with-icon-static">
                                        <Calendar size={17} className="field-inner-icon" />
                                        <input
                                            id="fechaEvento"
                                            type="date"
                                            min={todayDateString}
                                            className="form-input with-icon"
                                            value={formData.fechaEvento}
                                            onChange={e => {
                                                setFormData({ ...formData, fechaEvento: e.target.value });
                                                limpiarSeleccionHorario();
                                            }}
                                            required
                                        />
                                    </div>
                                    <span className="field-hint">
                                        Horario oficial de eventos: 10:00 a.m. a 7:00 p.m.
                                    </span>
                                </div>

                                {/* 6. SELECTOR DINÁMICO DE MULTI-HORAS (10:00 AM - 7:00 PM) */}
                                <div className="form-group" style={{ marginTop: "0.25rem" }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: "0.45rem",
                                        }}
                                    >
                                        <label className="input-label" style={{ margin: 0 }}>
                                            Selecciona las Horas de tu Reserva <span className="required">*</span>
                                        </label>
                                        {formData.horaInicio && (
                                            <button
                                                type="button"
                                                onClick={limpiarSeleccionHorario}
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    color: "#8c3200",
                                                    fontSize: "0.78rem",
                                                    fontWeight: 700,
                                                    cursor: "pointer",
                                                    textDecoration: "underline",
                                                }}
                                            >
                                                Reiniciar selección
                                            </button>
                                        )}
                                    </div>

                                    <p style={{ fontSize: "0.78rem", color: "#735340", margin: "0 0 0.65rem 0" }}>
                                        💡{" "}
                                        <em>
                                            Tip: Haz clic en la <strong>hora inicial</strong> y luego en la{" "}
                                            <strong>hora final</strong> para seleccionar 2, 3 o más horas consecutivas.
                                        </em>
                                    </p>

                                    {/* Cuadrícula interactiva */}
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                                            gap: "0.55rem",
                                        }}
                                    >
                                        {BLOQUES_HORARIOS.map(bloque => {
                                            const ocupado = esBloqueOcupado(bloque);

                                            // Bloque seleccionado dentro del rango
                                            const seleccionado =
                                                formData.horaInicio &&
                                                formData.horaFin &&
                                                bloque.inicio >= formData.horaInicio &&
                                                bloque.fin <= formData.horaFin;

                                            return (
                                                <button
                                                    type="button"
                                                    key={bloque.id}
                                                    disabled={ocupado}
                                                    onClick={() => handleSelectBloque(bloque)}
                                                    style={{
                                                        padding: "0.7rem 0.5rem",
                                                        borderRadius: "10px",
                                                        border: ocupado
                                                            ? "1.5px solid #fca5a5"
                                                            : seleccionado
                                                              ? "2px solid #8c3200"
                                                              : "1.5px solid #ebdcd0",
                                                        background: ocupado
                                                            ? "#fee2e2"
                                                            : seleccionado
                                                              ? "#8c3200"
                                                              : "#ffffff",
                                                        color: ocupado
                                                            ? "#991b1b"
                                                            : seleccionado
                                                              ? "#ffffff"
                                                              : "#2c1203",
                                                        cursor: ocupado ? "not-allowed" : "pointer",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "center",
                                                        gap: "3px",
                                                        transition: "all 0.18s ease",
                                                        boxShadow: seleccionado
                                                            ? "0 4px 14px rgba(140, 50, 0, 0.25)"
                                                            : "none",
                                                        opacity: ocupado ? 0.75 : 1,
                                                    }}
                                                >
                                                    <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                                                        {bloque.inicio} – {bloque.fin}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: "0.7rem",
                                                            fontWeight: 600,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "4px",
                                                            color: ocupado
                                                                ? "#991b1b"
                                                                : seleccionado
                                                                  ? "#ffd0a0"
                                                                  : "#166534",
                                                        }}
                                                    >
                                                        {ocupado ? (
                                                            <>
                                                                <Ban size={11} />
                                                                <span>Ocupado</span>
                                                            </>
                                                        ) : seleccionado ? (
                                                            <>
                                                                <Check size={12} />
                                                                <span>Seleccionado</span>
                                                            </>
                                                        ) : (
                                                            <span>Disponible</span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Resumen dinámico del rango horario */}
                                    {formData.horaInicio && formData.horaFin && (
                                        <div
                                            style={{
                                                marginTop: "0.75rem",
                                                padding: "0.75rem 1rem",
                                                background: "#fdf8f4",
                                                border: "1.5px solid #ffd0a0",
                                                borderRadius: "10px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                flexWrap: "wrap",
                                                gap: "0.5rem",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    color: "#8c3200",
                                                }}
                                            >
                                                <Clock size={17} />
                                                <span style={{ fontSize: "0.88rem" }}>
                                                    Horario:{" "}
                                                    <strong>
                                                        {formData.horaInicio} a {formData.horaFin}
                                                    </strong>{" "}
                                                    ({calculoReserva.horas}{" "}
                                                    {calculoReserva.horas === 1 ? "hora" : "horas"} continuas)
                                                </span>
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: "0.82rem",
                                                    fontWeight: 800,
                                                    color: "#166534",
                                                    background: "#dcfce7",
                                                    padding: "3px 10px",
                                                    borderRadius: "20px",
                                                }}
                                            >
                                                ✓ Rango Válido
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Aviso de error en el horario si aplica */}
                                {calculoReserva.error && (
                                    <div className="field-error-notice">
                                        <AlertCircle size={15} />
                                        <span>{calculoReserva.error}</span>
                                    </div>
                                )}

                                {/* 7. Campo Valor por Hora FIJO (Solo lectura / Bloqueado) */}
                                <div className="form-group">
                                    <label className="input-label" htmlFor="valorHora">
                                        Valor por Hora ($ COP) — Tarifa Oficial
                                    </label>
                                    <div className="input-with-icon-static">
                                        <DollarSign size={17} className="field-inner-icon" />
                                        <input
                                            id="valorHora"
                                            type="text"
                                            className="form-input locked with-icon"
                                            value={`$ ${valorHoraFijo.toLocaleString("es-CO")} COP / hora`}
                                            readOnly
                                            disabled
                                        />
                                    </div>
                                    <span className="field-hint">
                                        {formData.tipoAlquiler === "salon" &&
                                            "Tarifa fija por hora estipulada para el Salón Comunal."}
                                        {formData.tipoAlquiler === "sillas" &&
                                            "Tarifa fija por hora estipulada para el préstamo de Sillas."}
                                        {formData.tipoAlquiler === "ambos" &&
                                            `Tarifa combinada oficial: Salón ($${tarifas.valorHoraSalon.toLocaleString("es-CO")}) + Sillas ($${tarifas.valorHoraSillas.toLocaleString("es-CO")}).`}
                                    </span>
                                </div>

                                {/* Resumen dinámico del cálculo */}
                                {calculoReserva.horas > 0 && !calculoReserva.error && (
                                    <div className="calculation-box">
                                        <div className="calc-item">
                                            <Clock size={16} />
                                            <span>
                                                Duración:{" "}
                                                <strong>
                                                    {calculoReserva.horas}{" "}
                                                    {calculoReserva.horas === 1 ? "hora" : "horas"}
                                                </strong>
                                            </span>
                                        </div>
                                        <div className="calc-divider"></div>
                                        <div className="calc-item">
                                            <DollarSign size={16} />
                                            <span>
                                                Total:{" "}
                                                <strong>${calculoReserva.total.toLocaleString("es-CO")} COP</strong>
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        className="btn-submit-alquiler"
                                        disabled={
                                            loading ||
                                            !formData.horaInicio ||
                                            !formData.horaFin ||
                                            !!calculoReserva.error
                                        }
                                    >
                                        <Send size={16} />
                                        <span>{loading ? "Procesando reserva..." : "Radicar Reserva"}</span>
                                    </button>
                                </div>
                            </form>
                        </section>

                        {/* Columna Lateral de Normas y Política 24h */}
                        <aside className="alquiler-info-column">
                            <div className="alquiler-card info-card">
                                <div className="card-header">
                                    <div className="header-title-group">
                                        <Info className="header-icon" size={20} />
                                        <h3>Recomendaciones de Uso</h3>
                                    </div>
                                </div>
                                <ul className="info-tips-list">
                                    <li>
                                        <span className="tip-dot"></span>
                                        <div>
                                            <strong>Horario permitido estricto</strong>
                                            <p>
                                                El salón comunal y las sillas se alquilan exclusivamente entre las{" "}
                                                <strong>10:00 a.m. y las 7:00 p.m.</strong>
                                            </p>
                                        </div>
                                    </li>
                                    <li>
                                        <span className="tip-dot"></span>
                                        <div>
                                            <strong>Alquiler por horas en el mismo día</strong>
                                            <p>
                                                Las reservas se realizan para una jornada única. Puedes seleccionar 1,
                                                2, 3 o más horas continuas.
                                            </p>
                                        </div>
                                    </li>
                                    <li>
                                        <span className="tip-dot"></span>
                                        <div>
                                            <strong>Cuidado del mobiliario</strong>
                                            <p>
                                                Las mesas y sillas deben entregarse limpias y en perfecto estado al
                                                finalizar las horas reservadas.
                                            </p>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            {/* Política 24 Horas */}
                            <div className="alquiler-card policy-card">
                                <div className="card-header">
                                    <div className="header-title-group">
                                        <Clock className="header-icon" size={18} />
                                        <h3>Plazo de Cancelación</h3>
                                    </div>
                                </div>
                                <div className="policy-content">
                                    <div className="policy-highlight-box">
                                        <strong>Mínimo 24 horas de anticipación</strong>
                                        <p>
                                            Para anular una reserva, debes hacerlo con al menos 24 horas de antelación a
                                            la hora de inicio fijada.
                                        </p>
                                    </div>
                                    <p className="policy-note">
                                        Si faltan menos de 24 horas para el evento, el sistema bloqueará la cancelación
                                        automáticamente.
                                    </p>
                                </div>
                            </div>
                        </aside>
                    </div>

                    {/* Historial de Alquileres con FILTRO POR FECHAS */}
                    <section className="alquiler-card table-card">
                        <div className="table-toolbar">
                            <div>
                                <h2>Mis Reservas Realizadas</h2>
                                <p className="table-subtitle">
                                    Historial y seguimiento a tus alquileres de salón comunal y silletería.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="btn-refresh"
                                onClick={fetchHistorial}
                                title="Actualizar reservas"
                            >
                                <RotateCw size={16} className={loadingHistorial ? "spinning" : ""} />
                            </button>
                        </div>

                        {/* Barra de Filtros */}
                        <div className="table-filters-container">
                            <div className="time-filter-tabs">
                                {[
                                    { id: "todas", label: "Todas" },
                                    { id: "proximas", label: "Próximas" },
                                    { id: "pasadas", label: "Pasadas" },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        className={`time-tab-btn ${filtroTiempo === tab.id ? "active" : ""}`}
                                        onClick={() => setFiltroTiempo(tab.id)}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="date-range-filter-group">
                                <div className="date-input-wrapper">
                                    <label className="filter-label">Desde:</label>
                                    <input
                                        type="date"
                                        className="filter-date-input"
                                        value={fechaDesde}
                                        onChange={e => setFechaDesde(e.target.value)}
                                    />
                                </div>

                                <div className="date-input-wrapper">
                                    <label className="filter-label">Hasta:</label>
                                    <input
                                        type="date"
                                        className="filter-date-input"
                                        value={fechaHasta}
                                        min={fechaDesde}
                                        onChange={e => setFechaHasta(e.target.value)}
                                    />
                                </div>

                                <div className="table-search-box">
                                    <Search size={14} className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Buscar evento..."
                                        className="filter-search-input"
                                        value={busqueda}
                                        onChange={e => setBusqueda(e.target.value)}
                                    />
                                    {busqueda && (
                                        <button type="button" className="clear-btn" onClick={() => setBusqueda("")}>
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>

                                {hayFiltrosActivos && (
                                    <button
                                        type="button"
                                        className="btn-clear-filters"
                                        onClick={limpiarFiltros}
                                        title="Restablecer filtros"
                                    >
                                        <X size={14} />
                                        <span>Limpiar</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Tabla */}
                        {loadingHistorial ? (
                            <div className="empty-state">
                                <RotateCw className="spinning" size={32} />
                                <p>Cargando historial de alquileres...</p>
                            </div>
                        ) : historialFiltrado.length === 0 ? (
                            <div className="empty-state">
                                <Calendar size={40} className="empty-icon" />
                                <h4>No se encontraron reservas</h4>
                                <p>
                                    {hayFiltrosActivos
                                        ? "No hay reservas que coincidan con las fechas o criterios seleccionados."
                                        : "Aún no tienes solicitudes de alquiler registradas."}
                                </p>
                                {hayFiltrosActivos && (
                                    <button type="button" className="btn-reset-empty" onClick={limpiarFiltros}>
                                        Ver todas las reservas
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="alquiler-table">
                                    <thead>
                                        <tr>
                                            <th>Radicado</th>
                                            <th>Tipo</th>
                                            <th>Descripción / Evento</th>
                                            <th>Fecha</th>
                                            <th>Horario</th>
                                            <th>Valor / Hora</th>
                                            <th>Estado</th>
                                            <th style={{ textAlign: "right" }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historialFiltrado.map(item => {
                                            const evalCancel = evaluarCancelacion(item.hora_inicio, item.estado);
                                            const fechaInicio = item.hora_inicio ? new Date(item.hora_inicio) : null;
                                            const fechaFin = item.hora_fin ? new Date(item.hora_fin) : null;

                                            let horasDuracion = 0;
                                            if (fechaInicio && fechaFin) {
                                                horasDuracion =
                                                    Math.round(((fechaFin - fechaInicio) / (1000 * 60 * 60)) * 10) / 10;
                                            }

                                            return (
                                                <tr key={item.id}>
                                                    <td className="cell-id">
                                                        <span className="id-badge">#{item.id}</span>
                                                    </td>
                                                    <td>
                                                        <span className="tipo-badge">
                                                            {item.tipo_alquiler === "ambos"
                                                                ? "Salón + Sillas"
                                                                : item.tipo_alquiler === "sillas"
                                                                  ? "Sillas"
                                                                  : "Salón"}
                                                        </span>
                                                        {item.cantidad_sillas_alquiladas > 0 && (
                                                            <div
                                                                style={{
                                                                    fontSize: "0.74rem",
                                                                    color: "#8c3200",
                                                                    fontWeight: "bold",
                                                                }}
                                                            >
                                                                {item.cantidad_sillas_alquiladas} sillas
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="cell-desc">
                                                        <strong>{item.descripcion}</strong>
                                                    </td>
                                                    <td className="cell-date">
                                                        {fechaInicio
                                                            ? fechaInicio.toLocaleDateString("es-CO", {
                                                                  day: "numeric",
                                                                  month: "short",
                                                                  year: "numeric",
                                                              })
                                                            : "-"}
                                                    </td>
                                                    <td className="cell-date">
                                                        {fechaInicio && fechaFin ? (
                                                            <span>
                                                                {fechaInicio.toLocaleTimeString("es-CO", {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                                {" – "}
                                                                {fechaFin.toLocaleTimeString("es-CO", {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                                <small className="duration-tag">
                                                                    {horasDuracion} hrs
                                                                </small>
                                                            </span>
                                                        ) : (
                                                            "-"
                                                        )}
                                                    </td>
                                                    <td className="cell-valor">
                                                        ${parseFloat(item.valor_hora || 50000).toLocaleString("es-CO")}
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`status-pill ${item.estado?.toLowerCase() || "reservado"}`}
                                                        >
                                                            {item.estado || "Reservado"}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: "right" }}>
                                                        <div
                                                            style={{
                                                                display: "inline-flex",
                                                                gap: "8px",
                                                                alignItems: "center",
                                                                justifyContent: "flex-end",
                                                            }}
                                                        >
                                                            <BotonReporte
                                                                endpoint={`/reportes/residente/comprobante-reserva-pdf/${item.id}`}
                                                                nombreArchivo={`Comprobante_Reserva_${item.id}.pdf`}
                                                                texto="Comprobante"
                                                                className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
                                                            />
                                                            {evalCancel.cancelable ? (
                                                                <button
                                                                    type="button"
                                                                    className="btn-cancelar-reserva"
                                                                    onClick={() => setReservaACancelar(item)}
                                                                    title={`Faltan ${evalCancel.horasRestantes}h para el evento`}
                                                                >
                                                                    <Trash2 size={14} />
                                                                    <span>Cancelar</span>
                                                                </button>
                                                            ) : (
                                                                <span
                                                                    className="badge-no-cancelable"
                                                                    title={evalCancel.texto}
                                                                >
                                                                    {evalCancel.texto}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>

                {/* Modal de Confirmación de Cancelación */}
                {reservaACancelar && (
                    <div className="modal-overlay" onClick={() => !cancelando && setReservaACancelar(null)}>
                        <div className="modal-card" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <div className="modal-title-with-icon">
                                    <AlertTriangle className="modal-warn-icon" size={22} />
                                    <h3>Confirmar Cancelación de Reserva</h3>
                                </div>
                                <button
                                    type="button"
                                    className="modal-close-btn"
                                    onClick={() => !cancelando && setReservaACancelar(null)}
                                    disabled={cancelando}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="modal-body">
                                <p>
                                    ¿Estás seguro de cancelar tu reserva <strong>#{reservaACancelar.id}</strong> para el
                                    evento <em>"{reservaACancelar.descripcion}"</em>?
                                </p>
                                <div className="cancel-notice-box">
                                    <Info size={16} />
                                    <span>
                                        Cumples con el requisito de más de 24 horas de antelación. Esta acción liberará
                                        el espacio en la fecha programada.
                                    </span>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn-modal-back"
                                    onClick={() => setReservaACancelar(null)}
                                    disabled={cancelando}
                                >
                                    Volver
                                </button>
                                <button
                                    type="button"
                                    className="btn-modal-confirm-delete"
                                    onClick={handleConfirmarCancelacion}
                                    disabled={cancelando}
                                >
                                    {cancelando ? "Cancelando..." : "Sí, Cancelar Reserva"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <Footer />
            </div>
        </>
    );
}

export default Alquiler;
