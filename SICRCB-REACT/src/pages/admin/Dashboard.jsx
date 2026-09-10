import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import NavbarApp from "../../components/NavbarApp.jsx";
import Footer from "../../components/Footer.jsx";
import {
  Home,
  FileText,
  Newspaper,
  MapPin,
  MessageSquare,
  User,
  RotateCw,
  Database,
  Server,
  Clock,
  Users,
  ChevronRight,
  Shield,
  Activity,
  Layers
} from "lucide-react";
import "../../assets/css/styles.css";
import "../../assets/css/dashboardAdmin.css";

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);

  // Estadísticas del dashboard
  const [stats, setStats] = useState({
    alquileresActivos: 0,
    multasPendientes: 0,
    pqrsPendientes: 0,
    totalPropietarios: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/dashboard/estadisticas");
        if (res.data) {
          setStats({
            alquileresActivos: res.data.alquileresActivos || 0,
            multasPendientes: res.data.multasPendientes || 0,
            pqrsPendientes: res.data.pqrsPendientes || 0,
            totalPropietarios: res.data.totalPropietarios || 0
          });
        }
      } catch (err) {
        console.error("Error al obtener estadísticas del dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = async () => {
    if (logout) {
      await logout();
    }
    navigate("/");
  };

  const isAdmin =
    user?.rol?.toLowerCase().includes("admin") ||
    user?.rol?.toLowerCase() === "administrador";

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
              <p>Cargando panel de control y métricas del sistema...</p>
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
          <div className="dash-hero-badge">
            <Server size={16} /> Servidor y Base de Datos Operativos
          </div>
        </div>

        {/* GRID DE MÉTRICAS / KPIS (4 COLUMNAS) */}
        <section className="sicrcb-dash-kpis">
          
          {/* KPI 1: Alquileres Activos */}
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

          {/* KPI 2: Multas Pendientes */}
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

          {/* KPI 3: Propietarios Registrados */}
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

          {/* KPI 4: PQRS Pendientes */}
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

        {/* LAYOUT DE 2 COLUMNAS (CONTENIDO + BARRA LATERAL) */}
        <div className="sicrcb-dash-layout">
          
          {/* Columna Principal: Actividad Reciente y Estado del Sistema */}
          <div className="dash-main-col">
            
            {/* Tarjeta: Actividad Reciente */}
            <div className="sicrcb-card">
              <div className="sicrcb-card-header">
                <div className="card-title-group">
                  <Activity size={20} color="#8c3200" />
                  <h3>Actividad Reciente en la Copropiedad</h3>
                </div>
                <span className="card-header-badge">Tiempo Real</span>
              </div>

              <div className="sicrcb-card-body">
                <div className="dash-timeline">
                  <div className="timeline-item">
                    <div className="timeline-icon">
                      <FileText size={18} />
                    </div>
                    <div className="timeline-content">
                      <p className="timeline-desc">Nueva sanción por convivencia registrada (#2045)</p>
                      <span className="timeline-time">Hace 2 horas</span>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <div className="timeline-icon">
                      <MessageSquare size={18} />
                    </div>
                    <div className="timeline-content">
                      <p className="timeline-desc">PQR radicada: Mantenimiento de luminarias en torre A1</p>
                      <span className="timeline-time">Hace 4 horas</span>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <div className="timeline-icon">
                      <MapPin size={18} />
                    </div>
                    <div className="timeline-content">
                      <p className="timeline-desc">Reserva confirmada: Salón Comunal para reunión social</p>
                      <span className="timeline-time">Hace 6 horas</span>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <div className="timeline-icon">
                      <User size={18} />
                    </div>
                    <div className="timeline-content">
                      <p className="timeline-desc">Nuevo residente acreditado en administración</p>
                      <span className="timeline-time">Hace 8 horas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta: Estado del Sistema */}
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
                    <Server size={20} color="#8c3200" />
                    <div className="health-node-info">
                      <small>API REST Express</small>
                      <span>Conectado (200 OK)</span>
                    </div>
                  </div>

                  <div className="health-node">
                    <Database size={20} color="#8c3200" />
                    <div className="health-node-info">
                      <small>Base de Datos MySQL</small>
                      <span>Operativa</span>
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
                      <small>Último Respaldo</small>
                      <span style={{ color: "#8c3200" }}>Hoy 02:30 AM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Columna Lateral: Accesos Rápidos */}
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

                  <button
                    className="sicrcb-dash-action-btn"
                    onClick={() => navigate("/alquiler")}
                  >
                    <div className="action-btn-left">
                      <Home size={18} />
                      <span>Gestión de Alquileres</span>
                    </div>
                    <ChevronRight size={16} />
                  </button>

                  <button
                    className="sicrcb-dash-action-btn"
                    onClick={() => navigate("/registro")}
                  >
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

      {/* Footer Full-Width */}
      <Footer />
    </div>
  );
}

export default Dashboard;