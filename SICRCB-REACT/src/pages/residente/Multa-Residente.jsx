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
  BookOpen,
  Info,
  X,
  FileText
} from "lucide-react"

export default function MultaResidente() {
  const navigate = useNavigate()
  const [multas, setMultas] = useState([])
  const [catalogoTipos, setCatalogoTipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterTab, setFilterTab] = useState("todas") // 'todas', 'pendientes', 'pagadas', 'catalogo'
  const [multaDetalle, setMultaDetalle] = useState(null)

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/login")
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [resMultas, resTipos] = await Promise.all([
          api.get("/multas/mis-multas"),
          api.get("/tipos_multa")
        ])
        setMultas(Array.isArray(resMultas.data) ? resMultas.data : [])
        setCatalogoTipos(Array.isArray(resTipos.data) ? resTipos.data : [])
      } catch (err) {
        console.error("Error al cargar información de sanciones:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filtrado de multas personales
  const multasFiltradas = multas.filter((m) => {
    const estado = (m.estado || "").toLowerCase()
    if (filterTab === "pendientes") return estado === "pendiente" || estado === "en proceso"
    if (filterTab === "pagadas") return estado === "resuelta" || estado === "pagada"
    return true
  })

  // Cálculos estadísticos
  const pendientesCount = multas.filter((m) => (m.estado || "").toLowerCase() === "pendiente").length
  const resueltasCount = multas.filter((m) => (m.estado || "").toLowerCase() === "resuelta" || (m.estado || "").toLowerCase() === "pagada").length
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
            <p>Consulta tus sanciones activas y el manual de infracciones del Conjunto Casa Blanca.</p>
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
              <span className="multas-kpi-sub">Requieren atención o pago</span>
            </div>
          </div>

          <div className="multas-kpi-card">
            <div className="multas-kpi-icon icon-success">
              <CheckCircle2 size={24} />
            </div>
            <div className="multas-kpi-data">
              <span className="multas-kpi-label">Historial Resueltas</span>
              <span className="multas-kpi-val">{resueltasCount}</span>
              <span className="multas-kpi-sub">Sanciones liquidadas</span>
            </div>
          </div>
        </section>

        {/* Barra de Filtros y Catálogo */}
        <div className="sicrcb-multas-tabs-bar">
          <div className="multas-tabs-group">
            <button
              type="button"
              className={`multas-tab-btn ${filterTab === "todas" ? "active" : ""}`}
              onClick={() => setFilterTab("todas")}
            >
              Mis Multas ({multas.length})
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
            <button
              type="button"
              className={`multas-tab-btn ${filterTab === "catalogo" ? "active" : ""}`}
              onClick={() => setFilterTab("catalogo")}
            >
              <BookOpen size={16} />
              <span>Reglamento & Tipos de Multas ({catalogoTipos.length})</span>
            </button>
          </div>
        </div>

        {/* Contenido según pestaña */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "#8C3200", fontWeight: "600" }}>
            Cargando información...
          </div>
        ) : filterTab === "catalogo" ? (
          /* Catálogo para el residente */
          <div className="catalogo-residente-seccion">
            <div style={{ marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.35rem", color: "var(--multas-primary)", fontWeight: "800", margin: "0 0 0.35rem 0" }}>
                Manual de Convivencia e Infracciones
              </h2>
              <p style={{ margin: 0, color: "var(--multas-text-muted)", fontSize: "0.9rem" }}>
                A continuación se relacionan los tipos de multas contemplados en el reglamento del conjunto y sus tarifas vigentes:
              </p>
            </div>

            <div className="resident-multas-grid">
              {catalogoTipos.map((tipo) => (
                <div key={tipo.id} className="resident-multa-card" style={{ borderLeft: "4px solid var(--multas-primary)" }}>
                  <div className="multa-card-header">
                    <div className="multa-title-wrap">
                      <strong>Infracción #{tipo.numero}</strong>
                    </div>
                    <span className={`sicrcb-status-badge status-${tipo.estado === "Activa" ? "pagada" : "anulada"}`}>
                      {tipo.estado}
                    </span>
                  </div>

                  <div className="multa-card-body">
                    <p className="multa-card-desc" style={{ minHeight: "60px", color: "#4a3226" }}>
                      {tipo.descripcion}
                    </p>
                    <div className="multa-amount-strip">
                      <small>Tarifa Reglamentaria:</small>
                      <span style={{ color: "var(--multas-primary)", fontWeight: "800", fontSize: "1.1rem" }}>
                        ${Number(tipo.valor || 0).toLocaleString("es-CO")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : multasFiltradas.length === 0 ? (
          /* Sin multas en la categoría */
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
          /* Cuadrícula de Multas Personales */
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
                      {(estado === "resuelta" || estado === "pagada") && <CheckCircle2 size={13} />}
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

                  <div className="multa-card-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => setMultaDetalle(m)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--multas-primary)",
                        fontWeight: "700",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        cursor: "pointer",
                        padding: 0
                      }}
                    >
                      <Info size={15} />
                      <span>Ver más información</span>
                    </button>

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

      {/* Modal: Detalle Completo de la Sanción para el Residente */}
      {multaDetalle && (
        <div className="sicrcb-modal-backdrop" onClick={() => setMultaDetalle(null)}>
          <div className="sicrcb-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px" }}>
            <div className="modal-card-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileText size={20} color="var(--multas-primary)" />
                <h3 style={{ margin: 0, fontSize: "1.15rem" }}>
                  Detalle de Sanción #{multaDetalle.numero || multaDetalle.id}
                </h3>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setMultaDetalle(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--multas-text-muted)", fontWeight: "600", textTransform: "uppercase" }}>
                  Motivo de la Sanción
                </span>
                <div style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--multas-text-dark)" }}>
                  {multaDetalle.nombre}
                </div>
              </div>

              <div style={{ background: "var(--multas-bg)", padding: "0.85rem 1rem", borderRadius: "10px", border: "1px solid var(--multas-border)" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--multas-primary)", fontWeight: "700", textTransform: "uppercase" }}>
                  Infracción Reglamentaria #{multaDetalle.numero_tipo_multa || "N/A"}
                </span>
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.88rem", color: "var(--multas-text-dark)", lineHeight: "1.4" }}>
                  {multaDetalle.descripcion_tipo_multa || "Descripción según estatutos de propiedad horizontal."}
                </p>
              </div>

              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--multas-text-muted)", fontWeight: "600", textTransform: "uppercase" }}>
                  Descripción de los Hechos Notificados
                </span>
                <p style={{ margin: "0.3rem 0 0 0", fontSize: "0.9rem", color: "var(--multas-text-dark)", lineHeight: "1.45" }}>
                  {multaDetalle.descripcion}
                </p>
              </div>

              {multaDetalle.evidencia && (
                <div>
                  <span style={{ fontSize: "0.8rem", color: "var(--multas-text-muted)", fontWeight: "600", textTransform: "uppercase" }}>
                    Registro / Evidencia
                  </span>
                  <div style={{ margin: "0.3rem 0 0 0", fontSize: "0.88rem", color: "#642300", fontStyle: "italic", background: "#fff", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px dashed var(--multas-border)" }}>
                    {multaDetalle.evidencia}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--multas-border)", paddingTop: "1rem" }}>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "var(--multas-text-muted)", fontWeight: "600" }}>ESTADO</span>
                  <div>
                    <span className={`sicrcb-status-badge status-${(multaDetalle.estado || "pendiente").toLowerCase()}`}>
                      {multaDetalle.estado || "Pendiente"}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--multas-text-muted)", fontWeight: "600" }}>TOTAL A CANCELAR</span>
                  <div style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--multas-primary)" }}>
                    ${Number(multaDetalle.monto || 0).toLocaleString("es-CO")}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-card-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => setMultaDetalle(null)}
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer style={{ marginTop: "auto" }} />
    </div>
  )
}