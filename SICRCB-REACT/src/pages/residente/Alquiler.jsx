import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import "../../assets/css/styles.css"
import "../../assets/css/alquiler.css"
import NavbarApp from "../../components/NavbarApp.jsx"
import Footer from "../../components/Footer.jsx"

function Alquiler() {

  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const [formData, setFormData] = useState({
    nombreSolicitante: "",
    tipoAlquiler: "",
    cantidadSillas: "",
    fechaInicio: "",
    fechaFin: ""
  })

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [searchId, setSearchId] = useState("")
  const [searchDate, setSearchDate] = useState("")
  const [searchResult, setSearchResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const [confirmUpdate, setConfirmUpdate] = useState(false)
  const [updateId, setUpdateId] = useState("")
  const [updateData, setUpdateData] = useState({
    tipoAlquiler: "",
    cantidadSillas: "",
    fechaInicio: "",
    fechaFin: ""
  })
  const [updateSuccess, setUpdateSuccess] = useState("")
  const [updateError, setUpdateError] = useState("")

  const [deleteId, setDeleteId] = useState("")
  const [deleteSuccess, setDeleteSuccess] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [showDeleteCard, setShowDeleteCard] = useState(false)
  const [activeTab, setActiveTab] = useState("nueva")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccess("")
    setError("")

    if (!formData.nombreSolicitante || !formData.tipoAlquiler || !formData.fechaInicio || !formData.fechaFin) {
      setError("Complete todos los campos obligatorios")
      return
    }

    try {
      const res = await api.post("/reservas", {
        nombreSolicitante: formData.nombreSolicitante,
        tipoAlquiler: formData.tipoAlquiler,
        cantidadSillas: formData.cantidadSillas,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin
      })

      const id = res.data && (res.data.id || res.data._id || res.data.idReserva)
      const createdId = id || (typeof res.data === "object" ? res.data.userId || res.data.id || res.data._id : null)
      setSuccess(createdId ? `Reserva generada con éxito (ID: ${createdId})` : "Reserva generada con éxito")

      setFormData({ nombreSolicitante: "", tipoAlquiler: "", cantidadSillas: "", fechaInicio: "", fechaFin: "" })
    } catch (err) {
      console.error("Error creating reservation:", err)
      const serverMsg = err.response?.data?.message || err.response?.data || err.message
      setError(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg))
    }
  }

  const handleSearch = async () => {
    setSearchResult(null)
    setError("")
    setLoading(true)
    try {
      let res
      if (searchId && searchId.trim() !== "") {
        res = await api.get(`/reservas/${encodeURIComponent(searchId)}`)
      } else if (searchDate) {
        res = await api.get(`/reservas`, { params: { date: searchDate } })
      } else {
        setError("Ingrese ID o fecha para buscar")
        setLoading(false)
        return
      }

      setSearchResult(res.data)
    } catch (err) {
      setError("No se encontró la reserva. Verifica el ID o la fecha e intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    setUpdateSuccess("")
    setUpdateError("")

    if (!confirmUpdate) {
      setUpdateError("Confirma que deseas actualizar una reserva seleccionando 'Si'")
      return
    }

    if (!updateId.trim()) {
      setUpdateError("Ingrese el ID de la reserva para actualizar")
      return
    }

    const payload = {}
    if (updateData.tipoAlquiler) payload.tipoAlquiler = updateData.tipoAlquiler
    if (updateData.cantidadSillas) payload.cantidadSillas = updateData.cantidadSillas
    if (updateData.fechaInicio) payload.fechaInicio = updateData.fechaInicio
    if (updateData.fechaFin) payload.fechaFin = updateData.fechaFin

    if (Object.keys(payload).length === 0) {
      setUpdateError("Ingrese al menos un campo para actualizar")
      return
    }

    try {
      const res = await api.put(`/reservas/${encodeURIComponent(updateId)}`, payload)
      const id = res.data && (res.data.id || res.data._id || res.data.idReserva)
      setUpdateSuccess(id ? `Reserva actualizada correctamente (ID: ${id})` : "Reserva actualizada correctamente")
      setUpdateId("")
      setUpdateData({ tipoAlquiler: "", cantidadSillas: "", fechaInicio: "", fechaFin: "" })
    } catch (err) {
      console.error("Error updating reservation:", err)
      const serverMsg = err.response?.data?.message || err.response?.data || err.message
      setUpdateError(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg))
    }
  }

  const openDeleteConfirm = () => {
    setDeleteSuccess("")
    setDeleteError("")

    if (!deleteId.trim()) {
      setDeleteError("Ingrese el ID de la reserva para eliminar")
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
      await api.delete(`/reservas/${encodeURIComponent(deleteId)}`)
      setDeleteSuccess("Reserva eliminada correctamente")
      setDeleteId("")
      setShowDeleteCard(false)
    } catch (err) {
      console.error("Error deleting reservation:", err)
      const serverMsg = err.response?.data?.message || err.response?.data || err.message
      setDeleteError(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg))
    }
  }

  return (
    <>
      <NavbarApp onLogout={handleLogout} />
      <div className="alquiler-page">
        <div className="titulo">
          <h1>ALQUILER</h1>
        </div>

        <div className="subtitulo">
          <span className="subtitulo-banda">Salón Comunal y Sillas</span>
        </div>

        <div className="page-layout">

          <div className="a-noticia side-card" aria-hidden="false">
            <h6>Recomendaciones</h6>
            <hr />
            <p>Llega 15 minutos antes para recibir las llaves y revisar el espacio.</p>
            <p>Las sillas deben devolverse limpias y en el mismo lugar donde se recogieron.</p>
            <p>Reporta cualquier daño antes de finalizar tu reserva.</p>
          </div>

          <div className="panel-container">
            <div className="a-noticia panel">

              <div className="tabs-bar">
              <button type="button" className={activeTab === "nueva" ? "btn-success" : ""} onClick={() => setActiveTab("nueva")}>Nueva</button>
              <button type="button" className={activeTab === "buscar" ? "btn-success" : ""} onClick={() => setActiveTab("buscar")}>Buscar</button>
              <button type="button" className={activeTab === "actualizar" ? "btn-success" : ""} onClick={() => setActiveTab("actualizar")}>Actualizar</button>
              <button type="button" className={activeTab === "eliminar" ? "btn-danger" : ""} onClick={() => setActiveTab("eliminar")}>Eliminar</button>
            </div>
            <hr />

            {/* --- Nueva reserva --- */}
            {activeTab === "nueva" && (
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Nombre del solicitante</label>
                    <input type="text" placeholder="Ej: Juan Pérez" className="input" value={formData.nombreSolicitante} onChange={(e) => setFormData({...formData, nombreSolicitante: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Tipo de alquiler</label>
                    <select className="input" required value={formData.tipoAlquiler} onChange={(e) => setFormData({...formData, tipoAlquiler: e.target.value})}>
                      <option value="">Seleccionar...</option>
                      <option value="salon">Salón Comunal</option>
                      <option value="sillas">Sillas</option>
                      <option value="ambos">Salón + Sillas</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Cantidad de sillas</label>
                    <input type="number" placeholder="Ej: 20" min="1" className="input" value={formData.cantidadSillas} onChange={(e) => setFormData({...formData, cantidadSillas: e.target.value})} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Fecha y hora de inicio</label>
                    <input type="datetime-local" className="input" required value={formData.fechaInicio} onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Fecha y hora de fin</label>
                    <input type="datetime-local" className="input" required value={formData.fechaFin} onChange={(e) => setFormData({...formData, fechaFin: e.target.value})} />
                  </div>
                </div>

                <div className="form-footer">
                  <button type="submit" className="btn-success">Reservar</button>
                  <p className="hint"><i>La reserva genera un ID al ser registrada</i></p>
                </div>
                {success && <p className="success">{success}</p>}
                {error && <p className="error">{error}</p>}
              </form>
            )}

            {/* --- Buscar reserva --- */}
            {activeTab === "buscar" && (
              <div>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">ID de la reserva</label>
                    <input type="text" placeholder="#12345" className="input" value={searchId} onChange={(e) => setSearchId(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">O buscar por fecha</label>
                    <input type="date" className="input" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} />
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
                    <p><strong>Solicitante:</strong> {searchResult.nombreSolicitante}</p>
                    <p><strong>Tipo:</strong> {searchResult.tipoAlquiler}</p>
                    <div className="form-row">
                      <p><strong>Inicio:</strong> {searchResult.fechaInicio}</p>
                      <p><strong>Fin:</strong> {searchResult.fechaFin}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- Actualizar reserva --- */}
            {activeTab === "actualizar" && (
              <div>
                {!confirmUpdate ? (
                  <div className="form-footer">
                    <button type="button" className="btn-success" onClick={() => setConfirmUpdate(true)}>Actualizar reserva</button>
                  </div>
                ) : (
                  <>
                    <div className="form-row">
                      <div className="form-field">
                        <label className="form-label">ID de la reserva</label>
                        <input type="text" placeholder="#12345" className="input" value={updateId} onChange={(e) => setUpdateId(e.target.value)} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Nuevo tipo de alquiler</label>
                        <select className="input" value={updateData.tipoAlquiler} onChange={(e) => setUpdateData({...updateData, tipoAlquiler: e.target.value})}>
                          <option value="">Seleccionar...</option>
                          <option value="salon">Salón Comunal</option>
                          <option value="sillas">Sillas</option>
                          <option value="ambos">Salón + Sillas</option>
                        </select>
                      </div>
                      <div className="form-field">
                        <label className="form-label">Nueva cantidad de sillas</label>
                        <input type="number" placeholder="Ej: 20" min="1" className="input" value={updateData.cantidadSillas} onChange={(e) => setUpdateData({...updateData, cantidadSillas: e.target.value})} />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label className="form-label">Nueva fecha y hora de inicio</label>
                        <input type="datetime-local" className="input" value={updateData.fechaInicio} onChange={(e) => setUpdateData({...updateData, fechaInicio: e.target.value})} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Nueva fecha y hora de fin</label>
                        <input type="datetime-local" className="input" value={updateData.fechaFin} onChange={(e) => setUpdateData({...updateData, fechaFin: e.target.value})} />
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

            {/* --- Eliminar reserva --- */}
            {activeTab === "eliminar" && (
              <div>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">ID de la reserva</label>
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
                        <span className="title">¿Eliminar esta reserva?</span>
                        <p className="message">Esta acción no se puede deshacer. La reserva con ID {deleteId} se eliminará permanentemente.</p>
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
            <h6>Política de cancelación</h6>
            <hr />
            <p>Puedes cancelar o modificar tu reserva hasta 24 horas antes sin ningún costo.</p>
            <p>Cancelaciones el mismo día no generan reembolso.</p>
            <p>Escríbenos por PQRS si necesitas ayuda con tu reserva.</p>
          </div>

        </div>
        <Footer />
      </div>
    </>
  )
}

export default Alquiler