import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import "../../assets/css/styles.css"
import "../../assets/css/multas.css"
import "../../assets/css/admin_pqrs.css"
import NavbarApp from "../../components/NavbarApp.jsx"
import Footer from "../../components/Footer.jsx"

function PqrsAdmin() {

  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const pqrsEjemplo = [
    {
      id: 101,
      asunto: "Falla en el alumbrado",
      descripcion: "La luminaria del parqueadero principal permanece apagada desde el viernes.",
      fechaEnvio: "2026-08-08T09:30:00",
      estado: "pendiente",
      usuario: "propietario@correo.com",
    },
    {
      id: 102,
      asunto: "Queja por ruido",
      descripcion: "Se reporta ruido excesivo en horario nocturno por parte de un residente.",
      fechaEnvio: "2026-08-05T20:15:00",
      estado: "en proceso",
      usuario: "vecino@correo.com",
    },
    {
      id: 103,
      asunto: "Solicitud de información",
      descripcion: "Se solicita la fecha de pago y los requisitos para la reserva del salón social.",
      fechaEnvio: "2026-08-01T15:00:00",
      estado: "resuelta",
      usuario: "admin@correo.com",
    },
  ]

  const [historial, setHistorial] = useState([])
  const [historialLoading, setHistorialLoading] = useState(true)
  const [historialError, setHistorialError] = useState("")

  const [filtroTexto, setFiltroTexto] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")

  // Fila activa y quÃ© acciÃ³n se estÃ¡ realizando sobre ella
  const [activeId, setActiveId] = useState(null)
  const [activeAction, setActiveAction] = useState(null) // "ver" | "actualizar" | "eliminar"

  const [nuevoEstado, setNuevoEstado] = useState("")
  const [actionError, setActionError] = useState("")
  const [actionSuccess, setActionSuccess] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  const fetchHistorial = async () => {
    setHistorialLoading(true)
    setHistorialError("")
    try {
      const res = await api.get("/pqrs")
      const data = Array.isArray(res.data) ? res.data : []
      setHistorial(data.length > 0 ? data : pqrsEjemplo)
    } catch (err) {
      console.error("Error fetching PQR history:", err)
      setHistorial(pqrsEjemplo)
      setHistorialError("No se pudo conectar con la API; se muestran datos de ejemplo.")
    } finally {
      setHistorialLoading(false)
    }
  }

  useEffect(() => {
    fetchHistorial()
  }, [])

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

  const historialFiltrado = historial.filter((pqr) => {
    const asunto = (pqr.asunto || "").toLowerCase()
    const usuario = (pqr.usuario || pqr.email || "").toLowerCase()
    const id = ((pqr.id || pqr._id || pqr.idPqr || "")).toString().toLowerCase()
    const coincideTexto =
      asunto.includes(filtroTexto.toLowerCase()) ||
      id.includes(filtroTexto.toLowerCase()) ||
      usuario.includes(filtroTexto.toLowerCase())
    const coincideEstado = filtroEstado === "todos" || getEstadoInfo(pqr.estado).className === filtroEstado
    return coincideTexto && coincideEstado
  })

  const getId = (pqr) => pqr.id || pqr._id || pqr.idPqr

  const closeAction = () => {
    setActiveId(null)
    setActiveAction(null)
    setNuevoEstado("")
    setActionError("")
    setActionSuccess("")
  }

  const openVer = (pqr) => {
    setActiveId(getId(pqr))
    setActiveAction("ver")
    setActionError("")
    setActionSuccess("")
  }

  const openActualizar = (pqr) => {
    setActiveId(getId(pqr))
    setActiveAction("actualizar")
    setNuevoEstado(pqr.estado || "")
    setActionError("")
    setActionSuccess("")
  }

  const openEliminar = (pqr) => {
    setActiveId(getId(pqr))
    setActiveAction("eliminar")
    setActionError("")
    setActionSuccess("")
  }

  const handleUpdate = async () => {
    if (!nuevoEstado.trim()) {
      setActionError("Ingrese el nuevo estado del PQR")
      return
    }
    setActionLoading(true)
    setActionError("")
    try {
      await api.put(`/pqrs/${encodeURIComponent(activeId)}`, { estado: nuevoEstado })
      setActionSuccess("PQR actualizada correctamente")
      await fetchHistorial()
      setTimeout(closeAction, 900)
    } catch (err) {
      console.error("Error updating PQR:", err)
      const serverMsg = err.response?.data?.message || err.response?.data || err.message
      setActionError(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg))
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    setActionError("")
    try {
      await api.delete(`/pqrs/${encodeURIComponent(activeId)}`)
      setActionSuccess("PQR eliminada correctamente")
      await fetchHistorial()
      setTimeout(closeAction, 900)
    } catch (err) {
      console.error("Error deleting PQR:", err)
      const serverMsg = err.response?.data?.message || err.response?.data || err.message
      setActionError(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg))
    } finally {
      setActionLoading(false)
    }
  }

  const pqrActiva = historial.find((p) => getId(p) === activeId)

  return (
    <>
      <NavbarApp onLogout={handleLogout} />
      <div className="pqrs-admin-page">
        <div className="titulo">
          <h1>PQR</h1>
        </div>
        <div className="admin-content">

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
            <h6>PQR registradas</h6>
            <hr />

            <div className="filtros-row">
              <input
                type="text"
                className="input filtro-input"
                placeholder="Buscar por ID, usuario o asunto..."
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
              <button type="button" onClick={fetchHistorial}>Recargar</button>
            </div>

            {historialLoading && <p className="hint">Cargando historial...</p>}
            {historialError && <p className="error">{historialError}</p>}
            {!historialLoading && !historialError && historial.length === 0 && (
              <p className="hint">No hay PQR registradas.</p>
            )}
            {!historialLoading && !historialError && historial.length > 0 && historialFiltrado.length === 0 && (
              <p className="hint">NingÃºn resultado coincide con tu bÃºsqueda.</p>
            )}

            {!historialLoading && historialFiltrado.length > 0 && (
              <div className="table-wrapper">
                <table className="historial-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Usuario</th>
                      <th>Asunto</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialFiltrado.map((pqr) => {
                      const id = getId(pqr)
                      const estadoInfo = getEstadoInfo(pqr.estado)
                      return (
                        <tr key={id}>
                          <td>{id}</td>
                          <td>{pqr.usuario || pqr.email || "-"}</td>
                          <td>{pqr.asunto}</td>
                          <td>{pqr.fechaEnvio ? new Date(pqr.fechaEnvio).toLocaleDateString() : "-"}</td>
                          <td><span className={`badge ${estadoInfo.className}`}>{estadoInfo.label}</span></td>
                          <td>
                            <div className="acciones-cell">
                              <button type="button" className="btn-ver" onClick={() => openVer(pqr)}>Ver</button>
                              <button type="button" className="btn-actualizar" onClick={() => openActualizar(pqr)}>Actualizar</button>
                              <button type="button" className="btn-eliminar" onClick={() => openEliminar(pqr)}>Eliminar</button>
                            </div>
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

        {/* --- Modal: Ver detalle --- */}
        {activeAction === "ver" && pqrActiva && (
          <div className="modal-overlay" onClick={closeAction}>
            <div className="card" onClick={(e) => e.stopPropagation()}>
              <div className="header">
                <div className="content" style={{ marginTop: 0 }}>
                  <span className="title">Detalle de la PQR</span>
                </div>
              </div>
              <div className="modal-body">
                <p className="detalle-linea"><strong>ID:</strong> {getId(pqrActiva)}</p>
                {(pqrActiva.usuario || pqrActiva.email) && (
                  <p className="detalle-linea"><strong>Usuario:</strong> {pqrActiva.usuario || pqrActiva.email}</p>
                )}
                <p className="detalle-linea"><strong>Asunto:</strong> {pqrActiva.asunto}</p>
                <p className="detalle-linea"><strong>DescripciÃ³n:</strong> {pqrActiva.descripcion || "-"}</p>
                <p className="detalle-linea"><strong>Fecha:</strong> {pqrActiva.fechaEnvio}</p>
                <p className="detalle-linea"><strong>Estado:</strong> {pqrActiva.estado}</p>
              </div>
              <div className="actions">
                <button className="cancel" type="button" onClick={closeAction}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {/* --- Modal: Actualizar estado --- */}
        {activeAction === "actualizar" && (
          <div className="modal-overlay" onClick={closeAction}>
            <div className="card" onClick={(e) => e.stopPropagation()}>
              <div className="header">
                <div className="content" style={{ marginTop: 0 }}>
                  <span className="title">Actualizar estado</span>
                  <p className="message">PQR ID: {activeId}</p>
                </div>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  className="input"
                  placeholder="Ej: En revisiÃ³n"
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                  style={{ maxWidth: "100%" }}
                />
                {actionError && <p className="error">{actionError}</p>}
                {actionSuccess && <p className="success">{actionSuccess}</p>}
              </div>
              <div className="actions">
                <button className="desactivate" type="button" onClick={handleUpdate} disabled={actionLoading}>
                  {actionLoading ? "Guardando..." : "Guardar cambios"}
                </button>
                <button className="cancel" type="button" onClick={closeAction}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* --- Modal: Confirmar eliminaciÃ³n --- */}
        {activeAction === "eliminar" && (
          <div className="modal-overlay" onClick={closeAction}>
            <div className="card" onClick={(e) => e.stopPropagation()}>
              <div className="header">
                <div className="image">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <div className="content">
                  <span className="title">Â¿Eliminar esta PQR?</span>
                  <p className="message">Esta acciÃ³n no se puede deshacer. La PQR con ID {activeId} se eliminarÃ¡ permanentemente.</p>
                </div>
              </div>
              {actionError && <p className="error">{actionError}</p>}
              {actionSuccess && <p className="success">{actionSuccess}</p>}
              <div className="actions">
                <button className="desactivate" type="button" onClick={handleDelete} disabled={actionLoading}>
                  {actionLoading ? "Eliminando..." : "SÃ­, eliminar"}
                </button>
                <button className="cancel" type="button" onClick={closeAction}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        

        <Footer />
      </div>
    </>
  )
}

export default PqrsAdmin

