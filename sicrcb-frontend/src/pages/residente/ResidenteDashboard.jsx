import {
    AlertCircle,
    AlertTriangle,
    Bell,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock,
    Home,
    Info,
    MessageSquareText,
    Newspaper,
    Phone,
    ReceiptText,
    RotateCw,
    ShieldAlert,
    Sparkles,
    User,
    X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/css/dashboard.css";
import "../../assets/css/styles.css";
import Footer from "../../components/Footer.jsx";
import NavbarApp from "../../components/NavbarApp.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";

// Formateador de tiempo relativo en español
function formatRelativeTime(dateString) {
    if (!dateString) return "Hace un momento";
    const now = new Date();
    const past = new Date(dateString);
    const diffMinutes = Math.floor((now - past) / 60000);

    if (diffMinutes < 1) return "Hace unos segundos";
    if (diffMinutes < 60) return `Hace ${diffMinutes} ${diffMinutes === 1 ? "minuto" : "minutos"}`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;
}

function ResidenteDashboard() {
    const navigate = useNavigate();
    const { user: authUser, loading: authLoading, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());

    // Toasts emergentes en pantalla
    const [toasts, setToasts] = useState([]);

    // Referencias para comparar novedades entre ciclos de actualización
    const prevNoticiasIdsRef = useRef(null);
    const prevMultasCountRef = useRef(null);

    // Datos del dashboard de residente
    const [propietarioInfo, setPropietarioInfo] = useState({
        nombre: "Residente",
        apartamento: "Apartamento asignado",
        alDia: true,
    });

    const [stats, setStats] = useState({
        multasPendientes: 0,
        multasResueltas: 0,
        reservasActivas: 0,
        noticiasActivas: 0,
        pqrsActivas: 0,
    });

    const [notificaciones, setNotificaciones] = useState([]);
    const [upcomingReservas, setUpcomingReservas] = useState([]);
    const [latestNoticias, setLatestNoticias] = useState([]);

    const addToast = toast => {
        setToasts(prev => [toast, ...prev]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, 9000);
    };

    const removeToast = id => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const fetchResidentData = useCallback(async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const res = await api.get("/dashboard/residente");
            if (res.data) {
                if (res.data.propietario) setPropietarioInfo(res.data.propietario);
                if (res.data.metricas) setStats(res.data.metricas);
                if (res.data.notificaciones) setNotificaciones(res.data.notificaciones);
                if (res.data.proximasReservas) setUpcomingReservas(res.data.proximasReservas);

                // 1. Detección de Nuevas Noticias en tiempo real
                const currentNoticias = res.data.ultimasNoticias || [];
                setLatestNoticias(currentNoticias);

                if (prevNoticiasIdsRef.current !== null) {
                    const nuevasNoticias = currentNoticias.filter(n => !prevNoticiasIdsRef.current.includes(n.id));
                    if (nuevasNoticias.length > 0) {
                        nuevasNoticias.forEach(noticia => {
                            addToast({
                                id: `noticia-${noticia.id}-${Date.now()}`,
                                tipo: "noticia",
                                titulo: "🔔 ¡Nuevo Comunicado Publicado!",
                                mensaje: (noticia.descripcion || "Aviso a la comunidad").substring(0, 100) + "...",
                                link: "/noticias",
                            });
                        });
                    }
                }
                prevNoticiasIdsRef.current = currentNoticias.map(n => n.id);

                // 2. Detección de Nuevas Multas en tiempo real
                const currentMultasCount = res.data.metricas?.multasPendientes || 0;
                if (prevMultasCountRef.current !== null && currentMultasCount > prevMultasCountRef.current) {
                    addToast({
                        id: `multa-${Date.now()}`,
                        tipo: "multa",
                        titulo: "⚠️ Nueva Sanción Asignada",
                        mensaje: "Se ha registrado una nueva multa en tu apartamento por conciliar.",
                        link: "/multas",
                    });
                }
                prevMultasCountRef.current = currentMultasCount;

                setLastSync(new Date().toLocaleTimeString());
            }
        } catch (err) {
            console.error("Error al sincronizar dashboard del residente:", err);
        } finally {
            setLoading(false);
            if (isManual) setRefreshing(false);
        }
    }, []);

    // Polling automático cada 6 segundos para detección inmediata
    useEffect(() => {
        if (authLoading) return;
        if (!authUser) {
            navigate("/login");
            return;
        }

        fetchResidentData();
        const interval = setInterval(() => {
            fetchResidentData();
        }, 6000);

        return () => clearInterval(interval);
    }, [authUser, authLoading, navigate, fetchResidentData]);

    const handleLogout = async () => {
        if (logout) {
            await logout();
        }
        navigate("/");
    };

    const residentName = propietarioInfo.nombre || authUser?.nombres || authUser?.nombre || "Residente";

    const renderNotifIcon = (tipo, urgencia) => {
        if (urgencia === "urgente" || tipo === "multa") {
            return <AlertTriangle size={18} color="#dc2626" />;
        }
        if (urgencia === "exito") {
            return <CheckCircle2 size={18} color="#16a34a" />;
        }
        if (tipo === "noticia") {
            return <Newspaper size={18} color="#8c3200" />;
        }
        return <Info size={18} color="#f97316" />;
    };

    if (loading) {
        return (
            <div className="dashboard-page">
                <NavbarApp onLogout={handleLogout} />
                <div className="dashboard-main-content">
                    <div className="sicrcb-dash-hero">
                        <div className="dash-hero-text">
                            <h1>
                                <span>¡Hola!</span>
                                <Sparkles size={24} stroke="#FFD0A0" />
                            </h1>
                            <p>Sincronizando información de tu apartamento en Casa Blanca...</p>
                        </div>
                        <RotateCw size={28} className="spinning" color="#FFD0A0" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            <NavbarApp onLogout={handleLogout} />

            {/* TOAST FLOTANTE DE NOTIFICACIONES EN VIVO */}
            <div
                style={{
                    position: "fixed",
                    top: "24px",
                    right: "24px",
                    zIndex: 9999,
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    maxWidth: "380px",
                    width: "90%",
                }}
            >
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        style={{
                            background: "#ffffff",
                            borderRadius: "14px",
                            padding: "1rem 1.15rem",
                            boxShadow: "0 12px 30px rgba(140, 50, 0, 0.22)",
                            border: toast.tipo === "multa" ? "2px solid #dc2626" : "2px solid #f47820",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "12px",
                            animation: "slideIn 0.3s ease-out",
                        }}
                    >
                        <div style={{ marginTop: "2px" }}>
                            {toast.tipo === "multa" ? (
                                <AlertTriangle size={22} color="#dc2626" />
                            ) : (
                                <Bell size={22} color="#f47820" />
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <strong
                                style={{ fontSize: "0.92rem", color: "#2c1203", display: "block", marginBottom: "3px" }}
                            >
                                {toast.titulo}
                            </strong>
                            <p style={{ margin: "0 0 8px 0", fontSize: "0.82rem", color: "#735340", lineHeight: 1.35 }}>
                                {toast.mensaje}
                            </p>
                            {toast.link && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        removeToast(toast.id);
                                        navigate(toast.link);
                                    }}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        padding: 0,
                                        color: "#8c3200",
                                        fontWeight: 700,
                                        fontSize: "0.8rem",
                                        cursor: "pointer",
                                        textDecoration: "underline",
                                    }}
                                >
                                    Ver en el sistema →
                                </button>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => removeToast(toast.id)}
                            style={{
                                background: "none",
                                border: "none",
                                color: "#a8a29e",
                                cursor: "pointer",
                                padding: "2px",
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>

            <main className="dashboard-main-content">
                {/* Banner de bienvenida */}
                <section className="sicrcb-dash-hero">
                    <div className="dash-hero-text">
                        <h1>
                            <span>¡Hola, {residentName.split(" ")[0]}!</span>
                            <Sparkles size={24} stroke="#FFD0A0" />
                        </h1>
                        <p>{propietarioInfo.apartamento} · Conjunto Residencial Casa Blanca</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button
                            onClick={() => fetchResidentData(true)}
                            style={{
                                background: "rgba(0,0,0,0.25)",
                                border: "1px solid rgba(255, 208, 160, 0.4)",
                                color: "#ffd0a0",
                                padding: "0.5rem 0.85rem",
                                borderRadius: "20px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                            }}
                            title="Actualizar datos ahora"
                        >
                            <RotateCw size={15} className={refreshing ? "spinning" : ""} />
                            {refreshing ? "Sincronizando..." : "Sincronizar"}
                        </button>
                        <div
                            className="dash-hero-badge"
                            style={{
                                backgroundColor: propietarioInfo.alDia
                                    ? "rgba(22, 163, 74, 0.25)"
                                    : "rgba(220, 38, 38, 0.35)",
                                borderColor: propietarioInfo.alDia ? "#86efac" : "#fca5a5",
                                color: propietarioInfo.alDia ? "#dcfce7" : "#fee2e2",
                            }}
                        >
                            {propietarioInfo.alDia ? (
                                <>
                                    <CheckCircle2 size={16} color="#86efac" />
                                    <span>Apartamento al día</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle size={16} color="#fca5a5" />
                                    <span>Sanciones pendientes</span>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                {/* Tarjetas KPI de Estado */}
                <section className="sicrcb-dash-kpis">
                    <div className="dash-kpi-card" onClick={() => navigate("/multas")} role="button" tabIndex={0}>
                        <div className={`kpi-icon-box ${stats.multasPendientes > 0 ? "kpi-warning" : "kpi-success"}`}>
                            <ReceiptText size={24} />
                        </div>
                        <div className="kpi-info-box">
                            <span className="kpi-label">Multas Pendientes</span>
                            <span className="kpi-value">{stats.multasPendientes}</span>
                            <span className="kpi-subtext">
                                {stats.multasPendientes === 0
                                    ? "Al día con la administración"
                                    : "Requiere regularización"}
                            </span>
                        </div>
                    </div>

                    <div className="dash-kpi-card" onClick={() => navigate("/multas")} role="button" tabIndex={0}>
                        <div className="kpi-icon-box kpi-success">
                            <CheckCircle2 size={24} />
                        </div>
                        <div className="kpi-info-box">
                            <span className="kpi-label">Multas Resueltas</span>
                            <span className="kpi-value">{stats.multasResueltas}</span>
                            <span className="kpi-subtext">Histórico pagado</span>
                        </div>
                    </div>

                    <div className="dash-kpi-card" onClick={() => navigate("/alquiler")} role="button" tabIndex={0}>
                        <div className="kpi-icon-box">
                            <CalendarDays size={24} />
                        </div>
                        <div className="kpi-info-box">
                            <span className="kpi-label">Mis Reservas</span>
                            <span className="kpi-value">{upcomingReservas.length}</span>
                            <span className="kpi-subtext">Espacios agendados</span>
                        </div>
                    </div>

                    <div className="dash-kpi-card" onClick={() => navigate("/noticias")} role="button" tabIndex={0}>
                        <div className="kpi-icon-box kpi-info">
                            <Newspaper size={24} />
                        </div>
                        <div className="kpi-info-box">
                            <span className="kpi-label">Noticias Activas</span>
                            <span className="kpi-value">{stats.noticiasActivas}</span>
                            <span className="kpi-subtext">Comunidad Casa Blanca</span>
                        </div>
                    </div>
                </section>

                {/* Layout de Contenido */}
                <div className="sicrcb-dash-layout">
                    <div className="dash-main-col">
                        {/* Notificaciones y Novedades del Sistema */}
                        <div className="sicrcb-card">
                            <div className="sicrcb-card-header">
                                <div className="card-title-group">
                                    <Bell size={20} stroke="#8C3200" />
                                    <h3>Centro de Novedades y Avisos en Vivo</h3>
                                </div>
                                <span
                                    className="card-header-badge"
                                    style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
                                >
                                    <span
                                        style={{
                                            width: "8px",
                                            height: "8px",
                                            borderRadius: "50%",
                                            backgroundColor: "#10b981",
                                            display: "inline-block",
                                        }}
                                    />
                                    En Vivo
                                </span>
                            </div>
                            <div className="sicrcb-card-body">
                                {notificaciones.length > 0 ? (
                                    <div className="dash-timeline">
                                        {notificaciones.map(n => (
                                            <div className="timeline-item" key={n.id}>
                                                <div className="timeline-icon">
                                                    {renderNotifIcon(n.tipo, n.urgencia)}
                                                </div>
                                                <div className="timeline-content">
                                                    <p className="timeline-desc">
                                                        <strong>{n.titulo}</strong>
                                                        <br />
                                                        <small style={{ color: "#735340" }}>{n.mensaje}</small>
                                                    </p>
                                                    <span className="timeline-time">{formatRelativeTime(n.fecha)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: "center", padding: "1.5rem", color: "#735340" }}>
                                        <CheckCircle2
                                            size={24}
                                            color="#16a34a"
                                            style={{ margin: "0 auto 0.5rem auto" }}
                                        />
                                        <p style={{ margin: 0 }}>No tienes novedades ni alertas pendientes.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Próximas Reservas */}
                        <div className="sicrcb-card">
                            <div className="sicrcb-card-header">
                                <div className="card-title-group">
                                    <CalendarDays size={20} stroke="#8C3200" />
                                    <h3>Mis Próximas Reservas de Áreas Comunes</h3>
                                </div>
                                <button
                                    type="button"
                                    className="card-header-badge"
                                    onClick={() => navigate("/alquiler")}
                                >
                                    Solicitar nueva +
                                </button>
                            </div>
                            <div className="sicrcb-card-body">
                                {upcomingReservas.length > 0 ? (
                                    <div className="dash-reservas-list">
                                        {upcomingReservas.map((reserva, idx) => (
                                            <div key={idx} className="dash-reserva-item">
                                                <div className="reserva-meta">
                                                    <div className="reserva-icon">
                                                        <Home size={20} />
                                                    </div>
                                                    <div className="reserva-details">
                                                        <strong>{reserva.descripcion || "Salón Comunal"}</strong>
                                                        <span>
                                                            Fecha:{" "}
                                                            {reserva.hora_inicio
                                                                ? new Date(reserva.hora_inicio).toLocaleDateString()
                                                                : "Por confirmar"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="reserva-badge">{reserva.estado || "Confirmada"}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: "center", padding: "1.5rem", color: "#8C3200" }}>
                                        <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.92rem" }}>
                                            No tienes reservas activas de zonas comunes.
                                        </p>
                                        <button
                                            type="button"
                                            className="sicrcb-dash-action-btn"
                                            style={{ maxWidth: "220px", margin: "0 auto" }}
                                            onClick={() => navigate("/alquiler")}
                                        >
                                            <span className="action-btn-left">
                                                <CalendarDays size={16} />
                                                <span>Hacer una Reserva</span>
                                            </span>
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Boletín Comunitario / Noticias */}
                        <div className="sicrcb-card">
                            <div className="sicrcb-card-header">
                                <div className="card-title-group">
                                    <Newspaper size={20} stroke="#8C3200" />
                                    <h3>Boletín y Comunicados Oficiales</h3>
                                </div>
                                <span className="card-header-badge">Últimos avisos</span>
                            </div>
                            <div className="sicrcb-card-body">
                                {latestNoticias.length > 0 ? (
                                    <div className="dash-noticias-list">
                                        {latestNoticias.map((noticia, idx) => (
                                            <article
                                                key={idx}
                                                className="dash-noticia-item"
                                                onClick={() => navigate("/noticias")}
                                                style={{ cursor: "pointer" }}
                                            >
                                                <div className="noticia-header-row">
                                                    <strong>{noticia.titulo || "Aviso a la Comunidad"}</strong>
                                                    <span className="noticia-date">
                                                        {noticia.fecha_publicacion
                                                            ? new Date(noticia.fecha_publicacion).toLocaleDateString()
                                                            : "Reciente"}
                                                    </span>
                                                </div>
                                                <p className="noticia-snippet">
                                                    {noticia.descripcion
                                                        ? noticia.descripcion.substring(0, 130) + "..."
                                                        : "Haz clic para leer el comunicado completo."}
                                                </p>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ textAlign: "center", color: "#8c3200", margin: "1rem 0" }}>
                                        No hay nuevos comunicados por el momento.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha */}
                    <aside className="dash-side-col">
                        <div className="sicrcb-card">
                            <div className="sicrcb-card-header">
                                <div className="card-title-group">
                                    <Sparkles size={18} stroke="#8C3200" />
                                    <h3>Gestiones Rápidas</h3>
                                </div>
                            </div>
                            <div className="sicrcb-card-body">
                                <div className="dash-actions-grid">
                                    <button
                                        type="button"
                                        className="sicrcb-dash-action-btn"
                                        onClick={() => navigate("/multas")}
                                    >
                                        <span className="action-btn-left">
                                            <ReceiptText size={18} />
                                            <span>Consultar Multas</span>
                                        </span>
                                        <ChevronRight size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        className="sicrcb-dash-action-btn"
                                        onClick={() => navigate("/alquiler")}
                                    >
                                        <span className="action-btn-left">
                                            <CalendarDays size={18} />
                                            <span>Reservar Salón Comunal</span>
                                        </span>
                                        <ChevronRight size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        className="sicrcb-dash-action-btn"
                                        onClick={() => navigate("/pqrs")}
                                    >
                                        <span className="action-btn-left">
                                            <MessageSquareText size={18} />
                                            <span>Radicar Petición / PQRS</span>
                                        </span>
                                        <ChevronRight size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        className="sicrcb-dash-action-btn"
                                        onClick={() => navigate("/perfil")}
                                    >
                                        <span className="action-btn-left">
                                            <User size={18} />
                                            <span>Actualizar Mis Datos</span>
                                        </span>
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="resident-emergency-card">
                            <div className="resident-emergency-header">
                                <ShieldAlert size={22} stroke="#8C3200" />
                                <h4>Portería Casa Blanca</h4>
                            </div>
                            <p>
                                Para emergencias residenciales, acceso de ambulancias, mudanzas o reportes urgentes 24
                                horas al día.
                            </p>
                            <a href="tel:6010000001" className="resident-call-btn">
                                <Phone size={15} />
                                <span>Contactar a Portería</span>
                            </a>
                        </div>

                        <div
                            style={{
                                textAlign: "center",
                                fontSize: "0.75rem",
                                color: "#8c3200",
                                opacity: 0.8,
                                marginTop: "0.5rem",
                            }}
                        >
                            <Clock size={12} style={{ display: "inline", marginRight: "4px" }} />
                            Última sincronización: {lastSync}
                        </div>
                    </aside>
                </div>
            </main>

            <Footer style={{ marginTop: "auto" }} />
        </div>
    );
}

export default ResidenteDashboard;
