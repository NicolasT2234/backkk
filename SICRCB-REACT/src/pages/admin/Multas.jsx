import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import "../../assets/css/styles.css"
import "../../assets/css/multas.css"
import NavbarApp from "../../components/NavbarApp.jsx"
import Footer from "../../components/Footer.jsx"

function Multas() {

  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const [formData, setFormData] = useState({
    factura: null,
    fechaPublicacion: ""
  })

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [searchId, setSearchId] = useState("")
  const [searchResult, setSearchResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const [confirmUpdate, setConfirmUpdate] = useState(false)
  const [updateId, setUpdateId] = useState("")
  const [nuevoEstado, setNuevoEstado] = useState(null)
  const [updateSuccess, setUpdateSuccess] = useState("")
  const [updateError, setUpdateError] = useState("")

  const [deleteId, setDeleteId] = useState("")
  const [deleteSuccess, setDeleteSuccess] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [showDeleteCard, setShowDeleteCard] = useState(false)
  const [activeTab, setActiveTab] = useState("nueva")

  // States for the general list of multas
  const [multas, setMultas] = useState([])
  const [multasLoading, setMultasLoading] = useState(true)
  const [multasError, setMultasError] = useState("")

  useEffect(() => {
    const fetchMultasList = async () => {
      setMultasLoading(true)
      setMultasError("")
      try {
        const res = await api.get("/multas")
        setMultas(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        console.error("Error fetching multas list:", err)
        setMultasError("No se pudo cargar la lista de multas")
        setMultas([])
      } finally {
        setMultasLoading(false)
      }
    }

    fetchMultasList()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccess("")
    setError("")

    if (!formData.fechaPublicacion) {
      setError("Complete todos los campos obligatorios")
      return
    }

    try {
      const payload = new FormData()
      if (formData.factura) payload.append("factura", formData.factura)
      payload.append("fechaPublicacion", formData.fechaPublicacion)

      const res = await api.post("/multas", payload, {
        headers: { "Content-Type": "multipart/form-data" }
      })

      const id = res.data && (res.data.id || res.data._id || res.data.idMulta)
      setSuccess(id ? `Multa agregada con éxito (ID: ${id})` : "Multa agregada con éxito")

      setFormData({ factura: null, fechaPublicacion: "" })

      // Refresh the list after adding a new multa
      const res2 = await api.get("/multas")
      setMultas(Array.isArray(res2.data) ? res2.data : [])
    } catch (err) {
      console.error("Error creating multa:", err)
      const serverMsg = err.response?.data?.message || err.response?.data || err.message
      setError(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg))
    }
  }

  const handleSearch = async () => {
    // We'll keep this for backward compatibility, but the main list view will handle searching
    setSearchResult(null)
    setError("")

    if (!searchId.trim()) {
      setError("Ingrese el ID de la multa para buscar")
      return
    }

    setLoading(true)
    try {
      const res = await api.get(`/multas/${encodeURIComponent(searchId)}`)
      setSearchResult(res.data)
    } catch (err) {
      setError("No se encontró la multa. Verifica el ID e intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    setUpdateSuccess("")
    setUpdateError("")

    if (!confirmUpdate) {
      setUpdateError("Confirma que deseas actualizar una multa seleccionando 'Si'")
      return
    }

    if (!updateId.trim()) {
      setUpdateError("Ingrese el ID de la multa para actualizar")
      return
    }

    if (!nuevoEstado) {
      setUpdateError("Adjunte el nuevo estado de la multa")
      return
    }

    try {
      const payload = new FormData()
      payload.append("estado", nuevoEstado)

      const res = await api.put(`/multas/${encodeURIComponent(updateId)}`, payload, {
        headers: { "Content-Type": "multipart/form-data" }
      })

      const id = res.data && (res.data.id || res.data._id || res.data.idMulta)
      setUpdateSuccess(id ? `Multa actualizada correctamente (ID: ${id})` : "Multa actualizada correctamente")
      setUpdateId("")
      setNuevoEstado(null)

      // Refresh the list after updating
      const res2 = await api.get("/multas")
      setMultas(Array.isArray(res2.data) ? res2.data : [])
    } catch (err) {
      console.error("Error updating multa:", err)
      const serverMsg = err.response?.data?.message || err.response?.data || err.message
      setUpdateError(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg))
    }
  }

  const openDeleteConfirm = () => {
    setDeleteSuccess("")
    setDeleteError("")

    if (!deleteId.trim()) {
      setDeleteError("Ingrese el ID de la multa para eliminar")
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
      await api.delete(`/multas/${encodeURIComponent(deleteId)}`)
      setDeleteSuccess("Multa eliminada correctamente")
      setDeleteId("")
      setShowDeleteCard(false)

      // Refresh the list after deletion
      const res = await api.get("/multas")
      setMultas(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error("Error deleting multa:", err)
      const serverMsg = err.response?.data?.message || err.response?.data || err.message
      setDeleteError(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg))
    }
  }

  return (
    <>
      <NavbarApp onLogout={handleLogout} />
      <div className="multas-page">
        <div className="titulo">
          <h1>MULTAS</h1>
        </div>

        <div className="subtitulo">
          <span className="subtitulo-banda">Consulta y Gestión de Multas</span>
        </div>

        <div className="page-layout">

          <div className="a-noticia side-card" aria-hidden="false">
            <h6>Recomendaciones</h6>
            <hr />
            <p>Guarda el ID que se genera al registrar una multa para hacerle seguimiento.</p>
            <p>Adjunta siempre la factura o soporte correspondiente.</p>
            <p>Verifica bien el ID antes de actualizar o eliminar un registro.</p>
          </div>

          <div className="panel-container">
            <div className="a-noticia panel">

              <div className="tabs-bar">
                <button type="button" className={activeTab === "nueva" ? "btn-success" : ""} onClick={() => setActiveTab("nueva")}>Agregar</button>
                <button type="button" className={activeTab === "buscar" ? "btn-success" : ""} onClick={() => setActiveTab("buscar")}>Buscar</button>
                <button type="button" className={activeTab === "actualizar" ? "btn-success" : ""} onClick={() => setActiveTab("actualizar")}>Actualizar</button>
                <button type="button" className={activeTab === "eliminar" ? "btn-danger" : ""} onClick={() => setActiveTab("eliminar")}>Eliminar</button>
              </div>
              <hr />

              {/* --- Agregar multa --- */}
              {activeTab === "nueva" && (
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">Factura de la multa</label>
                      <input type="file" className="input" onChange={(e) => setFormData({...formData, factura: e.target.files[0] || null})} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Fecha de publicación</label>
                      <input type="datetime-local" className="input" required value={formData.fechaPublicacion} onChange={(e) => setFormData({...formData, fechaPublicacion: e.target.value})} />
                    </div>
                  </div>

                  <div className="form-footer">
                    <button type="submit" className="btn-success">Agregar</button>
                    <p className="hint"><i>La multa genera un ID a la hora de ser publicada</i></p>
                  </div>
                  {success && <p className="success">{success}</p>}
                  {error && <p className="error">{error}</p>}
                </form>
              )}

              {/* --- Buscar multa --- */}
              {activeTab === "buscar" && (
                <div>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">ID de la multa</label>
                      <input type="text" placeholder="#12345" className="input" value={searchId} onChange={(e) => setSearchId(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-footer">
                    <button type="button" onClick={handleSearch}>Buscar</button>
                    {loading && <p className="hint">Buscando...</p>}
                  </div>
                  {error && <p className="error">{error}</p>}

                  {/* Show the list of multas (all or filtered) */}
                  <div className="multas-list">
                    {multasLoading && <p className="hint">Cargando lista de multas...</p>}
                    {multasError && <p className="error">{multasError}</p>}
                    {!multasLoading && !multasError && multas.length === 0 && (
                      <p className="hint">No hay multas registradas.</p>
                    )}
                    {!multasLoading && !multasError && multas.length > 0 && (
                      <div className="table-wrapper">
                        <table className="multas-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Descripción</th>
                              <th>Monto</th>
                              <th>Estado</th>
                              <th>Fecha Vencimiento</th>
                              <th>Fecha Pago</th>
                              <th>Apartamento</th>
                            </tr>
                          </thead>
                          <tbody>
                            {multas
                              // Filter by searchId if provided
                              .filter(multa => !searchId.trim() || multa.id?.toString() === searchId.trim())
                              .map((multa, index) => (
                                <tr key={index}>
                                  <td>{multa.id}</td>
                                  <td>{multa.descripcion}</td>
                                  <td>${Number(multa.monto).toLocaleString()}</td>
                                  <td>
                                    <span className={`badge ${multa.estado.toLowerCase() === 'pendiente' ? 'badge-pendiente' : multa.estado.toLowerCase() === 'pagado' ? 'badge-pagado' : 'badge-otros'}`}>
                                      {multa.estado}
                                    </span>
                                  </td>
                                  <td>{multa.fecha_vencimiento ? new Date(multa.fecha_vencimiento).toLocaleDateString() : '-'}</td>
                                  <td>{multa.fecha_pago ? new Date(multa.fecha_pago).toLocaleDateString() : '-'}</td>
                                  <td>{multa.bloque}-${multa.numero}${multa.interior ? '-' + multa.interior : ''}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* --- Actualizar multa --- */}
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
                          <label className="form-label">ID de la multa</label>
                          <input type="text" placeholder="#12345" className="input" value={updateId} onChange={(e) => setUpdateId(e.target.value)} />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Nuevo estado de la multa</label>
                          <input type="file" className="input" onChange={(e) => setNuevoEstado(e.target.files[0] || null)} />
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

              {/* --- Eliminar multa --- */}
              {activeTab === "eliminar" && (
                <div>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">ID de la multa para eliminar</label>
                      <input type="text" placeholder="#12345" className="input" value={deleteId} onChange={(e) => setDeleteId(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-footer">
                    <button type="button" onClick={openDeleteConfirm}>Eliminar</button>
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
                          <span className="title">¿Eliminar esta multa?</span>
                          <p className="message">Esta acción no se puede deshacer. La multa con ID {deleteId} se eliminará permanentemente.</p>
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
            <h6>¿Sabías que...?</h6>
            <hr />
            <p>Puedes consultar el estado de tu multa en cualquier momento con el ID.</p>
            <p>Las multas sin pago dentro del plazo pueden generar recargos.</p>
            <p>Escríbenos por PQRS si tienes dudas sobre una multa.</p>
          </div>

        </div>
        <Footer />
      </div>
    </>
  )
}

export default Multas