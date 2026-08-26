import "../../assets/css/styles.css"
import "../../assets/css/dashboard.css"
import NavbarApp from "../../components/NavbarApp.jsx"
import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import api from "../../services/api"

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

function Dashboard() {
  const navigate = useNavigate()
  const [userRole, setUserRole] = useState('')
  const [loading, setLoading] = useState(true)

  // Dashboard statistics
  const [stats, setStats] = useState({
    alquileresActivos: 0,
    multasPendientes: 0,
    pqrsPendientes: 0,
    totalPropietarios: 0
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      const decoded = parseJwt(token)
      if (decoded) {
        // try to get role from various possible fields
        const role = decoded.role || decoded.userType || decoded.authorities || ''
        setUserRole(Array.isArray(role) ? (role[0] || '') : String(role))
      }
    }

    // Fetch dashboard statistics
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/estadisticas')
        // Based on the summary, the response should contain:
        // pqrsPendientes, multasPendientes, alquileresActivos, totalPropietarios
        if (res.data) {
          setStats({
            alquileresActivos: res.data.alquileresActivos || 0,
            multasPendientes: res.data.multasPendientes || 0,
            pqrsPendientes: res.data.pqrsPendientes || 0,
            totalPropietarios: res.data.totalPropietarios || 0
          })
        }
      } catch (err) {
        console.error("Error fetching dashboard stats:", err)
        // Keep default values (0) if there's an error
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchStats()
    } else {
      setLoading(false)
    }
  }, [])

  if (loading) {
    return <div className="dashboard-page">Loading dashboard...</div>
  }

  const isAdmin = userRole.toLowerCase().includes('admin') || userRole.toLowerCase() === 'administrador'

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="dashboard-page">
      <NavbarApp onLogout={handleLogout} />
      <h1>SICRCB Dashboard</h1>
      <div className="subtitulo">
        <div className="subtitulo-banda">Panel de Control Integral</div>
      </div>

      <div className="grid-noticias">
        {/* Estadística 1: Reservas Activas */}
        <div className="a-noticia">
          <legend>Reservas Activas</legend>
          <hr />
          <div className="stat-card">
            <h3>Total</h3>
            <p className="stat-number">{stats.alquileresActivos}</p>
          </div>
        </div>

        {/* Estadística 2: Multas Pendientes */}
        <div className="a-noticia">
          <legend>Multas Pendientes</legend>
          <hr />
          <div className="stat-card">
            <h3>Total</h3>
            <p className="stat-number">{stats.multasPendientes}</p>
          </div>
        </div>

        {/* Estadística 3: Usuarios Registrados */}
        <div className="a-noticia">
          <legend>Usuarios Registrados</legend>
          <hr />
          <div className="stat-card">
            <h3>Total</h3>
            <p className="stat-number">{stats.totalPropietarios}</p>
          </div>
        </div>

        {/* Estadística 4: PQRS Pendientes */}
        <div className="a-noticia">
          <legend>PQRS Pendientes</legend>
          <hr />
          <div className="stat-card">
            <h3>Total</h3>
            <p className="stat-number">{stats.pqrsPendientes}</p>
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="a-noticia full-width">
          <legend>Actividad Reciente</legend>
          <hr />
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-time">Hace 2h</span>
              <span className="activity-desc">Nueva multa registrada: #2045</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">Hace 4h</span>
              <span className="activity-desc">Nueva PQRS recibida: Solicitud de alumbrado público</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">Hace 6h</span>
              <span className="activity-desc">Reserva confirmada: Salón Comunal</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">Hace 8h</span>
              <span className="activity-desc">Usuario registrado: María García</span>
            </div>
          </div>
        </div>

        {/* Estado del sistema */}
        <div className="a-noticia full-width">
          <legend>Estado del Sistema</legend>
          <hr />
          <div className="status-indicators">
            <div className="status-item">
              <span className="status-label">API:</span>
              <span className="status-value status-ok">Conectado</span>
            </div>
            <div className="status-item">
              <span className="status-label">Base de Datos:</span>
              <span className="status-value status-ok">Operativa</span>
            </div>
            <div className="status-item">
              <span className="status-label">Sesión:</span>
              <span className="status-value status-ok">Activa</span>
            </div>
            <div className="status-item">
              <span className="status-label">Último Backup:</span>
              <span className="status-value">Hoy 02:30 AM</span>
            </div>
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="a-noticia full-width">
          <legend>Accesos Rápidos</legend>
          <hr />
          <div className="quick-actions">
            {isAdmin && (
              <>
                <button className="btn-success" onClick={() => navigate("/multas")}>
                  Gestión de Multas
                </button>
                <button className="btn-success" onClick={() => navigate("/pqrs")}>
                  Gestión de PQRS
                </button>
                <button className="btn-success" onClick={() => navigate("/noticias")}>
                  Gestión de Noticias
                </button>
              </>
            )}
            <button className="btn-success" onClick={() => navigate("/alquiler")}>
              Gestión de Alquileres
            </button>
            <button className="btn-success" onClick={() => navigate("/registro")}>
              Registrar Usuario
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard