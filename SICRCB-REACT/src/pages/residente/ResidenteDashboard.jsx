import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import "../../assets/css/styles.css"
import "../../assets/css/dashboard.css"
import NavbarApp from "../../components/NavbarApp.jsx"
import Footer from "../../components/Footer.jsx"
import { useAuth } from "../../context/AuthContext"
import {
  ReceiptText,
  CalendarDays,
  Newspaper,
  MessageSquareText,
  User,
  ChevronRight,
  ShieldAlert,
  Phone,
  Home,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from "lucide-react"

function ResidenteDashboard() {
  const navigate = useNavigate()
  const { user: authUser, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)

  // Datos del dashboard
  const [pendingMultas, setPendingMultas] = useState(0)
  const [paidMultas, setPaidMultas] = useState(0)
  const [upcomingReservas, setUpcomingReservas] = useState([])
  const [latestNoticias, setLatestNoticias] = useState([])

  useEffect(() => {
    if (authLoading) return

    if (!authUser) {
      navigate("/login")
      return
    }

    const userRole = authUser.rol?.toLowerCase() || ''
    if (userRole !== 'propietario' && userRole !== 'residente') {
      navigate("/dashboard")
      return
    }

    if (authUser?.id) {
      // 1. Multas del residente
      api.get("/multas/mis-multas")
        .then(res => {
          const multas = Array.isArray(res.data) ? res.data : []
          setPendingMultas(multas.filter(m => (m.estado || "").toLowerCase() === 'pendiente').length)
          setPaidMultas(multas.filter(m => (m.estado || "").toLowerCase() === 'resuelta' || (m.estado || "").toLowerCase() === 'pagada').length)
        })
        .catch(err => console.error("Error al cargar multas:", err))

      // 2. Reservas de áreas comunes
      api.get("/alquileres/mis-alquileres")
        .then(res => {
          const reservas = Array.isArray(res.data) ? res.data : []
          setUpcomingReservas(reservas.slice(0, 4))
        })
        .catch(err => console.error("Error al cargar alquileres:", err))

      // 3. Noticias comunitarias
      api.get("/noticias/destacadas")
        .then(res => {
          setLatestNoticias(Array.isArray(res.data) ? res.data : [])
        })
        .catch(err => console.error("Error al cargar noticias:", err))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [authUser, authLoading, navigate])

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout")
    } catch (err) {
      console.error("Logout fallido", err)
    } finally {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      navigate("/")
    }
  }

  const residentName = authUser?.nombres || authUser?.nombre || "Residente"

  return (
    <div className="dashboard-page">
      <NavbarApp onLogout={handleLogout} />

      <main className="dashboard-main-content">
        {/* Banner de bienvenida al conjunto */}
        <section className="sicrcb-dash-hero">
          <div className="dash-hero-text">
            <h1>
              <span>¡Hola, {residentName.split(" ")[0]}!</span>
              <Sparkles size={24} stroke="#FFD0A0" />
            </h1>
            <p>Bienvenido al portal del Conjunto Residencial Casa Blanca.</p>
          </div>
          <div className="dash-hero-badge">
            <Home size={16} stroke="#FFD0A0" />
            <span>Apartamento al día</span>
          </div>
        </section>

        {/* Tarjetas KPI de Estado */}
        <section className="sicrcb-dash-kpis">
          <div className="dash-kpi-card" onClick={() => navigate("/multas")} role="button" tabIndex={0}>
            <div className={`kpi-icon-box ${pendingMultas > 0 ? "kpi-warning" : "kpi-success"}`}>
              <ReceiptText size={24} />
            </div>
            <div className="kpi-info-box">
              <span className="kpi-label">Multas Pendientes</span>
              <span className="kpi-value">{pendingMultas}</span>
              <span className="kpi-subtext">
                {pendingMultas === 0 ? "Al día con la administración" : "Requiere regularización"}
              </span>
            </div>
          </div>

          <div className="dash-kpi-card" onClick={() => navigate("/multas")} role="button" tabIndex={0}>
            <div className="kpi-icon-box kpi-success">
              <CheckCircle2 size={24} />
            </div>
            <div className="kpi-info-box">
              <span className="kpi-label">Multas Resueltas</span>
              <span className="kpi-value">{paidMultas}</span>
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
              <span className="kpi-value">{latestNoticias.length}</span>
              <span className="kpi-subtext">Comunidad Casa Blanca</span>
            </div>
          </div>
        </section>

        {/* Layout de Contenido Principal + Lateral */}
        <div className="sicrcb-dash-layout">
          
          {/* Columna Izquierda: Reservas y Noticias */}
          <div className="dash-main-col">
            
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
                            <strong>{reserva.tipo_alquiler || "Salón Comunal"}</strong>
                            <span>
                              Fecha: {reserva.fecha_inicio ? new Date(reserva.fecha_inicio).toLocaleDateString() : "Por confirmar"}
                              {reserva.cantidad_sillas ? ` · ${reserva.cantidad_sillas} sillas` : ""}
                            </span>
                          </div>
                        </div>
                        <span className="reserva-badge">Confirmada</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "1.5rem", color: "#8C3200" }}>
                    <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.92rem" }}>No tienes reservas activas de zonas comunes.</p>
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
                      <article key={idx} className="dash-noticia-item" onClick={() => navigate("/noticias")} style={{ cursor: "pointer" }}>
                        <div className="noticia-header-row">
                          <strong>{noticia.titulo || "Aviso a la Comunidad"}</strong>
                          <span className="noticia-date">
                            {noticia.fecha_publicacion ? new Date(noticia.fecha_publicacion).toLocaleDateString() : "Reciente"}
                          </span>
                        </div>
                        <p className="noticia-snippet">
                          {noticia.descripcion ? noticia.descripcion.substring(0, 130) + "..." : "Haz clic para leer el comunicado completo."}
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

          {/* Columna Derecha: Accesos rápidos & Asistencia */}
          <div className="dash-side-col">
            
            {/* Accesos Rápidos para Residentes */}
            <div className="sicrcb-card">
              <div className="sicrcb-card-header">
                <div className="card-title-group">
                  <Sparkles size={18} stroke="#8C3200" />
                  <h3>Gestiones Rápidas</h3>
                </div>
              </div>
              <div className="sicrcb-card-body">
                <div className="dash-actions-grid">
                  <button type="button" className="sicrcb-dash-action-btn" onClick={() => navigate("/multas")}>
                    <span className="action-btn-left">
                      <ReceiptText size={18} />
                      <span>Consultar Multas</span>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                  <button type="button" className="sicrcb-dash-action-btn" onClick={() => navigate("/alquiler")}>
                    <span className="action-btn-left">
                      <CalendarDays size={18} />
                      <span>Reservar Salón Comunal</span>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                  <button type="button" className="sicrcb-dash-action-btn" onClick={() => navigate("/pqrs")}>
                    <span className="action-btn-left">
                      <MessageSquareText size={18} />
                      <span>Radicar Petición / PQRS</span>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                  <button type="button" className="sicrcb-dash-action-btn" onClick={() => navigate("/perfil")}>
                    <span className="action-btn-left">
                      <User size={18} />
                      <span>Actualizar Mis Datos</span>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Asistencia Directa y Portería 24/7 */}
            <div className="resident-emergency-card">
              <div className="resident-emergency-header">
                <ShieldAlert size={22} stroke="#8C3200" />
                <h4>Portería Casa Blanca</h4>
              </div>
              <p>
                Para emergencias residenciales, acceso de ambulancias, mudanzas o reportes urgentes 24 horas al día.
              </p>
              <a href="tel:6010000001" className="resident-call-btn">
                <Phone size={15} />
                <span>Contactar a Portería</span>
              </a>
            </div>

          </div>

        </div>
      </main>

      <Footer style={{ marginTop: "auto" }} />
    </div>
  )
}

export default ResidenteDashboard