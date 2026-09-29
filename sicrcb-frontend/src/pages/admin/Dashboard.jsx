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
import BotonReporte from "../../components/BotonReporte.jsx";
import Footer from "../../components/Footer.jsx";
import NavbarApp from "../../components/NavbarApp.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";

// Presentational components
import DashboardHeader from "../../components/features/dashboard/DashboardHeader.jsx";
import MetricsGrid from "../../components/features/dashboard/MetricsGrid.jsx";
import RecentActivityCard from "../../components/features/dashboard/RecentActivityCard.jsx";
import SystemStatusCard from "../../components/features/dashboard/SystemStatusCard.jsx";
import SystemModulesCard from "../../components/features/dashboard/SystemModulesCard.jsx";

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
                {/* DASHBOARD HEADER */}
                <DashboardHeader
                    onGenerateReport={() => {
                        // This would trigger the BotonReporte functionality
                        // For now, we'll keep the existing button in the header
                    }}
                    onRefresh={fetchDashboardData}
                    refreshing={refreshing}
                    lastSync={lastSync}
                />

                {/* GRID DE MÉTRICAS (KPIS) */}
                <MetricsGrid
                    stats={stats}
                    navigate={navigate}
                />

                {/* LAYOUT DE 2 COLUMNAS */}
                <div className="sicrcb-dash-layout">
                    {/* Columna Principal */}
                    <div className="dash-main-col">
                        {/* Actividad Reciente */}
                        <RecentActivityCard actividades={actividades} />

                        {/* Estado de la Plataforma */}
                        <SystemStatusCard
                            systemStatus={systemStatus}
                            user={user}
                            lastSync={lastSync}
                        />
                    </div>

                    {/* Columna Lateral */}
                    <aside className="dash-side-col">
                        <SystemModulesCard
                            isAdmin={isAdmin}
                            navigate={navigate}
                        />
                    </aside>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default Dashboard;