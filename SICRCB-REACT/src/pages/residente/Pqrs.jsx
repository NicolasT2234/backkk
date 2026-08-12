import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import "../../assets/css/styles.css"
import "../../assets/css/multas.css"
import "../../assets/css/pqrs.css"
import NavbarApp from "../../components/NavbarApp.jsx"
import Footer from "../../components/Footer.jsx"

function Pqrs() {

  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const [formData, setFormData] = useState({
    asunto: "",
    descripcion: "",
    fechaEnvio: "",
    archivo: null
  })

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [searchId, setSearchId] = useState("")
  const [searchResult, setSearchResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const [confirmUpdate, setConfirmUpdate] = useState(false)
  const [updateId, setUpdateId] = useState("")
  const [nuevoEstado, setNuevoEstado] = useState("")
  const [updateSuccess, setUpdateSuccess] = useState("")
  const [updateError, setUpdateError] = useState("")

  const [deleteId, setDeleteId] = useState("")
  const [deleteSuccess, setDeleteSuccess] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [showDeleteCard, setShowDeleteCard] = useState(false)
  const [activeTab, setActiveTab] = useState("nueva")

  const [historial, setHistorial] = useState([])
  const [historialLoading, setHistorialLoading] = useState(true)
  const [historialError, setHistorialError] = useState("")

  useEffect(() => {
    const fetchHistorial = async () => {
      setHistorialLoading(true)
      setHistorialError("")
      try {
        const res = await api.get("/pqrs")
        setHistorial(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        console.error("Error fetching PQR history:", err)
        setHistorialError("No se pudo cargar el historial de PQR.")
      } finally {
        setHistorialLoading(false)
      }
    }
    fetchHistorial()
  }, [success, updateSuccess, deleteSuccess])

  const getEstadoInfo = (estadoRaw) => {
    const estado = (estadoRaw || "pendiente").toLowerCase()
    if (estado.includes("resuelt") || estado.includes("cerrad")) {
      return { label: estadoRaw || "Resuelta", className: "badge-resuelta" }
    }
    if (estado.includes("proceso") || estado.includes("revisi")) {
      return { label: estadoRaw || "En proceso", className: "badge-proceso" }
    }
    return { label: estadoRaw || "Pendiente", className: "badge-pendiente" }
  }

  const totalPqr = historial.length
  const pendientesPqr = historial.filter((p) => getEstadoInfo(p.estado).className === "badge-pendiente").length
  const enProcesoPqr = historial.filter((p) => getEstadoInfo(p.estado).className === "badge-proceso").length
  const resueltasPqr = historial.filter((p) => getEstadoInfo(p.estado).className === "badge-resuelta").length

  const [filtroTexto, setFiltroTexto] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")

  const historialFiltrado = historial.filter((pqr) => {
    const asunto = (pqr.asunto || "").toLowerCase()
    const id = ((pqr.id || pqr._id || pqr.idPqr || "")).toString().toLowerCase()
    const coincideTexto = asunto.includes(filtroTexto.toLowerCase()) || id.includes(filtroTexto.toLowerCase())
    const coincideEstado = filtroEstado === "todos" || getEstadoInfo(pqr.estado).className === filtroEstado
    return coincideTexto && coincideEstado
  })


  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccess("")
    setError("")

    if (!formData.asunto || !formData.fechaEnvio) {
      setError("Complete todos los campos obligatorios")
      return
    }

    try {
      const payload = new FormData()
      payload.append("asunto", formData.asunto)
      payload.append("descripcion", formData.descripcion)
      payload.append("fechaEnvio", formData.fechaEnvio)
      if (formData.archivo) payload.append("archivo", formData.archivo)

      const res = await api.post("/pqrs", payload, {
        headers: { "Content-Type": "multipart/form-data" }
      })

      const id = res.data && (res.data.id || res.data._id || res.data.idPqr)
      setSuccess(id ? `PQR registrada con éxito (ID: ${id})` : "PQR registrada con éxito")

      setFormData({ asunto: "", descripcion: "", fechaEnvio: "", archivo: null })
    } catch (err) {
      console.error("Error creating PQR:", err)
      const serverMsg = err.response?.data?.message || err.response?.data || err.message
      setError(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg))
    }
  }

  const handleSearch = async (idOverride) => {
    const idToSearch = (idOverride ?? searchId).toString()
    setSearchResult(null)
    setError("")

    if (!idToSearch.trim()) {
      setError("Ingrese el ID de la PQR para buscar")
      return
    }

    setLoading(true)
    try {
      const res = await api.get(`/pqrs/${encodeURIComponent(idToSearch)}`)
      setSearchResult(res.data)
    } catch (err) {
      setError("No se encontró la PQR. Verifica el ID e intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const handleViewFromHistorial = (id) => {
    setActiveTab("buscar")
    setSearchId(id)
    handleSearch(id)
  }

  const handleUpdate = async () => {
    setUpdateSuccess("")
    setUpdateError("")

    if (!confirmUpdate) {
      setUpdateError("Confirma que deseas actualizar una PQR seleccionando 'Si'")
      return
    }

    if (!updateId.trim()) {
      setUpdateError("Ingrese el ID de la PQR para actualizar")
      return
    }

    if (!nuevoEstado.trim()) {
      setUpdateError("Ingrese el nuevo estado del PQR")
      return
    }

    try {
      const res = await api.put(`/pqrs/${encodeURIComponent(updateId)}`, { estado: nuevoEstado })
      const id = res.data && (res.data.id || res.data._id || res.data.idPqr)
      setUpdateSuccess(id ? `PQR actualizada correctamente (ID: ${id})` : "PQR actualizada correctamente")
      setUpdateId("")
      setNuevoEstado("")
    } catch (err) {
      console.error("Error updating PQR:", err)
      const serverMsg = err.response?.data?.message || err.response?.data || err.message
      setUpdateError(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg))
    }
  }

  const openDeleteConfirm = () => {
    setDeleteSuccess("")
    setDeleteError("")

    if (!deleteId.trim()) {
      setDeleteError("Ingrese el ID de la PQR para eliminar")
      return
    }

    setShowDeleteCard(true)
  }

  const cancelDelete = () => {
    setShowDeleteCard(false)
    setDeleteError("")
  }

  const handleDelete = async () => {
    setDeleteError("")

    try {
      await api.delete(`/pqrs/${encodeURIComponent(deleteId)}`)
      setDeleteSuccess("PQR eliminada correctamente")
      setDeleteId("")
      setShowDeleteCard(false)
    } catch (err) {
      console.error("Error deleting PQR:", err)
      const serverMsg = err.response?.data?.message || err.response?.data || err.message
      setDeleteError(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg))
    }
  }

  return (
    <>
      <NavbarApp onLogout={handleLogout} />
      <div className="pqrs-page">
        <div className="titulo">
          <h1>PQR</h1>
        </div>

        <div className="subtitulo">
          <span className="subtitulo-banda">Peticiones, Quejas y Reclamos</span>
        </div>

        <div className="page-layout">

          <div className="a-noticia side-card" aria-hidden="false">
            <h6>¿Cómo funciona?</h6>
            <hr />
            <p>Registra tu PQR y guarda el ID que se genera para hacerle seguimiento.</p>
            <p>Puedes adjuntar un documento de soporte si lo consideras necesario.</p>
            <p>Recibirás una respuesta dentro de los tiempos establecidos por ley.</p>
          </div>

          <div className="panel-container">
            <div className="a-noticia panel">

              <div className="tabs-bar">
                <button type="button" className={activeTab === "nueva" ? "btn-success" : ""} onClick={() => setActiveTab("nueva")}>Registrar</button>
                <button type="button" className={activeTab === "buscar" ? "btn-success" : ""} onClick={() => setActiveTab("buscar")}>Buscar</button>
                <button type="button" className={activeTab === "actualizar" ? "btn-success" : ""} onClick={() => setActiveTab("actualizar")}>Actualizar</button>
                <button type="button" className={activeTab === "eliminar" ? "btn-danger" : ""} onClick={() => setActiveTab("eliminar")}>Eliminar</button>
              </div>
              <hr />

              {/* --- Registrar PQR --- */}
              {activeTab === "nueva" && (
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">Asunto</label>
                      <input type="text" placeholder="Ej: Falla en el alumbrado" className="input" value={formData.asunto} onChange={(e) => setFormData({...formData, asunto: e.target.value})} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Fecha de envío</label>
                      <input type="datetime-local" className="input" required value={formData.fechaEnvio} onChange={(e) => setFormData({...formData, fechaEnvio: e.target.value})} />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">Descripción</label>
                      <input type="text" placeholder="Describe tu petición, queja o reclamo" className="input" value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Documento adjunto</label>
                      <input type="file" className="input" onChange={(e) => setFormData({...formData, archivo: e.target.files[0] || null})} />
                    </div>
                  </div>

                  <div className="form-footer">
                    <button type="submit" className="btn-success">Agregar</button>
                    <p className="hint"><i>El PQR genera un ID al ser registrado</i></p>
                  </div>
                  {success && <p className="success">{success}</p>}
                  {error && <p className="error">{error}</p>}
                </form>
              )}

              {/* --- Buscar PQR --- */}
              {activeTab === "buscar" && (
                <div>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">ID de la PQR</label>
                      <input type="text" placeholder="#12345" className="input" value={searchId} onChange={(e) => setSearchId(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-footer">
                    <button type="button" onClick={handleSearch}>Buscar</button>
                    {loading && <p className="hint">Buscando...</p>}
                  </div>
                  {error && <p className="error">{error}</p>}

                  {searchResult && (
                    <div className="search-result">
                      <p><strong>ID:</strong> {searchResult.id || searchResult._id}</p>
                      <p><strong>Asunto:</strong> {searchResult.asunto}</p>
                      <p><strong>Estado:</strong> {searchResult.estado}</p>
                      <div className="form-row">
                        <p><strong>Descripción:</strong> {searchResult.descripcion}</p>
                        <p><strong>Fecha:</strong> {searchResult.fechaEnvio}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- Actualizar PQR --- */}
              {activeTab === "actualizar" && (
                <div>
                  {!confirmUpdate ? (
                    <div className="form-footer">
                      <button type="button" className="btn-success" onClick={() => setConfirmUpdate(true)}>Actualizar estado</button>
                    </div>
                  ) : (
                    <>
                      <div className="form-row">
                        <div className="form-field">
                          <label className="form-label">ID de la PQR</label>
                          <input type="text" placeholder="#12345" className="input" value={updateId} onChange={(e) => setUpdateId(e.target.value)} />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Nuevo estado</label>
                          <input type="text" placeholder="Ej: En revisión" className="input" value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)} />
                        </div>
                      </div>

                      <div className="form-footer">
                        <button type="button" className="btn-success" onClick={handleUpdate}>Guardar cambios</button>
                        <button type="button" onClick={() => { setConfirmUpdate(false); setUpdateError(""); setUpdateSuccess("") }}>Cancelar</button>
                      </div>
                    </>
                  )}
                  {updateSuccess && <p className="success">{updateSuccess}</p>}
                  {updateError && <p className="error">{updateError}</p>}
                </div>
              )}

              {/* --- Eliminar PQR --- */}
              {activeTab === "eliminar" && (
                <div>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">ID de la PQR</label>
                      <input type="text" placeholder="#12345" className="input" value={deleteId} onChange={(e) => setDeleteId(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-footer">
                    <button type="button" className="btn-danger" onClick={openDeleteConfirm}>Eliminar</button>
                  </div>
                  {deleteSuccess && <p className="success">{deleteSuccess}</p>}
                  {deleteError && <p className="error">{deleteError}</p>}

                  {showDeleteCard && (
                    <div className="card">
                      <div className="header">
                        <div className="image">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                          </svg>
                        </div>
                        <div className="content">
                          <span className="title">¿Eliminar esta PQR?</span>
                          <p className="message">Esta acción no se puede deshacer. La PQR con ID {deleteId} se eliminará permanentemente.</p>
                        </div>
                      </div>
                      <div className="actions">
                        <button className="desactivate" type="button" onClick={handleDelete}>Sí, eliminar</button>
                        <button className="cancel" type="button" onClick={cancelDelete}>Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          <div className="a-noticia side-card">
            <h6>Tiempos de respuesta</h6>
            <hr />
            <p>Peticiones: hasta 15 días hábiles.</p>
            <p>Quejas y reclamos: hasta 15 días hábiles.</p>
            <p>Puedes consultar el estado en cualquier momento con tu ID.</p>
          </div>

        </div>

        <div className="historial-section">
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-number">{totalPqr}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{pendientesPqr}</span>
              <span className="stat-label">Pendientes</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{enProcesoPqr}</span>
              <span className="stat-label">En proceso</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{resueltasPqr}</span>
              <span className="stat-label">Resueltas</span>
            </div>
          </div>

          <div className="a-noticia historial-card">
            <h6>Historial de PQR</h6>
            <hr />

            {!historialLoading && !historialError && historial.length > 0 && (
              <div className="filtros-row">
                <input
                  type="text"
                  className="input filtro-input"
                  placeholder="Buscar por ID o asunto..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                />
                <select
                  className="input filtro-select"
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <option value="todos">Todos los estados</option>
                  <option value="badge-pendiente">Pendientes</option>
                  <option value="badge-proceso">En proceso</option>
                  <option value="badge-resuelta">Resueltas</option>
                </select>
              </div>
            )}

            {historialLoading && <p className="hint">Cargando historial...</p>}
            {historialError && <p className="error">{historialError}</p>}
            {!historialLoading && !historialError && historial.length === 0 && (
              <p className="hint">Aún no tienes PQR registradas.</p>
            )}
            {!historialLoading && !historialError && historial.length > 0 && historialFiltrado.length === 0 && (
              <p className="hint">Ningún resultado coincide con tu búsqueda.</p>
            )}

            {!historialLoading && historialFiltrado.length > 0 && (
              <div className="table-wrapper">
                <table className="historial-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Asunto</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialFiltrado.map((pqr) => {
                      const id = pqr.id || pqr._id || pqr.idPqr
                      const estadoInfo = getEstadoInfo(pqr.estado)
                      return (
                        <tr key={id}>
                          <td>{id}</td>
                          <td>{pqr.asunto}</td>
                          <td>{pqr.fechaEnvio ? new Date(pqr.fechaEnvio).toLocaleDateString() : "-"}</td>
                          <td><span className={`badge ${estadoInfo.className}`}>{estadoInfo.label}</span></td>
                          <td>
                            <button type="button" className="btn-ver" onClick={() => handleViewFromHistorial(id)}>Ver</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </>
  )
}

export default Pqrs