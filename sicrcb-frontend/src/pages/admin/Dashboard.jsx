import {
    Activity,
    ChevronRight,
    Clock,
    Database,
    FileText,
    Home,
    Layers,
    MapPin,
    MessageSquare,
    Newspaper,
    RotateCw,
    Server,
    Shield,
    User,
    Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/css/dashboardAdmin.css";
import "../../assets/css/styles.css";
import BotonReporte from "../../components/BotonReporte.jsx";
import Footer from "../../components/Footer.jsx";
import NavbarApp from "../../components/NavbarApp.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";

// Formateador de tiempo relativo para la actividad
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

function Dashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());

    // Métricas del dashboard
    const [stats, setStats] = useState({
        alquileresActivos: 0,
        multasPendientes: 0,
        pqrsPendientes: 0,
        totalPropietarios: 0,
    });

    // Actividad y estado del sistema
    const [actividades, setActividades] = useState([]);
    const [systemStatus, setSystemStatus] = useState({
        apiOk: true,
        dbOk: true,
        dbLatencyMs: 0,
    });

    const fetchDashboardData = useCallback(async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const res = await api.get("/dashboard/estadisticas");
            if (res.data) {
                const m = res.data.metricas || res.data;
                setStats({
                    alquileresActivos: m.alquileresActivos || 0,
                    multasPendientes: m.multasPendientes || 0,
                    pqrsPendientes: m.pqrsPendientes || 0,
                    totalPropietarios: m.totalPropietarios || 0,
                });

                if (res.data.actividadReciente) {
                    setActividades(res.data.actividadReciente);
                }

                if (res.data.sistema) {
                    setSystemStatus(res.data.sistema);
                }

                setLastSync(new Date().toLocaleTimeString());
            }
        } catch (err) {
            console.error("Error al sincronizar dashboard:", err);
            setSystemStatus(prev => ({ ...prev, apiOk: false, dbOk: false }));
        } finally {
            setLoading(false);
            if (isManual) setRefreshing(false);
        }
    }, []);

    // Polling automático cada 10 segundos
    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(() => {
            fetchDashboardData();
        }, 10000);

        return () => clearInterval(interval);
    }, [fetchDashboardData]);

    const handleLogout = async () => {
        if (logout) {
            await logout();
        }
        navigate("/");
    };

    const isAdmin = user?.rol?.toLowerCase().includes("admin") || user?.rol?.toLowerCase() === "administrador";

    const renderActivityIcon = tipo => {
        switch (tipo) {
            case "multa":
                return <FileText size={18} />;
            case "pqr":
                return <MessageSquare size={18} />;
            case "alquiler":
                return <MapPin size={18} />;
            case "residente":
            default:
                return <User size={18} />;
        }
    };

    if (loading) {
        return (
            <div className="dashboard-page">
                <NavbarApp onLogout={handleLogout} />
                <div className="dashboard-main-content">
                    <div className="sicrcb-dash-hero">
                        <div className="dash-hero-text">
                            <h1>
                                <Home size={32} /> SICRCB Dashboard
                            </h1>
                            <p>Conectando en tiempo real con Casa Blanca...</p>
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

            <main className="dashboard-main-content">
                {/* BANNER PRINCIPAL (HERO) */}
                <div className="sicrcb-dash-hero">
                    <div className="dash-hero-text">
                        <h1>
                            <Home size={32} /> SICRCB Dashboard
                        </h1>
                        <p>Panel de control administrativo y gestión comunitaria de Casa Blanca</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <BotonReporte
                            endpoint="/reportes/admin/resumen-ejecutivo-pdf"
                            nombreArchivo="Informe_Ejecutivo_Mensual_Casa_Blanca.pdf"
                            texto="Generar Informe Ejecutivo (PDF)"
                            className="btn btn-warning d-inline-flex align-items-center gap-2 shadow-sm fw-bold text-dark px-3 py-2"
                        />
                        <button
                            onClick={() => fetchDashboardData(true)}
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
                            title="Actualizar métricas ahora"
                        >
                            <RotateCw size={15} className={refreshing ? "spinning" : ""} />
                            {refreshing ? "Sincronizando..." : "Sincronizar"}
                        </button>
                        <div className="dash-hero-badge">
                            <Server size={16} /> Servidor y Base de Datos Operativos
                        </div>
                    </div>
                </div>

                {/* GRID DE MÉTRICAS (KPIS) */}
                <section className="sicrcb-dash-kpis">
                    <div className="dash-kpi-card" onClick={() => navigate("/alquiler")}>
                        <div className="kpi-icon-box">
                            <Home size={26} />
                        </div>
                        <div className="kpi-info-box">
                            <span className="kpi-label">Reservas Activas</span>
                            <span className="kpi-value">{stats.alquileresActivos}</span>
                            <span className="kpi-subtext">Salón y mobiliario</span>
                        </div>
                    </div>

                    <div className="dash-kpi-card" onClick={() => navigate("/multas")}>
                        <div className="kpi-icon-box kpi-warning">
                            <FileText size={26} />
                        </div>
                        <div className="kpi-info-box">
                            <span className="kpi-label">Multas Pendientes</span>
                            <span className="kpi-value">{stats.multasPendientes}</span>
                            <span className="kpi-subtext">Por conciliar</span>
                        </div>
                    </div>

                    <div className="dash-kpi-card" onClick={() => navigate("/registro")}>
                        <div className="kpi-icon-box kpi-success">
                            <Users size={26} />
                        </div>
                        <div className="kpi-info-box">
                            <span className="kpi-label">Propietarios</span>
                            <span className="kpi-value">{stats.totalPropietarios}</span>
                            <span className="kpi-subtext">Censo residencial</span>
                        </div>
                    </div>

                    <div className="dash-kpi-card" onClick={() => navigate("/pqrs")}>
                        <div className="kpi-icon-box kpi-info">
                            <MessageSquare size={26} />
                        </div>
                        <div className="kpi-info-box">
                            <span className="kpi-label">PQRS Pendientes</span>
                            <span className="kpi-value">{stats.pqrsPendientes}</span>
                            <span className="kpi-subtext">Requieren atención</span>
                        </div>
                    </div>
                </section>

                {/* LAYOUT DE 2 COLUMNAS */}
                <div className="sicrcb-dash-layout">
                    {/* Columna Principal */}
                    <div className="dash-main-col">
                        {/* Actividad Reciente */}
                        <div className="sicrcb-card">
                            <div className="sicrcb-card-header">
                                <div className="card-title-group">
                                    <Activity size={20} color="#8c3200" />
                                    <h3>Actividad Reciente en la Copropiedad</h3>
                                </div>
                                <span
                                    className="card-header-badge"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "5px",
                                    }}
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
                                    Tiempo Real
                                </span>
                            </div>

                            <div className="sicrcb-card-body">
                                <div className="dash-timeline">
                                    {actividades.length > 0 ? (
                                        actividades.map(item => (
                                            <div className="timeline-item" key={item.id}>
                                                <div className="timeline-icon">{renderActivityIcon(item.tipo)}</div>
                                                <div className="timeline-content">
                                                    <p className="timeline-desc">
                                                        <strong>{item.titulo}</strong>
                                                        <br />
                                                        <small style={{ color: "#735340" }}>{item.detalle}</small>
                                                    </p>
                                                    <span className="timeline-time">
                                                        {formatRelativeTime(item.fecha)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ textAlign: "center", padding: "1.5rem", color: "#735340" }}>
                                            Sin actividad reciente registrada en el sistema.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Estado de la Plataforma */}
                        <div className="sicrcb-card">
                            <div className="sicrcb-card-header">
                                <div className="card-title-group">
                                    <Server size={20} color="#8c3200" />
                                    <h3>Estado de la Plataforma</h3>
                                </div>
                                <span className="card-header-badge">Servicios</span>
                            </div>

                            <div className="sicrcb-card-body">
                                <div className="system-health-grid">
                                    <div className="health-node">
                                        <Server size={20} color={systemStatus.apiOk ? "#16a34a" : "#dc2626"} />
                                        <div className="health-node-info">
                                            <small>API REST Express</small>
                                            <span>{systemStatus.apiOk ? "Conectado (200 OK)" : "Desconectado"}</span>
                                        </div>
                                    </div>

                                    <div className="health-node">
                                        <Database size={20} color={systemStatus.dbOk ? "#16a34a" : "#dc2626"} />
                                        <div className="health-node-info">
                                            <small>Base de Datos MySQL</small>
                                            <span>
                                                {systemStatus.dbOk
                                                    ? `Operativa (${systemStatus.dbLatencyMs}ms)`
                                                    : "Error de conexión"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="health-node">
                                        <Shield size={20} color="#8c3200" />
                                        <div className="health-node-info">
                                            <small>Sesión JWT</small>
                                            <span>{user?.rol || "Administrador"}</span>
                                        </div>
                                    </div>

                                    <div className="health-node">
                                        <Clock size={20} color="#8c3200" />
                                        <div className="health-node-info">
                                            <small>Última Sincronización</small>
                                            <span style={{ color: "#8c3200" }}>{lastSync}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna Lateral */}
                    <aside className="dash-side-col">
                        <div className="sicrcb-card">
                            <div className="sicrcb-card-header">
                                <div className="card-title-group">
                                    <Layers size={20} color="#8c3200" />
                                    <h3>Módulos del Sistema</h3>
                                </div>
                            </div>

                            <div className="sicrcb-card-body">
                                <div className="dash-actions-grid">
                                    {isAdmin && (
                                        <>
                                            <button
                                                className="sicrcb-dash-action-btn"
                                                onClick={() => navigate("/multas")}
                                            >
                                                <div className="action-btn-left">
                                                    <FileText size={18} />
                                                    <span>Gestión de Multas</span>
                                                </div>
                                                <ChevronRight size={16} />
                                            </button>

                                            <button
                                                className="sicrcb-dash-action-btn"
                                                onClick={() => navigate("/pqrs")}
                                            >
                                                <div className="action-btn-left">
                                                    <MessageSquare size={18} />
                                                    <span>Gestión de PQRS</span>
                                                </div>
                                                <ChevronRight size={16} />
                                            </button>

                                            <button
                                                className="sicrcb-dash-action-btn"
                                                onClick={() => navigate("/noticias")}
                                            >
                                                <div className="action-btn-left">
                                                    <Newspaper size={18} />
                                                    <span>Gestión de Noticias</span>
                                                </div>
                                                <ChevronRight size={16} />
                                            </button>
                                        </>
                                    )}

                                    <button className="sicrcb-dash-action-btn" onClick={() => navigate("/alquiler")}>
                                        <div className="action-btn-left">
                                            <Home size={18} />
                                            <span>Gestión de Alquileres</span>
                                        </div>
                                        <ChevronRight size={16} />
                                    </button>

                                    <button className="sicrcb-dash-action-btn" onClick={() => navigate("/registro")}>
                                        <div className="action-btn-left">
                                            <User size={18} />
                                            <span>Registrar Usuario</span>
                                        </div>
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default Dashboard;
