import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import "../../assets/css/styles.css"
import "../../assets/css/dashboard.css"
import NavbarApp from "../../components/NavbarApp.jsx"
import { useAuth } from "../../context/AuthContext"

function ResidenteDashboard() {
  const navigate = useNavigate()
  const { user: authUser, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Dashboard data
  const [pendingMultas, setPendingMultas] = useState(0)
  const [paidMultas, setPaidMultas] = useState(0)
  const [upcomingReservas, setUpcomingReservas] = useState([])
  const [latestNoticias, setLatestNoticias] = useState([])

  useEffect(() => {
    // If auth is still loading, we keep loading true
    if (authLoading) {
      setLoading(true)
      return
    }

    // If no user, redirect to login
    if (!authUser) {
      navigate("/login")
      return
    }

    // Role check: only allow 'propietario' role to access this dashboard
    const userRole = authUser.rol?.toLowerCase() || ''
    if (userRole !== 'propietario') {
      // Redirect to admin dashboard if not a regular user (propietario)
      navigate("/dashboard")
      return
    }

    // Fetch dashboard data if we have user
    if (authUser && authUser.id) {
      const userId = authUser.id

      // Fetch multas count (then filter locally)
      api.get(`/multas/mis-multas`)
        .then(res => {
          const multas = Array.isArray(res.data) ? res.data : []
          setPendingMultas(multas.filter(m => m.estado === 'Pendiente').length)
          setPaidMultas(multas.filter(m => m.estado === 'Resuelta').length) // Assuming 'Resuelta' is paid
        })
        .catch(err => {
          console.error("Error fetching multas:", err)
          // Don't set error here to avoid breaking dashboard if one endpoint fails
        })

      // Fetch upcoming reservations (sorted by start date ascending)
      api.get(`/alquileres/mis-alquileres`)
        .then(res => {
          const reservas = Array.isArray(res.data) ? res.data : []
          // Show upcoming reservations (future dates) - but for simplicity, we'll show first 5
          setUpcomingReservas(reservas.slice(0, 5))
        })
        .catch(err => {
          console.error("Error fetching alquileres:", err)
        })

      // Fetch latest featured news (public endpoint)
      api.get(`/noticias/destacadas`)
        .then(res => {
          setLatestNoticias(Array.isArray(res.data) ? res.data : [])
        })
        .catch(err => {
          console.error("Error fetching noticias:", err)
        })
    }

    setLoading(false)
  }, [authUser, authLoading, navigate])

  if (loading) {
    return <div className="dashboard-page">Cargando panel de residente...</div>
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <h1>Error</h1>
        <p>{error}</p>
        <button className="btn-success" onClick={() => navigate("/login")}>
          Volver al inicio
        </button>
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout")
    } catch (err) {
      console.error("Logout failed", err)
    } finally {
      navigate("/")
    }
  }

  return (
    <div className="dashboard-page">
      <NavbarApp onLogout={handleLogout} />
      <div className="titulo">
        <h1>Panel de Residente</h1>
      </div>
      <div className="subtitulo">
        <div className="subtitulo-banda">
          Bienvenido, {authUser?.nombre || authUser?.email || 'Residente'}
        </div>
      </div>

      <div className="grid-noticias">
        {/* Estadística 1: Multas Pendientes */}
        <div className="a-noticia">
          <legend>Multas Pendientes</legend>
          <hr />
          <div className="stat-card">
            <h3>Total</h3>
            <p className="stat-number">{pendingMultas}</p>
          </div>
        </div>

        {/* Estadística 2: Multas Pagadas */}
        <div className="a-noticia">
          <legend>Multas Pagadas</legend>
          <hr />
          <div className="stat-card">
            <h3>Total</h3>
            <p className="stat-number">{paidMultas}</p>
          </div>
        </div>

        {/* Estadística 3: Próximas Reservas */}
        <div className="a-noticia full-width">
          <legend>Próximas Reservas</legend>
          <hr />
          {upcomingReservas.length > 0 ? (
            <div>
              {upcomingReservas.map((reserva, index) => (
                <div key={index} className="reserva-item">
                  <p><strong>{reserva.nombre_solicitante}</strong></p>
                  <p>
                    {reserva.tipo_alquiler} - {reserva.cantidad_sillas} sillas
                  </p>
                  <p>
                    Desde: {new Date(reserva.fecha_inicio).toLocaleDateString()}
                    Hasta: {new Date(reserva.fecha_fin).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p>No tienes reservas próximas.</p>
          )}
        </div>

        {/* Estadística 4: Últimas Noticias */}
        <div className="a-noticia full-width">
          <legend>Últimas Noticias</legend>
          <hr />
          {latestNoticias.length > 0 ? (
            <div>
              {latestNoticias.map((noticia, index) => (
                <div key={index} className="noticia-item">
                  <p><strong>{noticia.titulo || 'Noticia'}</strong></p>
                  <p>
                    {new Date(noticia.fecha_publicacion).toLocaleDateString()}
                  </p>
                  {noticia.descripcion && (
                    <p className="noticia-descripcion">{noticia.descripcion.substring(0, 100)}...</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No hay noticias disponibles.</p>
          )}
        </div>

        {/* Accesos rápidos */}
        <div className="a-noticia full-width">
          <legend>Accesos Rápidos</legend>
          <hr />
          <div className="quick-actions">
            <button className="btn-success" onClick={() => navigate("/multas")}>
              Mis Multas
            </button>
            <button className="btn-success" onClick={() => navigate("/noticias")}>
              Ver Noticias
            </button>
            <button className="btn-success" onClick={() => navigate("/alquiler")}>
              Hacer una Reserva
            </button>
            <button className="btn-success" onClick={() => navigate("/perfil")}>
              Mi Perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResidenteDashboard