import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import "../../assets/css/styles.css"
import "../../assets/css/dashboard.css"
import NavbarApp from "../../components/NavbarApp.jsx"

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

function ResidenteDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Dashboard data
  const [pendingMultas, setPendingMultas] = useState(0)
  const [paidMultas, setPaidMultas] = useState(0)
  const [upcomingReservas, setUpcomingReservas] = useState([])
  const [latestNoticias, setLatestNoticias] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')

    if (token && userStr) {
      try {
        const parsedUser = JSON.parse(userStr)
        setUser(parsedUser)
      } catch (e) {
        console.error("Error parsing user from localStorage", e)
        setError("Error al cargar datos de usuario")
        navigate("/login")
        return
      }
    } else {
      navigate("/login")
      return
    }

    // Role check: only allow USER role to access this dashboard
    if (user && user.role) {
      const role = user.role.toLowerCase()
      if (role !== 'user') {
        // Redirect to admin dashboard if not a regular user
        navigate("/dashboard")
        return
      }
    }

    // Fetch dashboard data if we have user
    if (user && user.id) {
      const userId = user.id

      // Fetch multas count (then filter locally)
      api.get(`/multas/mis-multas`)
        .then(res => {
          const multas = Array.isArray(res.data) ? res.data : []
          setPendingMultas(multas.filter(m => m.estado === 'pendiente').length)
          setPaidMultas(multas.filter(m => m.estado === 'pagado').length)
        })
        .catch(err => {
          console.error("Error fetching multas:", err)
          // Don't set error here to avoid breaking dashboard if one endpoint fails
        })

      // Fetch upcoming reservations (sorted by start date ascending)
      api.get(`/alquileres/mis-alquileres?_sort=fecha_inicio&_order=ASC`)
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
  }, [user, navigate])

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

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/")
  }

  return (
    <div className="dashboard-page">
      <NavbarApp onLogout={handleLogout} />
      <div className="titulo">
        <h1>Panel de Residente</h1>
      </div>
      <div className="subtitulo">
        <div className="subtitulo-banda">
          Bienvenido, {user?.nombre || user?.email || 'Residente'}
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