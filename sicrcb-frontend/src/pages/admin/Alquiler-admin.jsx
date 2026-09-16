import {
    Armchair,
    Building,
    CalendarCheck,
    CalendarDays,
    Check,
    CheckCircle2,
    Clock,
    DollarSign,
    RotateCw,
    Save,
    Search,
    X,
    XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/css/alquiler-admin.css";
import "../../assets/css/styles.css";
import BotonReporte from "../../components/BotonReporte.jsx";
import Footer from "../../components/Footer.jsx";
import NavbarApp from "../../components/NavbarApp.jsx";
import api from "../../services/api.js";

function AlquilerAdmin() {
    const navigate = useNavigate();
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("pendiente");
    const [procesando, setProcesando] = useState(null);
    const [busqueda, setBusqueda] = useState("");

    // Modal de confirmación para Aprobar / Rechazar
    const [confirmacionModal, setConfirmacionModal] = useState(null);

    // Configuración de tarifas oficiales e inventario de sillas
    const [configAdmin, setConfigAdmin] = useState({
        valorHoraSalon: 50000,
        valorHoraSillas: 20000,
        totalSillas: 120,
    });
    const [guardandoConfig, setGuardandoConfig] = useState(false);
    const [configMsg, setConfigMsg] = useState({ error: "", success: "" });

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const normalizeSolicitudes = payload => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.solicitudes)) return payload.solicitudes;
        if (Array.isArray(payload?.reservas)) return payload.reservas;
        return [];
    };

    const fetchSolicitudes = async () => {
        setLoading(true);
        try {
            const res = await api.get("/alquileres");
            setSolicitudes(normalizeSolicitudes(res.data));
        } catch (err) {
            console.error("Error al cargar solicitudes:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchConfiguracion = async () => {
        try {
            const res = await api.get("/alquileres/configuracion");
            if (res.data) {
                setConfigAdmin({
                    valorHoraSalon: Number(res.data.valorHoraSalon) || 50000,
                    valorHoraSillas: Number(res.data.valorHoraSillas) || 20000,
                    totalSillas: Number(res.data.totalSillas) || 120,
                });
            }
        } catch (err) {
            console.error("Error al cargar tarifas:", err);
        }
    };

    useEffect(() => {
        fetchSolicitudes();
        fetchConfiguracion();
    }, []);

    const handleGuardarConfig = async e => {
        e.preventDefault();
        setGuardandoConfig(true);
        setConfigMsg({ error: "", success: "" });

        try {
            await api.put("/alquileres/configuracion", {
                valorHoraSalon: configAdmin.valorHoraSalon,
                valorHoraSillas: configAdmin.valorHoraSillas,
                totalSillas: configAdmin.totalSillas,
            });
            setConfigMsg({
                error: "",
                success: "¡Tarifas e inventario actualizados con éxito!",
            });
            setTimeout(() => setConfigMsg({ error: "", success: "" }), 4000);
        } catch (err) {
            console.error("Error al guardar tarifas:", err);
            setConfigMsg({
                error: err.response?.data?.error || "Error al actualizar la configuración.",
                success: "",
            });
        } finally {
            setGuardandoConfig(false);
        }
    };

    const actualizarEstado = async (id, nuevoEstado) => {
        try {
            setProcesando(id);
            await api.put(`/alquileres/${id}`, { estado: nuevoEstado });
            setSolicitudes(prev => prev.map(s => (s.id === id ? { ...s, estado: nuevoEstado } : s)));
        } catch (err) {
            console.error("Error al actualizar estado:", err);
        } finally {
            setProcesando(null);
        }
    };

    const stats = useMemo(
        () => ({
            todas: solicitudes.length,
            pendiente: solicitudes.filter(
                s => (s.estado || "").toLowerCase() === "pendiente" || (s.estado || "").toLowerCase() === "reservado",
            ).length,
            aprobada: solicitudes.filter(
                s => (s.estado || "").toLowerCase() === "aprobada" || (s.estado || "").toLowerCase() === "confirmado",
            ).length,
            rechazada: solicitudes.filter(
                s => (s.estado || "").toLowerCase() === "rechazada" || (s.estado || "").toLowerCase() === "cancelado",
            ).length,
        }),
        [solicitudes],
    );

    const solicitudesFiltradas = solicitudes
        .filter(s => {
            const est = (s.estado || "").toLowerCase();
            if (activeTab === "todas") return true;
            if (activeTab === "pendiente") return est === "pendiente" || est === "reservado";
            if (activeTab === "aprobada") return est === "aprobada" || est === "confirmado";
            if (activeTab === "rechazada") return est === "rechazada" || est === "cancelado";
            return true;
        })
        .filter(s => {
            const q = busqueda.trim().toLowerCase();
            if (!q) return true;
            const residente = `${s.nombre_propietario || ""} ${s.apellido_propietario || ""}`.toLowerCase();
            const desc = (s.descripcion || "").toLowerCase();
            return residente.includes(q) || desc.includes(q);
        });

    return (
        <div className="alquiler-page">
            <NavbarApp onLogout={handleLogout} />

            <main className="alquiler-main-container">
                {/* Banner Superior */}
                <section className="sicrcb-alq-hero">
                    <div className="alq-hero-text">
                        <h1>
                            <span>Administración de Alquileres y Salón Social</span>
                            <CalendarCheck size={26} stroke="#FFD0A0" />
                        </h1>
                        <p>
                            Control de tarifas oficiales por hora (Salón y Sillas), stock de mobiliario y aprobación de
                            solicitudes.
                        </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <BotonReporte
                            endpoint="/reportes/admin/alquileres-pdf"
                            nombreArchivo="Reporte_Alquileres_Casa_Blanca.pdf"
                            texto="Generar Reporte Alquileres"
                            className="btn btn-warning d-inline-flex align-items-center gap-2 shadow-sm fw-bold text-dark"
                        />
                        <div className="alq-hero-badge">
                            <Clock size={16} stroke="#FFD0A0" />
                            <span>{stats.pendiente} Solicitudes Pendientes</span>
                        </div>
                    </div>
                </section>

                {/* PANEL ADMINISTRATIVO LIMPIO (Sin notas técnicas de BD) */}
                <section
                    className="sicrcb-alq-table-card"
                    style={{
                        marginBottom: "2rem",
                        padding: "1.75rem",
                        border: "1px solid var(--alq-border)",
                        background: "#ffffff",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "1rem",
                            marginBottom: "1.25rem",
                            borderBottom: "1px solid rgba(140, 50, 0, 0.1)",
                            paddingBottom: "0.75rem",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <Building size={22} color="#8c3200" />
                            <div>
                                <h3 style={{ margin: 0, color: "#8c3200", fontSize: "1.1rem", fontWeight: 800 }}>
                                    Parámetros Oficiales: Tarifas por Hora e Inventario Físico
                                </h3>
                                <small style={{ color: "#735340", fontSize: "0.85rem" }}>
                                    Configura las tarifas oficiales por hora y el total de sillas disponibles para los
                                    residentes.
                                </small>
                            </div>
                        </div>

                        {configMsg.success && (
                            <span
                                style={{
                                    background: "#dcfce7",
                                    color: "#166534",
                                    padding: "0.35rem 0.85rem",
                                    borderRadius: "20px",
                                    fontSize: "0.82rem",
                                    fontWeight: 700,
                                }}
                            >
                                ✓ {configMsg.success}
                            </span>
                        )}
                        {configMsg.error && (
                            <span
                                style={{
                                    background: "#fee2e2",
                                    color: "#991b1b",
                                    padding: "0.35rem 0.85rem",
                                    borderRadius: "20px",
                                    fontSize: "0.82rem",
                                    fontWeight: 700,
                                }}
                            >
                                ⚠ {configMsg.error}
                            </span>
                        )}
                    </div>

                    <form
                        onSubmit={handleGuardarConfig}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr)) auto",
                            gap: "1.25rem",
                            alignItems: "flex-end",
                        }}
                    >
                        {/* 1. Hora Salón Comunal */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                    color: "#2c1203",
                                    marginBottom: "0.4rem",
                                }}
                            >
                                <DollarSign
                                    size={14}
                                    style={{ display: "inline", verticalAlign: "middle", color: "#8c3200" }}
                                />{" "}
                                Hora Salón Comunal ($ COP)
                            </label>
                            <input
                                type="number"
                                step="1000"
                                min="1000"
                                value={configAdmin.valorHoraSalon}
                                onChange={e => setConfigAdmin({ ...configAdmin, valorHoraSalon: e.target.value })}
                                style={{
                                    width: "100%",
                                    padding: "0.65rem 0.9rem",
                                    borderRadius: "8px",
                                    border: "1.5px solid #ebdcd0",
                                    fontSize: "0.95rem",
                                    fontWeight: 700,
                                    color: "#8c3200",
                                    backgroundColor: "#ffffff",
                                    boxSizing: "border-box",
                                }}
                                required
                            />
                        </div>

                        {/* 2. Hora Sillas */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                    color: "#2c1203",
                                    marginBottom: "0.4rem",
                                }}
                            >
                                <DollarSign
                                    size={14}
                                    style={{ display: "inline", verticalAlign: "middle", color: "#8c3200" }}
                                />{" "}
                                Hora Préstamo Sillas ($ COP)
                            </label>
                            <input
                                type="number"
                                step="1000"
                                min="1000"
                                value={configAdmin.valorHoraSillas}
                                onChange={e => setConfigAdmin({ ...configAdmin, valorHoraSillas: e.target.value })}
                                style={{
                                    width: "100%",
                                    padding: "0.65rem 0.9rem",
                                    borderRadius: "8px",
                                    border: "1.5px solid #ebdcd0",
                                    fontSize: "0.95rem",
                                    fontWeight: 700,
                                    color: "#8c3200",
                                    backgroundColor: "#ffffff",
                                    boxSizing: "border-box",
                                }}
                                required
                            />
                        </div>

                        {/* 3. Stock Total de Sillas */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                    color: "#2c1203",
                                    marginBottom: "0.4rem",
                                }}
                            >
                                <Armchair
                                    size={14}
                                    style={{ display: "inline", verticalAlign: "middle", color: "#8c3200" }}
                                />{" "}
                                Stock Total de Sillas
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={configAdmin.totalSillas}
                                onChange={e => setConfigAdmin({ ...configAdmin, totalSillas: e.target.value })}
                                style={{
                                    width: "100%",
                                    padding: "0.65rem 0.9rem",
                                    borderRadius: "8px",
                                    border: "1.5px solid #ebdcd0",
                                    fontSize: "0.95rem",
                                    fontWeight: 700,
                                    color: "#8c3200",
                                    backgroundColor: "#ffffff",
                                    boxSizing: "border-box",
                                }}
                                required
                            />
                        </div>

                        {/* Botón Guardar */}
                        <button
                            type="submit"
                            disabled={guardandoConfig}
                            style={{
                                background: "linear-gradient(135deg, #8c3200 0%, #f47820 100%)",
                                color: "#ffffff",
                                border: "none",
                                padding: "0.75rem 1.4rem",
                                borderRadius: "8px",
                                fontWeight: 700,
                                fontSize: "0.9rem",
                                cursor: "pointer",
                                height: "42px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                boxShadow: "0 4px 14px rgba(140, 50, 0, 0.2)",
                            }}
                        >
                            {guardandoConfig ? (
                                <>
                                    <RotateCw size={15} className="spinning" />
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={15} />
                                    <span>Guardar Parámetros</span>
                                </>
                            )}
                        </button>
                    </form>
                </section>

                {/* KPIs y Filtros de Estado */}
                <section className="sicrcb-alq-kpis">
                    <div
                        className={`alq-kpi-card ${activeTab === "todas" ? "active" : ""}`}
                        onClick={() => setActiveTab("todas")}
                    >
                        <div className="alq-kpi-icon">
                            <CalendarDays size={22} />
                        </div>
                        <div className="alq-kpi-data">
                            <span className="alq-kpi-label">Total Solicitudes</span>
                            <span className="alq-kpi-val">{stats.todas}</span>
                        </div>
                    </div>

                    <div
                        className={`alq-kpi-card ${activeTab === "pendiente" ? "active" : ""}`}
                        onClick={() => setActiveTab("pendiente")}
                    >
                        <div className="alq-kpi-icon warning">
                            <Clock size={22} />
                        </div>
                        <div className="alq-kpi-data">
                            <span className="alq-kpi-label">Pendientes</span>
                            <span className="alq-kpi-val">{stats.pendiente}</span>
                        </div>
                    </div>

                    <div
                        className={`alq-kpi-card ${activeTab === "aprobada" ? "active" : ""}`}
                        onClick={() => setActiveTab("aprobada")}
                    >
                        <div className="alq-kpi-icon success">
                            <CheckCircle2 size={22} />
                        </div>
                        <div className="alq-kpi-data">
                            <span className="alq-kpi-label">Aprobadas</span>
                            <span className="alq-kpi-val">{stats.aprobada}</span>
                        </div>
                    </div>

                    <div
                        className={`alq-kpi-card ${activeTab === "rechazada" ? "active" : ""}`}
                        onClick={() => setActiveTab("rechazada")}
                    >
                        <div className="alq-kpi-icon danger">
                            <XCircle size={22} />
                        </div>
                        <div className="alq-kpi-data">
                            <span className="alq-kpi-label">Rechazadas</span>
                            <span className="alq-kpi-val">{stats.rechazada}</span>
                        </div>
                    </div>
                </section>

                {/* Tabla de Reservas */}
                <div className="sicrcb-alq-table-card">
                    <div className="alq-toolbar">
                        <span style={{ fontWeight: 800, color: "#8C3200", fontSize: "1.05rem" }}>
                            Listado de Reservas ({activeTab.toUpperCase()})
                        </span>

                        <div className="alq-table-search">
                            <Search size={16} className="alq-search-icon" />
                            <input
                                type="text"
                                placeholder="Buscar por residente o motivo..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="sicrcb-table-responsive">
                        <table className="sicrcb-data-table">
                            <thead>
                                <tr>
                                    <th>Residente / Solicitante</th>
                                    <th>Espacio / Mobiliario</th>
                                    <th>Fecha y Horario</th>
                                    <th>Tarifa Aplicada</th>
                                    <th>Estado</th>
                                    <th style={{ textAlign: "right" }}>Decisión</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: "center", padding: "3rem" }}>
                                            Cargando solicitudes de alquiler...
                                        </td>
                                    </tr>
                                ) : solicitudesFiltradas.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            style={{ textAlign: "center", padding: "3rem", color: "#8C3200" }}
                                        >
                                            No hay solicitudes registradas en esta categoría.
                                        </td>
                                    </tr>
                                ) : (
                                    solicitudesFiltradas.map(s => {
                                        const estado = (s.estado || "pendiente").toLowerCase();
                                        const esPendiente = estado === "pendiente" || estado === "reservado";
                                        return (
                                            <tr key={s.id}>
                                                <td>
                                                    <strong>
                                                        {s.nombre_propietario
                                                            ? `${s.nombre_propietario} ${s.apellido_propietario || ""}`
                                                            : "Residente"}
                                                    </strong>
                                                    <div style={{ fontSize: "0.78rem", color: "#735340" }}>
                                                        {s.descripcion || "Evento social"}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: 600, color: "#8c3200" }}>
                                                        {s.id_salon_comunal && s.cantidad_sillas_alquiladas > 0
                                                            ? `Salón + ${s.cantidad_sillas_alquiladas} Sillas`
                                                            : s.cantidad_sillas_alquiladas > 0
                                                              ? `${s.cantidad_sillas_alquiladas} Sillas`
                                                              : "Salón Comunal"}
                                                    </span>
                                                </td>
                                                <td>
                                                    {s.hora_inicio
                                                        ? new Date(s.hora_inicio).toLocaleString("es-CO", {
                                                              dateStyle: "short",
                                                              timeStyle: "short",
                                                          })
                                                        : "Por confirmar"}
                                                </td>
                                                <td>
                                                    <strong>
                                                        ${Number(s.valor_hora || 50000).toLocaleString("es-CO")} COP/h
                                                    </strong>
                                                </td>
                                                <td>
                                                    <span className={`sicrcb-status-badge status-${estado}`}>
                                                        {s.estado || "Reservado"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div
                                                        className="alq-action-btns"
                                                        style={{ justifyContent: "flex-end" }}
                                                    >
                                                        {esPendiente ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="btn-alq-approve"
                                                                    disabled={procesando === s.id}
                                                                    onClick={() =>
                                                                        setConfirmacionModal({
                                                                            id: s.id,
                                                                            accion: "Confirmado",
                                                                            solicitud: s,
                                                                        })
                                                                    }
                                                                >
                                                                    <Check size={14} />
                                                                    <span>Aprobar</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="btn-alq-reject"
                                                                    disabled={procesando === s.id}
                                                                    onClick={() =>
                                                                        setConfirmacionModal({
                                                                            id: s.id,
                                                                            accion: "Cancelado",
                                                                            solicitud: s,
                                                                        })
                                                                    }
                                                                >
                                                                    <X size={14} />
                                                                    <span>Rechazar</span>
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span
                                                                style={{
                                                                    fontSize: "0.8rem",
                                                                    color: "#735340",
                                                                    fontStyle: "italic",
                                                                }}
                                                            >
                                                                {s.estado}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Modal Elegante de Confirmación para Aprobar / Rechazar Alquiler */}
            {confirmacionModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(44, 18, 3, 0.55)",
                        backdropFilter: "blur(3px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1200,
                        padding: "1rem",
                    }}
                    onClick={() => setConfirmacionModal(null)}
                >
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "18px",
                            padding: "1.75rem",
                            maxWidth: "480px",
                            width: "100%",
                            boxShadow: "0 20px 45px rgba(0, 0, 0, 0.25)",
                            border: `1.5px solid ${confirmacionModal.accion === "Confirmado" ? "#86efac" : "#fca5a5"}`,
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Cabecera con Icono */}
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "1.2rem" }}>
                            <div
                                style={{
                                    width: "44px",
                                    height: "44px",
                                    borderRadius: "12px",
                                    backgroundColor: confirmacionModal.accion === "Confirmado" ? "#f0fdf4" : "#fef2f2",
                                    border: `1.5px solid ${confirmacionModal.accion === "Confirmado" ? "#bbf7d0" : "#fecaca"}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: confirmacionModal.accion === "Confirmado" ? "#16a34a" : "#dc2626",
                                    flexShrink: 0,
                                }}
                            >
                                {confirmacionModal.accion === "Confirmado" ? (
                                    <CheckCircle2 size={24} />
                                ) : (
                                    <XCircle size={24} />
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3
                                    style={{
                                        margin: "0 0 4px 0",
                                        color: "#2C1203",
                                        fontSize: "1.2rem",
                                        fontWeight: "800",
                                    }}
                                >
                                    {confirmacionModal.accion === "Confirmado"
                                        ? "¿Confirmar Aprobación de Reserva?"
                                        : "¿Confirmar Rechazo de Reserva?"}
                                </h3>
                                <p style={{ margin: 0, fontSize: "0.85rem", color: "#735340" }}>
                                    {confirmacionModal.accion === "Confirmado"
                                        ? "El residente tendrá confirmado el espacio y las sillas solicitadas."
                                        : "La solicitud será cancelada y el espacio quedará disponible."}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setConfirmacionModal(null)}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#735340",
                                    padding: 0,
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Ficha Resumen de la Reserva */}
                        <div
                            style={{
                                backgroundColor: "#fcf9f6",
                                border: "1px solid var(--alq-border)",
                                borderRadius: "12px",
                                padding: "1rem",
                                marginBottom: "1.5rem",
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                <span style={{ fontSize: "0.82rem", color: "#735340" }}>Solicitante:</span>
                                <strong style={{ fontSize: "0.88rem", color: "#2C1203" }}>
                                    {confirmacionModal.solicitud?.nombre_propietario
                                        ? `${confirmacionModal.solicitud.nombre_propietario} ${confirmacionModal.solicitud.apellido_propietario || ""}`
                                        : "Residente registrado"}
                                </strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                <span style={{ fontSize: "0.82rem", color: "#735340" }}>Espacio:</span>
                                <span style={{ fontSize: "0.85rem", color: "#8c3200", fontWeight: "700" }}>
                                    {confirmacionModal.solicitud?.id_salon_comunal &&
                                    confirmacionModal.solicitud?.cantidad_sillas_alquiladas > 0
                                        ? `Salón + ${confirmacionModal.solicitud.cantidad_sillas_alquiladas} Sillas`
                                        : confirmacionModal.solicitud?.cantidad_sillas_alquiladas > 0
                                          ? `${confirmacionModal.solicitud.cantidad_sillas_alquiladas} Sillas`
                                          : "Salón Comunal"}
                                </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: "0.82rem", color: "#735340" }}>Fecha y Hora:</span>
                                <strong style={{ fontSize: "0.85rem", color: "#2C1203" }}>
                                    {confirmacionModal.solicitud?.hora_inicio
                                        ? new Date(confirmacionModal.solicitud.hora_inicio).toLocaleString("es-CO", {
                                              dateStyle: "short",
                                              timeStyle: "short",
                                          })
                                        : "Por confirmar"}
                                </strong>
                            </div>
                        </div>

                        {/* Acciones */}
                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                            <button
                                type="button"
                                onClick={() => setConfirmacionModal(null)}
                                style={{
                                    padding: "0.6rem 1.1rem",
                                    borderRadius: "10px",
                                    border: "1.5px solid #d1d5db",
                                    backgroundColor: "#ffffff",
                                    color: "#374151",
                                    fontSize: "0.88rem",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={procesando === confirmacionModal.id}
                                onClick={async () => {
                                    const { id, accion } = confirmacionModal;
                                    setConfirmacionModal(null);
                                    await actualizarEstado(id, accion);
                                }}
                                style={{
                                    padding: "0.6rem 1.25rem",
                                    borderRadius: "10px",
                                    border: "none",
                                    backgroundColor: confirmacionModal.accion === "Confirmado" ? "#16a34a" : "#dc2626",
                                    color: "#ffffff",
                                    fontSize: "0.88rem",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    boxShadow:
                                        confirmacionModal.accion === "Confirmado"
                                            ? "0 4px 12px rgba(22, 163, 74, 0.3)"
                                            : "0 4px 12px rgba(220, 38, 38, 0.3)",
                                }}
                            >
                                {confirmacionModal.accion === "Confirmado" ? (
                                    <>
                                        <Check size={16} />
                                        <span>Sí, Aprobar</span>
                                    </>
                                ) : (
                                    <>
                                        <X size={16} />
                                        <span>Sí, Rechazar</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer style={{ marginTop: "auto" }} />
        </div>
    );
}

export default AlquilerAdmin;
