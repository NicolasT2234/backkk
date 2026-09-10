import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import "../../assets/css/styles.css"
import "../../assets/css/multas.css"
import NavbarApp from "../../components/NavbarApp.jsx"
import Footer from "../../components/Footer.jsx"
import {
  ReceiptText,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  Building,
  HelpCircle,
  Phone
} from "lucide-react"

export default function MultaResidente() {
  const navigate = useNavigate()
  const [multas, setMultas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterTab, setFilterTab] = useState("todas") // 'todas', 'pendientes', 'pagadas'

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/login")
  }

  useEffect(() => {
    const fetchMultas = async () => {
      try {
        const res = await api.get("/multas/mis-multas")
        setMultas(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        console.error("Error al cargar multas:", err)
        setError("No se pudieron cargar las multas del residente.")
      } finally {
        setLoading(false)
      }
    }
    fetchMultas()
  }, [])

  // Filtrado de multas
  const multasFiltradas = multas.filter((m) => {
    const estado = (m.estado || "").toLowerCase()
    if (filterTab === "pendientes") return estado === "pendiente" || estado === "vencida"
    if (filterTab === "pagadas") return estado === "pagada" || estado === "resuelta"
    return true
  })

  // Cálculos estadísticos
  const pendientesCount = multas.filter((m) => (m.estado || "").toLowerCase() === "pendiente").length
  const resueltasCount = multas.filter((m) => (m.estado || "").toLowerCase() === "pagada" || (m.estado || "").toLowerCase() === "resuelta").length
  const totalDeuda = multas
    .filter((m) => (m.estado || "").toLowerCase() === "pendiente")
    .reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0)

  return (
    <div className="multas-page">
      <NavbarApp onLogout={handleLogout} />

      <main className="multas-main-container">
        {/* Banner Superior */}
        <section className="sicrcb-multas-hero">
          <div className="multas-hero-text">
            <h1>
              <span>Mis Multas & Convivencia</span>
              <ReceiptText size={26} stroke="#FFD0A0" />
            </h1>
            <p>Monitorea tu estado de cuenta de convivencia en el Conjunto Casa Blanca.</p>
          </div>
          <div className="multas-hero-badge">
            <ShieldCheck size={16} stroke="#FFD0A0" />
            <span>{pendientesCount === 0 ? "Paz y Salvo de Convivencia" : `${pendientesCount} pendiente(s)`}</span>
          </div>
        </section>

        {/* KPIs de Sanciones */}
        <section className="sicrcb-multas-kpis">
          <div className="multas-kpi-card">
            <div className={`multas-kpi-icon ${pendientesCount > 0 ? "icon-warning" : "icon-success"}`}>
              <DollarSign size={24} />
            </div>
            <div className="multas-kpi-data">
              <span className="multas-kpi-label">Saldo Pendiente</span>
              <span className="multas-kpi-val">${totalDeuda.toLocaleString("es-CO")}</span>
              <span className="multas-kpi-sub">Valor acumulado por pagar</span>
            </div>
          </div>

          <div className="multas-kpi-card">
            <div className={`multas-kpi-icon ${pendientesCount > 0 ? "icon-warning" : "icon-success"}`}>
              <AlertCircle size={24} />
            </div>
            <div className="multas-kpi-data">
              <span className="multas-kpi-label">Sanciones Activas</span>
              <span className="multas-kpi-val">{pendientesCount}</span>
              <span className="multas-kpi-sub">Requieren atención</span>
            </div>
          </div>

          <div className="multas-kpi-card">
            <div className="multas-kpi-icon icon-success">
              <CheckCircle2 size={24} />
            </div>
            <div className="multas-kpi-data">
              <span className="multas-kpi-label">Historial Pagadas</span>
              <span className="multas-kpi-val">{resueltasCount}</span>
              <span className="multas-kpi-sub">Sanciones resueltas</span>
            </div>
          </div>
        </section>

        {/* Barra de Filtros */}
        <div className="sicrcb-multas-tabs-bar">
          <div className="multas-tabs-group">
            <button
              type="button"
              className={`multas-tab-btn ${filterTab === "todas" ? "active" : ""}`}
              onClick={() => setFilterTab("todas")}
            >
              Todas ({multas.length})
            </button>
            <button
              type="button"
              className={`multas-tab-btn ${filterTab === "pendientes" ? "active" : ""}`}
              onClick={() => setFilterTab("pendientes")}
            >
              Pendientes ({pendientesCount})
            </button>
            <button
              type="button"
              className={`multas-tab-btn ${filterTab === "pagadas" ? "active" : ""}`}
              onClick={() => setFilterTab("pagadas")}
            >
              Resueltas ({resueltasCount})
            </button>
          </div>
        </div>

        {/* Lista de Sanciones o Estado Vacío */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "#8C3200" }}>
            Cargando estado de sanciones...
          </div>
        ) : multasFiltradas.length === 0 ? (
          <div className="multas-empty-state">
            <div className="empty-state-icon">
              <CheckCircle2 size={36} />
            </div>
            <h3>¡Estás al día con la convivencia!</h3>
            <p>
              No tienes sanciones registradas en esta categoría. Gracias por mantener un ambiente armonioso en el Conjunto Casa Blanca.
            </p>
          </div>
        ) : (
          <div className="resident-multas-grid">
            {multasFiltradas.map((m) => {
              const estado = (m.estado || "pendiente").toLowerCase()
              return (
                <div key={m.id || m._id} className="resident-multa-card">
                  <div className="multa-card-header">
                    <div className="multa-title-wrap">
                      <strong>{m.nombre || "Sanción de Convivencia"}</strong>
                      <span className="multa-id-tag">#{m.numero || m.id || "00"}</span>
                    </div>
                    <span className={`sicrcb-status-badge status-${estado}`}>
                      {estado === "pendiente" && <AlertCircle size={13} />}
                      {estado === "pagada" && <CheckCircle2 size={13} />}
                      {m.estado || "Pendiente"}
                    </span>
                  </div>

                  <div className="multa-card-body">
                    <p className="multa-card-desc">
                      {m.descripcion || "Infracción al reglamento de propiedad horizontal del conjunto."}
                    </p>
                    <div className="multa-amount-strip">
                      <small>Valor liquidado:</small>
                      <span>${Number(m.monto || 0).toLocaleString("es-CO")}</span>
                    </div>
                  </div>

                  <div className="multa-card-footer">
                    <small style={{ color: "#735340", fontSize: "0.8rem" }}>
                      Pago directamente en administración
                    </small>
                    <a
                      href="mailto:administracion@conjunto.com"
                      style={{ color: "#F47820", fontWeight: "700", fontSize: "0.82rem", textDecoration: "none" }}
                    >
                      Aclarar caso &rarr;
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <Footer style={{ marginTop: "auto" }} />
    </div>
  )
}