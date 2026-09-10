import React, { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import "../../assets/css/styles.css"
import "../../assets/css/alquiler-admin.css"
import NavbarApp from "../../components/NavbarApp.jsx"
import Footer from "../../components/Footer.jsx"
import {
  CalendarDays,
  Search,
  Check,
  X,
  Clock,
  Building,
  CheckCircle2,
  AlertCircle,
  XCircle,
  CalendarCheck
} from "lucide-react"

function AlquilerAdmin() {
  const navigate = useNavigate()
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("pendiente")
  const [procesando, setProcesando] = useState(null)
  const [busqueda, setBusqueda] = useState("")

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/login")
  }

  const normalizeSolicitudes = (payload) => {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.data)) return payload.data
    if (Array.isArray(payload?.solicitudes)) return payload.solicitudes
    if (Array.isArray(payload?.reservas)) return payload.reservas
    return []
  }

  const fetchSolicitudes = async () => {
    setLoading(true)
    try {
      const res = await api.get("/alquileres")
      setSolicitudes(normalizeSolicitudes(res.data))
    } catch (err) {
      console.error("Error al cargar solicitudes:", err)
      setError("No se pudieron cargar las solicitudes de alquiler.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSolicitudes()
  }, [])

  const actualizarEstado = async (id, nuevoEstado) => {
    try {
      setProcesando(id)
      await api.put(`/alquileres/${id}`, { estado: nuevoEstado })
      setSolicitudes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, estado: nuevoEstado } : s))
      )
    } catch (err) {
      console.error("Error al actualizar estado:", err)
    } finally {
      setProcesando(null)
    }
  }

  const stats = useMemo(() => ({
    todas: solicitudes.length,
    pendiente: solicitudes.filter((s) => (s.estado || "").toLowerCase() === "pendiente").length,
    aprobada: solicitudes.filter((s) => (s.estado || "").toLowerCase() === "aprobada").length,
    rechazada: solicitudes.filter((s) => (s.estado || "").toLowerCase() === "rechazada").length,
  }), [solicitudes])

  const solicitudesFiltradas = solicitudes
    .filter((s) => (activeTab === "todas" ? true : (s.estado || "").toLowerCase() === activeTab))
    .filter((s) => {
      const q = busqueda.trim().toLowerCase()
      if (!q) return true
      const residente = (s.residente_nombre || "").toLowerCase()
      const espacio = (s.espacio || "salón comunal").toLowerCase()
      return residente.includes(q) || espacio.includes(q)
    })

  return (
    <div className="alquiler-page">
      <NavbarApp onLogout={handleLogout} />

      <main className="alquiler-main-container">
        {/* Banner Superior */}
        <section className="sicrcb-alq-hero">
          <div className="alq-hero-text">
            <h1>
              <span>Aprobación de Alquileres</span>
              <CalendarCheck size={26} stroke="#FFD0A0" />
            </h1>
            <p>Control de disponibilidad y validación de pagos del Salón Comunal.</p>
          </div>
          <div className="alq-hero-badge">
            <Clock size={16} stroke="#FFD0A0" />
            <span>{stats.pendiente} Solicitudes por Revisar</span>
          </div>
        </section>

        {/* KPIs y Filtros en Barra de Estado */}
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

        {/* Tabla con Buscador Integrado */}
        <div className="sicrcb-alq-table-card">
          <div className="alq-toolbar">
            <span style={{ fontWeight: "800", color: "#8C3200", fontSize: "1.05rem" }}>
              Listado de Reservas ({activeTab.toUpperCase()})
            </span>

            <div className="alq-table-search">
              <Search size={16} className="alq-search-icon" />
              <input
                type="text"
                placeholder="Buscar por residente o espacio..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          <div className="sicrcb-table-responsive">
            <table className="sicrcb-data-table">
              <thead>
                <tr>
                  <th>Residente / Solicitante</th>
                  <th>Espacio Requerido</th>
                  <th>Fecha del Evento</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Decisión</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "3rem" }}>
                      Cargando solicitudes de alquiler...
                    </td>
                  </tr>
                ) : solicitudesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "#8C3200" }}>
                      No hay solicitudes registradas en esta categoría.
                    </td>
                  </tr>
                ) : (
                  solicitudesFiltradas.map((s) => {
                    const estado = (s.estado || "pendiente").toLowerCase()
                    return (
                      <tr key={s.id}>
                        <td>
                          <strong>{s.residente_nombre || "Copropietario"}</strong>
                          <div style={{ fontSize: "0.78rem", color: "#735340" }}>
                            {s.apartamento ? `Apto ${s.apartamento}` : "Residente registrado"}
                          </div>
                        </td>
                        <td>{s.espacio || "Salón Comunal + 50 Sillas"}</td>
                        <td>
                          {s.fecha ? new Date(s.fecha).toLocaleDateString("es-CO") : "Fecha por definir"}
                        </td>
                        <td>
                          <span className={`sicrcb-status-badge status-${estado}`}>
                            {s.estado || "Pendiente"}
                          </span>
                        </td>
                        <td>
                          <div className="alq-action-btns" style={{ justifyContent: "flex-end" }}>
                            {estado === "pendiente" ? (
                              <>
                                <button
                                  type="button"
                                  className="btn-alq-approve"
                                  disabled={procesando === s.id}
                                  onClick={() => actualizarEstado(s.id, "aprobada")}
                                >
                                  <Check size={14} />
                                  <span>Aprobar</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn-alq-reject"
                                  disabled={procesando === s.id}
                                  onClick={() => actualizarEstado(s.id, "rechazada")}
                                >
                                  <X size={14} />
                                  <span>Rechazar</span>
                                </button>
                              </>
                            ) : (
                              <span style={{ fontSize: "0.8rem", color: "#735340", fontStyle: "italic" }}>
                                Tramitado
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer style={{ marginTop: "auto" }} />
    </div>
  )
}

export default AlquilerAdmin