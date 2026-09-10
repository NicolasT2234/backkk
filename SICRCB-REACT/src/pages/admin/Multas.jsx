import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import "../../assets/css/styles.css"
import "../../assets/css/multas.css"
import NavbarApp from "../../components/NavbarApp.jsx"
import Footer from "../../components/Footer.jsx"
import {
  ReceiptText,
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Building,
  Filter,
  X
} from "lucide-react"

export default function Multas() {
  const navigate = useNavigate()

  // Tabs: 'buscar' (directorio) o 'nueva' (formulario registro)
  const [activeTab, setActiveTab] = useState("buscar")
  const [searchTerm, setSearchTerm] = useState("")

  // Estados de datos
  const [multas, setMultas] = useState([])
  const [tiposMulta, setTiposMulta] = useState([])
  const [apartamentos, setApartamentos] = useState([])
  const [loading, setLoading] = useState(true)

  // Formulario nueva multa
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    id_tipo_multa: "",
    idApartamento: "",
    evidencia: ""
  })
  const [formMsg, setFormMsg] = useState({ error: "", success: "" })

  // Modal de edición de estado
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [multaAEditar, setMultaAEditar] = useState(null)
  const [nuevoEstado, setNuevoEstado] = useState("")

  // Modal de eliminación
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [idAEliminar, setIdAEliminar] = useState(null)

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout")
    } catch (e) {
      console.error(e)
    } finally {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      navigate("/")
    }
  }

  // Cargar datos
  const fetchData = async () => {
    setLoading(true)
    try {
      const [multasRes, tiposRes, aptosRes] = await Promise.all([
        api.get("/multas"),
        api.get("/tipos_multa"),
        api.get("/apartamentos")
      ])
      setMultas(Array.isArray(multasRes.data) ? multasRes.data : [])
      setTiposMulta(Array.isArray(tiposRes.data) ? tiposRes.data : [])
      setApartamentos(Array.isArray(aptosRes.data) ? aptosRes.data : [])
    } catch (err) {
      console.error("Error al cargar datos de multas:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Crear multa
  const handleCrearSubmit = async (e) => {
    e.preventDefault()
    setFormMsg({ error: "", success: "" })

    if (!formData.nombre || !formData.id_tipo_multa || !formData.idApartamento) {
      setFormMsg({ error: "Por favor diligencia todos los campos obligatorios.", success: "" })
      return
    }

    try {
      await api.post("/multas", formData)
      setFormMsg({ error: "", success: "Sanción registrada exitosamente en el sistema." })
      setFormData({
        nombre: "",
        descripcion: "",
        id_tipo_multa: "",
        idApartamento: "",
        evidencia: ""
      })
      fetchData()
      setTimeout(() => setActiveTab("buscar"), 1500)
    } catch (err) {
      setFormMsg({ error: "Error al crear la multa. Verifica los datos.", success: "" })
    }
  }

  // Actualizar estado
  const handleActualizarEstado = async () => {
    if (!multaAEditar || !nuevoEstado) return
    const id = multaAEditar.id || multaAEditar._id || multaAEditar.idMulta

    try {
      await api.put(`/multas/${id}`, { estado: nuevoEstado })
      setEditModalOpen(false)
      fetchData()
    } catch (err) {
      console.error("Error al actualizar:", err)
    }
  }

  // Eliminar multa
  const handleEliminarMulta = async () => {
    if (!idAEliminar) return
    try {
      await api.delete(`/multas/${idAEliminar}`)
      setDeleteModalOpen(false)
      fetchData()
    } catch (err) {
      console.error("Error al eliminar:", err)
    }
  }

  // Filtrado de multas en tiempo real
  const multasFiltradas = multas.filter((m) => {
    const term = searchTerm.toLowerCase()
    const nombre = (m.nombre || "").toLowerCase()
    const desc = (m.descripcion || "").toLowerCase()
    const apto = `${m.bloque || ""}-${m.numero || ""}`.toLowerCase()
    return nombre.includes(term) || desc.includes(term) || apto.includes(term)
  })

  return (
    <div className="multas-page">
      <NavbarApp onLogout={handleLogout} />

      <main className="multas-main-container">
        {/* Banner Superior Administrativo */}
        <section className="sicrcb-multas-hero">
          <div className="multas-hero-text">
            <h1>
              <span>Administración de Multas & Sanciones</span>
              <ShieldAlert size={26} stroke="#FFD0A0" />
            </h1>
            <p>Control del reglamento de propiedad horizontal del Conjunto Casa Blanca.</p>
          </div>
          <div className="multas-hero-badge">
            <ReceiptText size={16} stroke="#FFD0A0" />
            <span>{multas.length} Sanciones Registradas</span>
          </div>
        </section>

        {/* Navegación por pestañas & Buscador */}
        <div className="sicrcb-multas-tabs-bar">
          <div className="multas-tabs-group">
            <button
              type="button"
              className={`multas-tab-btn ${activeTab === "buscar" ? "active" : ""}`}
              onClick={() => setActiveTab("buscar")}
            >
              <Filter size={16} />
              <span>Directorio de Multas ({multas.length})</span>
            </button>
            <button
              type="button"
              className={`multas-tab-btn ${activeTab === "nueva" ? "active" : ""}`}
              onClick={() => setActiveTab("nueva")}
            >
              <PlusCircle size={16} />
              <span>Registrar Nueva Sanción</span>
            </button>
          </div>

          {activeTab === "buscar" && (
            <div className="multas-search-box">
              <Search size={17} className="multas-search-icon" />
              <input
                type="text"
                className="multas-search-input"
                placeholder="Buscar por motivo o apto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Pestaña 1: Directorio & Tabla de Multas */}
        {activeTab === "buscar" && (
          <div className="sicrcb-table-card">
            <div className="sicrcb-table-responsive">
              <table className="sicrcb-data-table">
                <thead>
                  <tr>
                    <th>Infracción / Motivo</th>
                    <th>Apartamento</th>
                    <th>Valor</th>
                    <th>Estado</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "3rem" }}>
                        Cargando registro de multas...
                      </td>
                    </tr>
                  ) : multasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "3rem", color: "#8C3200" }}>
                        No se encontraron sanciones con los criterios de búsqueda.
                      </td>
                    </tr>
                  ) : (
                    multasFiltradas.map((m) => {
                      const id = m.id || m._id || m.idMulta
                      const estado = (m.estado || "pendiente").toLowerCase()
                      return (
                        <tr key={id}>
                          <td>
                            <strong>{m.nombre || "Infracción"}</strong>
                            <div style={{ fontSize: "0.8rem", color: "#735340" }}>
                              {m.descripcion?.substring(0, 50)}...
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: "700" }}>
                              Torre {m.bloque || m.torre || "A"} - {m.numero_apartamento || m.numero || "101"}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: "#8C3200" }}>
                              ${Number(m.monto || 0).toLocaleString("es-CO")}
                            </strong>
                          </td>
                          <td>
                            <span className={`sicrcb-status-badge status-${estado}`}>
                              {m.estado || "Pendiente"}
                            </span>
                          </td>
                          <td>
                            <div className="table-action-btns" style={{ justifyContent: "flex-end" }}>
                              <button
                                type="button"
                                className="btn-table-action btn-edit"
                                title="Editar Estado"
                                onClick={() => {
                                  setMultaAEditar(m)
                                  setNuevoEstado(m.estado || "Pendiente")
                                  setEditModalOpen(true)
                                }}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                type="button"
                                className="btn-table-action btn-delete"
                                title="Eliminar Sanción"
                                onClick={() => {
                                  setIdAEliminar(id)
                                  setDeleteModalOpen(true)
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
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
        )}

        {/* Pestaña 2: Formulario Registrar Nueva Multa */}
        {activeTab === "nueva" && (
          <div className="multas-form-card">
            <div className="form-card-header">
              <h2>Registrar Sanción de Convivencia</h2>
              <p>Diligencia la información del incidente para notificar al residente.</p>
            </div>

            <div className="form-card-body">
              {formMsg.error && (
                <div style={{ padding: "0.75rem", background: "#fde8e8", color: "#9b1c1c", borderRadius: "10px", marginBottom: "1.25rem", fontWeight: "600" }}>
                  {formMsg.error}
                </div>
              )}
              {formMsg.success && (
                <div style={{ padding: "0.75rem", background: "#def7ec", color: "#03543f", borderRadius: "10px", marginBottom: "1.25rem", fontWeight: "600" }}>
                  {formMsg.success}
                </div>
              )}

              <form onSubmit={handleCrearSubmit}>
                <div className="multas-field-group">
                  <label className="multas-label">Título / Motivo de la Sanción</label>
                  <input
                    type="text"
                    className="multas-input"
                    placeholder="Ej. Exceso de ruido en horas de descanso"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>

                <div className="multas-grid-2col">
                  <div className="multas-field-group">
                    <label className="multas-label">Tipo de Multa</label>
                    <select
                      className="multas-select"
                      value={formData.id_tipo_multa}
                      onChange={(e) => setFormData({ ...formData, id_tipo_multa: e.target.value })}
                      required
                    >
                      <option value="">Selecciona tipo de multa</option>
                      {tiposMulta.map((t) => (
                        <option key={t.id || t.id_tipo_multa} value={t.id || t.id_tipo_multa}>
                          {t.nombre} (${Number(t.monto || 0).toLocaleString("es-CO")})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="multas-field-group">
                    <label className="multas-label">Apartamento / Unidad</label>
                    <select
                      className="multas-select"
                      value={formData.idApartamento}
                      onChange={(e) => setFormData({ ...formData, idApartamento: e.target.value })}
                      required
                    >
                      <option value="">Selecciona apartamento</option>
                      {apartamentos.map((a) => (
                        <option key={a.id || a.idApartamento} value={a.id || a.idApartamento}>
                          Torre {a.bloque} - Apto {a.numero || a.numero_apartamento}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="multas-field-group">
                  <label className="multas-label">Descripción de los Hechos</label>
                  <textarea
                    rows={4}
                    className="multas-textarea"
                    placeholder="Describe las circunstancias de tiempo, modo y lugar de la infracción..."
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    required
                  />
                </div>

                <div className="multas-field-group">
                  <label className="multas-label">Enlace o Detalle de Evidencia (Opcional)</label>
                  <input
                    type="text"
                    className="multas-input"
                    placeholder="Ej. Registro minuta portería #450"
                    value={formData.evidencia}
                    onChange={(e) => setFormData({ ...formData, evidencia: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn-primary-submit">
                  <PlusCircle size={18} />
                  <span>Aplicar Sanción</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Modal Editar Estado */}
      {editModalOpen && (
        <div className="sicrcb-modal-backdrop" onClick={() => setEditModalOpen(false)}>
          <div className="sicrcb-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card-header">
              <h3>Actualizar Estado de la Multa</h3>
              <button type="button" className="modal-close-btn" onClick={() => setEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-card-body">
              <p style={{ margin: "0 0 1rem 0", color: "#594234", fontSize: "0.92rem" }}>
                Selecciona el nuevo estado administrativo para la sanción: <strong>{multaAEditar?.nombre}</strong>
              </p>
              <div className="multas-field-group">
                <select
                  className="multas-select"
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Pagada">Pagada</option>
                  <option value="Resuelta">Resuelta</option>
                  <option value="Anulada">Anulada</option>
                </select>
              </div>
            </div>
            <div className="modal-card-footer">
              <button type="button" className="btn-modal-cancel" onClick={() => setEditModalOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="btn-modal-confirm" onClick={handleActualizarEstado}>
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Multa */}
      {deleteModalOpen && (
        <div className="sicrcb-modal-backdrop" onClick={() => setDeleteModalOpen(false)}>
          <div className="sicrcb-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card-header">
              <h3>Confirmar Eliminación</h3>
              <button type="button" className="modal-close-btn" onClick={() => setDeleteModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-card-body">
              <p style={{ margin: 0, color: "#594234", fontSize: "0.92rem", lineHeight: "1.5" }}>
                ¿Estás seguro de que deseas eliminar este registro de sanción? Esta acción removerá el cargo del estado de cuenta del residente.
              </p>
            </div>
            <div className="modal-card-footer">
              <button type="button" className="btn-modal-cancel" onClick={() => setDeleteModalOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="btn-modal-danger" onClick={handleEliminarMulta}>
                Eliminar Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer style={{ marginTop: "auto" }} />
    </div>
  )
}