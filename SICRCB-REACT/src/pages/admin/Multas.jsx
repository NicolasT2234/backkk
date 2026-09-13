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
  ShieldAlert,
  Filter,
  BookOpen,
  X,
  CheckCircle2,
  AlertCircle
} from "lucide-react"

export default function Multas() {
  const navigate = useNavigate()

  // Pestañas principales: 'buscar' (directorio), 'nueva' (crear multa), 'tipos' (catálogo)
  const [activeTab, setActiveTab] = useState("buscar")
  const [searchTerm, setSearchTerm] = useState("")
  const [searchTipoTerm, setSearchTipoTerm] = useState("")

  // Estados de datos
  const [multas, setMultas] = useState([])
  const [tiposMulta, setTiposMulta] = useState([])
  const [apartamentos, setApartamentos] = useState([])
  const [loading, setLoading] = useState(true)

  // Notificación flotante Toast
  const [toastMsg, setToastMsg] = useState({ text: "", type: "" })

  const showToast = (text, type = "success") => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg({ text: "", type: "" }), 3000)
  }

  // Formulario nueva multa a residente
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    id_tipo_multa: "",
    idApartamento: "",
    evidencia: ""
  })
  const [formMsg, setFormMsg] = useState({ error: "", success: "" })

  // Modal para agregar nuevo tipo de multa
  const [modalTipoOpen, setModalTipoOpen] = useState(false)
  const [nuevoTipoData, setNuevoTipoData] = useState({
    numero: "",
    descripcion: "",
    valor: "",
    estado: "Activa"
  })
  const [tipoMsg, setTipoMsg] = useState({ error: "", success: "" })

  // Modal para editar datos completos de un tipo de multa
  const [modalEditTipoOpen, setModalEditTipoOpen] = useState(false)
  const [tipoAEditar, setTipoAEditar] = useState(null)
  const [editTipoMsg, setEditTipoMsg] = useState({ error: "", success: "" })

  // Modal para editar estado de la multa aplicada a residente
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [multaAEditar, setMultaAEditar] = useState(null)
  const [nuevoEstado, setNuevoEstado] = useState("")
  const [modalEditError, setModalEditError] = useState("")

  // Modal de confirmación para eliminar multa
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

  // Cargar datos desde la API
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
      console.error("Error al cargar datos del módulo de multas:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // ==========================================
  // GESTIÓN DE ESTADO: TIPOS DE MULTA
  // ==========================================
  const handleCambiarEstadoTipo = async (idTipo, nuevoEstado) => {
    try {
      await api.put(`/tipos_multa/${idTipo}`, { estado: nuevoEstado })
      showToast(`Infracción marcada como "${nuevoEstado}"`, "success")

      setTiposMulta((prev) =>
        prev.map((t) => (t.id === idTipo ? { ...t, estado: nuevoEstado } : t))
      )
    } catch (err) {
      console.error("Error al actualizar tipo de multa:", err)
      const errorText = err.response?.data?.error || "Error al actualizar el estado de la infracción"
      showToast(errorText, "error")
    }
  }

  const handleGuardarEdicionTipo = async (e) => {
    e.preventDefault()
    setEditTipoMsg({ error: "", success: "" })

    if (!tipoAEditar.numero || !tipoAEditar.descripcion || !tipoAEditar.valor) {
      setEditTipoMsg({ error: "Todos los campos son obligatorios.", success: "" })
      return
    }

    try {
      await api.put(`/tipos_multa/${tipoAEditar.id}`, {
        numero: tipoAEditar.numero,
        descripcion: tipoAEditar.descripcion,
        valor: tipoAEditar.valor,
        estado: tipoAEditar.estado
      })
      showToast("Tipo de multa modificado exitosamente", "success")
      setModalEditTipoOpen(false)
      fetchData()
    } catch (err) {
      console.error("Error al actualizar tipo de multa:", err)
      setEditTipoMsg({
        error: err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || "Error al actualizar.",
        success: ""
      })
    }
  }

  const handleCrearTipoSubmit = async (e) => {
    e.preventDefault()
    setTipoMsg({ error: "", success: "" })

    if (!nuevoTipoData.numero || !nuevoTipoData.descripcion || !nuevoTipoData.valor) {
      setTipoMsg({ error: "Todos los campos son obligatorios.", success: "" })
      return
    }

    try {
      await api.post("/tipos_multa", nuevoTipoData)
      setTipoMsg({ error: "", success: "Tipo de multa guardado en el catálogo." })
      setNuevoTipoData({ numero: "", descripcion: "", valor: "", estado: "Activa" })
      fetchData()
      setTimeout(() => {
        setModalTipoOpen(false)
        setTipoMsg({ error: "", success: "" })
      }, 1000)
    } catch (err) {
      setTipoMsg({
        error: err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || "Error al crear tipo de multa.",
        success: ""
      })
    }
  }

  // ==========================================
  // GESTIÓN DE MULTAS APLICADAS A RESIDENTES
  // ==========================================
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
      setTimeout(() => setActiveTab("buscar"), 1300)
    } catch (err) {
      console.error("Error al registrar sanción:", err)
      const mensajeServidor =
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.message ||
        "Error al registrar la sanción. Verifica los datos."
      setFormMsg({ error: mensajeServidor, success: "" })
    }
  }

  const handleCambiarEstadoMulta = async (idMulta, estadoDestino) => {
    try {
      await api.put(`/multas/${idMulta}`, { estado: estadoDestino })
      showToast(`Estado actualizado a "${estadoDestino}"`, "success")
      setMultas((prev) =>
        prev.map((m) => ((m.id === idMulta || m.idMulta === idMulta) ? { ...m, estado: estadoDestino } : m))
      )
      setEditModalOpen(false)
    } catch (err) {
      console.error("Error al cambiar estado:", err)
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || "Error al actualizar estado"
      setModalEditError(msg)
      showToast(msg, "error")
    }
  }

  const handleEliminarMulta = async () => {
    if (!idAEliminar) return
    try {
      await api.delete(`/multas/${idAEliminar}`)
      setDeleteModalOpen(false)
      showToast("Sanción eliminada del sistema", "success")
      fetchData()
    } catch (err) {
      console.error("Error al eliminar multa:", err)
      showToast("No se pudo eliminar la sanción", "error")
    }
  }

  // Filtros de búsqueda
  const multasFiltradas = multas.filter((m) => {
    const term = searchTerm.toLowerCase()
    const nombre = (m.nombre || "").toLowerCase()
    const desc = (m.descripcion || "").toLowerCase()
    const bloque = (m.bloque || "").toLowerCase()
    const interior = (m.interior || "").toString().toLowerCase()
    const apto = (m.numero_apartamento || m.numero || "").toString().toLowerCase()
    return (
      nombre.includes(term) ||
      desc.includes(term) ||
      bloque.includes(term) ||
      interior.includes(term) ||
      apto.includes(term)
    )
  })

  const tiposFiltrados = tiposMulta.filter((t) => {
    const term = searchTipoTerm.toLowerCase()
    const num = (t.numero || "").toString().toLowerCase()
    const desc = (t.descripcion || "").toLowerCase()
    return num.includes(term) || desc.includes(term)
  })

  return (
    <div className="multas-page">
      <NavbarApp onLogout={handleLogout} />

      {/* Toast Flotante */}
      {toastMsg.text && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            backgroundColor: toastMsg.type === "success" ? "#046c4e" : "#c81e1e",
            color: "#ffffff",
            padding: "0.85rem 1.4rem",
            borderRadius: "10px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            fontWeight: "600",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          {toastMsg.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      <main className="multas-main-container">
        {/* Banner Superior Administrativo */}
        <section className="sicrcb-multas-hero">
          <div className="multas-hero-text">
            <h1>
              <span>Administración de Multas & Sanciones</span>
              <ShieldAlert size={26} stroke="#FFD0A0" />
            </h1>
            <p>Control y gestión del manual de convivencia y sanciones en el Conjunto Casa Blanca.</p>
          </div>
          <div className="multas-hero-badge">
            <ReceiptText size={16} stroke="#FFD0A0" />
            <span>{multas.length} Sanciones | {tiposMulta.length} Infracciones Catalogadas</span>
          </div>
        </section>

        {/* Barra de pestañas y buscadores */}
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
              <span>Registrar Sanción</span>
            </button>
            <button
              type="button"
              className={`multas-tab-btn ${activeTab === "tipos" ? "active" : ""}`}
              onClick={() => setActiveTab("tipos")}
            >
              <BookOpen size={16} />
              <span>Catálogo de Infracciones ({tiposMulta.length})</span>
            </button>
          </div>

          {activeTab === "buscar" && (
            <div className="multas-search-box">
              <Search size={17} className="multas-search-icon" />
              <input
                type="text"
                className="multas-search-input"
                placeholder="Buscar por motivo, torre, interior o apto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}

          {activeTab === "tipos" && (
            <div className="multas-search-box">
              <Search size={17} className="multas-search-icon" />
              <input
                type="text"
                className="multas-search-input"
                placeholder="Buscar tipo de multa o artículo..."
                value={searchTipoTerm}
                onChange={(e) => setSearchTipoTerm(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Pestaña 1: Directorio & Tabla de Multas Aplicadas */}
        {activeTab === "buscar" && (
          <div className="sicrcb-table-card">
            <div className="sicrcb-table-responsive">
              <table className="sicrcb-data-table">
                <thead>
                  <tr>
                    <th>Infracción / Motivo</th>
                    <th>Ubicación (Torre • Int • Apto)</th>
                    <th>Tipo Infracción</th>
                    <th>Monto Liquidado</th>
                    <th style={{ width: "160px" }}>Cambiar Estado</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "3rem" }}>
                        Cargando registro de multas...
                      </td>
                    </tr>
                  ) : multasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "3rem", color: "#8C3200" }}>
                        No se encontraron sanciones con los criterios de búsqueda.
                      </td>
                    </tr>
                  ) : (
                    multasFiltradas.map((m) => {
                      const id = m.id || m._id || m.idMulta
                      const estado = m.estado || "Pendiente"
                      return (
                        <tr key={id}>
                          <td>
                            <strong>{m.nombre || "Infracción"}</strong>
                            <div style={{ fontSize: "0.8rem", color: "#735340" }}>
                              {m.descripcion ? m.descripcion.substring(0, 48) + "..." : ""}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: "700", color: "#2c1203" }}>
                              {m.bloque || "Torre A"} • Int {m.interior || "1"} • Apto {m.numero_apartamento || m.numero}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: "0.85rem", color: "#642300", fontWeight: "600" }}>
                              #{m.numero_tipo_multa || m.id_tipo_multa}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: "#8C3200" }}>
                              ${Number(m.monto || 0).toLocaleString("es-CO")}
                            </strong>
                          </td>
                          <td>
                            {/* Selector rápido de estado en la tabla */}
                            <select
                              className="multas-select"
                              style={{
                                padding: "0.35rem 0.5rem",
                                fontSize: "0.82rem",
                                fontWeight: "700",
                                borderRadius: "8px",
                                border: "1px solid var(--multas-border)",
                                backgroundColor:
                                  estado === "Resuelta"
                                    ? "#def7ec"
                                    : estado === "En proceso"
                                    ? "#e1effe"
                                    : "#fef08a",
                                color:
                                  estado === "Resuelta"
                                    ? "#03543f"
                                    : estado === "En proceso"
                                    ? "#1e429f"
                                    : "#713f12",
                                cursor: "pointer"
                              }}
                              value={estado}
                              onChange={(e) => handleCambiarEstadoMulta(id, e.target.value)}
                            >
                              <option value="Pendiente">Pendiente</option>
                              <option value="En proceso">En proceso</option>
                              <option value="Resuelta">Resuelta</option>
                            </select>
                          </td>
                          <td>
                            <div className="table-action-btns" style={{ justifyContent: "flex-end" }}>
                              <button
                                type="button"
                                className="btn-table-action btn-edit"
                                title="Editar estado por modal"
                                onClick={() => {
                                  setMultaAEditar(m)
                                  setNuevoEstado(m.estado || "Pendiente")
                                  setModalEditError("")
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
              <p>Diligencia la información del incidente para asignarlo al residente.</p>
            </div>

            <div className="form-card-body">
              {formMsg.error && (
                <div style={{ padding: "0.75rem", background: "#fde8e8", color: "#9b1c1c", borderRadius: "10px", marginBottom: "1.25rem", fontWeight: "600", fontSize: "0.9rem" }}>
                  {formMsg.error}
                </div>
              )}
              {formMsg.success && (
                <div style={{ padding: "0.75rem", background: "#def7ec", color: "#03543f", borderRadius: "10px", marginBottom: "1.25rem", fontWeight: "600", fontSize: "0.9rem" }}>
                  {formMsg.success}
                </div>
              )}

              <form onSubmit={handleCrearSubmit}>
                <div className="multas-field-group">
                  <label className="multas-label">Título / Motivo de la Sanción</label>
                  <input
                    type="text"
                    className="multas-input"
                    placeholder="Ej. Ruido excesivo en horas de descanso"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>

                <div className="multas-grid-2col">
                  <div className="multas-field-group">
                    <label className="multas-label">Tipo de Multa Reglamentaria</label>
                    <select
                      className="multas-select"
                      value={formData.id_tipo_multa}
                      onChange={(e) => setFormData({ ...formData, id_tipo_multa: e.target.value })}
                      required
                    >
                      <option value="">Selecciona tipo de multa...</option>
                      {tiposMulta
                        .filter((t) => t.estado === "Activa")
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            #{t.numero} - {t.descripcion.substring(0, 45)}... (${Number(t.valor || 0).toLocaleString("es-CO")})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="multas-field-group">
                    <label className="multas-label">Apartamento / Unidad (Torre • Int • Apto)</label>
                    <select
                      className="multas-select"
                      value={formData.idApartamento}
                      onChange={(e) => setFormData({ ...formData, idApartamento: e.target.value })}
                      required
                    >
                      <option value="">Selecciona apartamento...</option>
                      {apartamentos.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.bloque_nombre || a.bloque || "Torre A"} • Int {a.interior || "1"} • Apto {a.numero}
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
                    placeholder="Ej. Anotación en libro de portería #210 o URL de imagen"
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

        {/* Pestaña 3: Catálogo con Switch Slider Moderno */}
        {activeTab === "tipos" && (
          <div className="sicrcb-table-card">
            <div style={{ padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--multas-border)" }}>
              <div>
                <h3 style={{ margin: 0, color: "var(--multas-primary)", fontWeight: "800", fontSize: "1.2rem" }}>
                  Catálogo de Infracciones del Reglamento
                </h3>
                <p style={{ margin: "0.25rem 0 0 0", color: "var(--multas-text-muted)", fontSize: "0.85rem" }}>
                  Consulta, añade y activa o desactiva las sanciones reglamentarias.
                </p>
              </div>
              <button
                type="button"
                className="multas-tab-btn active"
                style={{ background: "var(--multas-primary)", color: "#fff", border: "none" }}
                onClick={() => setModalTipoOpen(true)}
              >
                <PlusCircle size={16} />
                <span>Añadir Tipo de Multa</span>
              </button>
            </div>

            <div className="sicrcb-table-responsive">
              <table className="sicrcb-data-table">
                <thead>
                  <tr>
                    <th style={{ width: "100px" }}>N° / Código</th>
                    <th>Descripción de la Infracción</th>
                    <th>Monto Base</th>
                    <th style={{ width: "140px" }}>Estado</th>
                    <th style={{ width: "90px", textAlign: "right" }}>Editar</th>
                  </tr>
                </thead>
                <tbody>
                  {tiposFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "3rem", color: "#8C3200" }}>
                        No hay tipos de multa registrados con ese criterio.
                      </td>
                    </tr>
                  ) : (
                    tiposFiltrados.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <span style={{ fontWeight: "800", color: "var(--multas-primary)", background: "rgba(140,50,0,0.08)", padding: "0.3rem 0.6rem", borderRadius: "8px" }}>
                            #{t.numero}
                          </span>
                        </td>
                        <td>
                          <div style={{ color: "var(--multas-text-dark)", lineHeight: "1.4" }}>
                            {t.descripcion}
                          </div>
                        </td>
                        <td>
                          <strong style={{ color: "#8C3200", fontSize: "1rem" }}>
                            ${Number(t.valor || 0).toLocaleString("es-CO")}
                          </strong>
                        </td>
                        <td style={{ verticalAlign: "middle" }}>
                          {/* SWITCH SLIDER ELEGANTE */}
                          <div
                            role="button"
                            title={`Clic para marcar como ${t.estado === "Activa" ? "Inactiva" : "Activa"}`}
                            onClick={() => handleCambiarEstadoTipo(t.id, t.estado === "Activa" ? "Inactiva" : "Activa")}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.6rem",
                              cursor: "pointer",
                              userSelect: "none",
                              padding: "0.2rem 0"
                            }}
                          >
                            <div
                              style={{
                                width: "38px",
                                height: "20px",
                                borderRadius: "12px",
                                backgroundColor: t.estado === "Activa" ? "#2e7d32" : "#cbd5e1",
                                position: "relative",
                                transition: "background-color 0.25s ease",
                                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.12)"
                              }}
                            >
                              <div
                                style={{
                                  width: "14px",
                                  height: "14px",
                                  borderRadius: "50%",
                                  backgroundColor: "#ffffff",
                                  position: "absolute",
                                  top: "3px",
                                  left: t.estado === "Activa" ? "21px" : "3px",
                                  transition: "left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.25)"
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: "0.82rem",
                                fontWeight: "700",
                                color: t.estado === "Activa" ? "#2e7d32" : "#64748b",
                                minWidth: "50px"
                              }}
                            >
                              {t.estado}
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn-table-action btn-edit"
                            title="Editar Tipo de Multa"
                            onClick={() => {
                              setTipoAEditar({ ...t })
                              setEditTipoMsg({ error: "", success: "" })
                              setModalEditTipoOpen(true)
                            }}
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Añadir Nuevo Tipo */}
      {modalTipoOpen && (
        <div className="sicrcb-modal-backdrop" onClick={() => setModalTipoOpen(false)}>
          <div className="sicrcb-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card-header">
              <h3>Añadir Tipo de Multa al Catálogo</h3>
              <button type="button" className="modal-close-btn" onClick={() => setModalTipoOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-card-body">
              {tipoMsg.error && (
                <div style={{ padding: "0.65rem", background: "#fde8e8", color: "#9b1c1c", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.85rem", fontWeight: "600" }}>
                  {tipoMsg.error}
                </div>
              )}
              {tipoMsg.success && (
                <div style={{ padding: "0.65rem", background: "#def7ec", color: "#03543f", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.85rem", fontWeight: "600" }}>
                  {tipoMsg.success}
                </div>
              )}

              <form onSubmit={handleCrearTipoSubmit}>
                <div className="multas-field-group">
                  <label className="multas-label">Número o Código de Falta</label>
                  <input
                    type="text"
                    className="multas-input"
                    placeholder="Ej. 1, 2, Art. 14"
                    value={nuevoTipoData.numero}
                    onChange={(e) => setNuevoTipoData({ ...nuevoTipoData, numero: e.target.value })}
                    required
                  />
                </div>

                <div className="multas-field-group">
                  <label className="multas-label">Descripción de la Infracción</label>
                  <textarea
                    rows={3}
                    className="multas-textarea"
                    placeholder="Detalla en qué consiste la infracción según estatutos..."
                    value={nuevoTipoData.descripcion}
                    onChange={(e) => setNuevoTipoData({ ...nuevoTipoData, descripcion: e.target.value })}
                    required
                  />
                </div>

                <div className="multas-grid-2col">
                  <div className="multas-field-group">
                    <label className="multas-label">Monto Fijado (COP)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="multas-input"
                      placeholder="Ej. 85000"
                      value={nuevoTipoData.valor}
                      onChange={(e) => setNuevoTipoData({ ...nuevoTipoData, valor: e.target.value })}
                      required
                    />
                  </div>

                  <div className="multas-field-group">
                    <label className="multas-label">Estado Inicial</label>
                    <select
                      className="multas-select"
                      value={nuevoTipoData.estado}
                      onChange={(e) => setNuevoTipoData({ ...nuevoTipoData, estado: e.target.value })}
                    >
                      <option value="Activa">Activa</option>
                      <option value="Inactiva">Inactiva</option>
                    </select>
                  </div>
                </div>

                <div className="modal-card-footer" style={{ padding: "1rem 0 0 0" }}>
                  <button type="button" className="btn-modal-cancel" onClick={() => setModalTipoOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-modal-confirm">
                    Guardar en Catálogo
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Datos de Tipo */}
      {modalEditTipoOpen && tipoAEditar && (
        <div className="sicrcb-modal-backdrop" onClick={() => setModalEditTipoOpen(false)}>
          <div className="sicrcb-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card-header">
              <h3>Modificar Tipo de Multa #{tipoAEditar.numero}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setModalEditTipoOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-card-body">
              {editTipoMsg.error && (
                <div style={{ padding: "0.65rem", background: "#fde8e8", color: "#9b1c1c", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.85rem", fontWeight: "600" }}>
                  {editTipoMsg.error}
                </div>
              )}

              <form onSubmit={handleGuardarEdicionTipo}>
                <div className="multas-field-group">
                  <label className="multas-label">Número / Código</label>
                  <input
                    type="text"
                    className="multas-input"
                    value={tipoAEditar.numero}
                    onChange={(e) => setTipoAEditar({ ...tipoAEditar, numero: e.target.value })}
                    required
                  />
                </div>

                <div className="multas-field-group">
                  <label className="multas-label">Descripción de la Infracción</label>
                  <textarea
                    rows={3}
                    className="multas-textarea"
                    value={tipoAEditar.descripcion}
                    onChange={(e) => setTipoAEditar({ ...tipoAEditar, descripcion: e.target.value })}
                    required
                  />
                </div>

                <div className="multas-grid-2col">
                  <div className="multas-field-group">
                    <label className="multas-label">Monto Fijado (COP)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="multas-input"
                      value={tipoAEditar.valor}
                      onChange={(e) => setTipoAEditar({ ...tipoAEditar, valor: e.target.value })}
                      required
                    />
                  </div>

                  <div className="multas-field-group">
                    <label className="multas-label">Estado</label>
                    <select
                      className="multas-select"
                      value={tipoAEditar.estado}
                      onChange={(e) => setTipoAEditar({ ...tipoAEditar, estado: e.target.value })}
                    >
                      <option value="Activa">Activa</option>
                      <option value="Inactiva">Inactiva</option>
                    </select>
                  </div>
                </div>

                <div className="modal-card-footer" style={{ padding: "1rem 0 0 0" }}>
                  <button type="button" className="btn-modal-cancel" onClick={() => setModalEditTipoOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-modal-confirm">
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Estado Multa Aplicada a Residente */}
      {editModalOpen && (
        <div className="sicrcb-modal-backdrop" onClick={() => setEditModalOpen(false)}>
          <div className="sicrcb-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card-header">
              <h3>Actualizar Estado de la Sanción</h3>
              <button type="button" className="modal-close-btn" onClick={() => setEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-card-body">
              {modalEditError && (
                <div style={{ padding: "0.65rem", background: "#fde8e8", color: "#9b1c1c", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.85rem", fontWeight: "600" }}>
                  {modalEditError}
                </div>
              )}
              <p style={{ margin: "0 0 1rem 0", color: "#594234", fontSize: "0.92rem" }}>
                Selecciona el nuevo estado para: <strong>{multaAEditar?.nombre}</strong>
              </p>
              <div className="multas-field-group">
                <select
                  className="multas-select"
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En proceso">En proceso</option>
                  <option value="Resuelta">Resuelta</option>
                </select>
              </div>
            </div>
            <div className="modal-card-footer">
              <button type="button" className="btn-modal-cancel" onClick={() => setEditModalOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-modal-confirm"
                onClick={() => {
                  const id = multaAEditar.id || multaAEditar._id || multaAEditar.idMulta
                  handleCambiarEstadoMulta(id, nuevoEstado)
                }}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmación Eliminar */}
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
                ¿Estás seguro de que deseas eliminar este registro de sanción? Se removerá del estado de cuenta del residente.
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