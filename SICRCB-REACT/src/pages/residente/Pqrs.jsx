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
    descripcion: "",
    tipo: "",
    idApartamento: ""
  })

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const [historial, setHistorial] = useState([])
  const [historialLoading, setHistorialLoading] = useState(true)
  const [historialError, setHistorialError] = useState("")

  useEffect(() => {
    const fetchHistorial = async () => {
      setHistorialLoading(true)
      setHistorialError("")
      try {
        const res = await api.get("/pqrs/mis-pqrs")
        setHistorial(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        console.error("Error fetching PQR history:", err)
        setHistorialError("No se pudo cargar el historial de PQR.")
      } finally {
        setHistorialLoading(false)
      }
    }
    fetchHistorial()
  }, [success])

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccess("")
    setError("")
    setLoading(true)

    if (!formData.descripcion || !formData.tipo || !formData.idApartamento) {
      setError("Complete todos los campos obligatorios")
      setLoading(false)
      return
    }

    try {
      const res = await api.post("/pqrs", {
        descripcion: formData.descripcion,
        tipo: formData.tipo,
        idApartamento: parseInt(formData.idApartamento)
      })

      const id = res.data && res.data.id
      setSuccess(id ? `PQR creada con éxito (ID: ${id})` : "PQR creada con éxito")

      setFormData({ descripcion: "", tipo: "", idApartamento: "" })
    } catch (err) {
      console.error("Error creating PQR:", err)
      const serverMsg = err.response?.data?.message || err.response?.data || err.message
      setError(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg))
    } finally {
      setLoading(false)
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

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Descripción</label>
                  <input
                    type="text"
                    placeholder="Describe tu petición, queja o reclamo"
                    className="input"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Tipo</label>
                  <select
                    className="input"
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  >
                    <option value="">Seleccione un tipo</option>
                    <option value="Petición">Petición</option>
                    <option value="Queja">Queja</option>
                    <option value="Reclamo">Reclamo</option>
                    <option value="Sugerencia">Sugerencia</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">ID del Apartamento</label>
                  <input
                    type="number"
                    placeholder="Ej: 101"
                    className="input"
                    value={formData.idApartamento}
                    onChange={(e) => setFormData({...formData, idApartamento: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-footer">
                <button type="submit" className="btn-success" onClick={handleSubmit} disabled={loading}>
                  {loading ? "Creando..." : "Crear PQR"}
                </button>
                <p className="hint"><i>El PQR genera un ID al ser registrado</i></p>
              </div>

              {success && <p className="success">{success}</p>}
              {error && <p className="error">{error}</p>}

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
              <div className="hint">Únicamente se muestran tus PQR creadas.</div>
            )}

            {historialLoading && <p className="hint">Cargando historial...</p>}
            {historialError && <p className="error">{historialError}</p>}
            {!historialLoading && !historialError && historial.length === 0 && (
              <p className="hint">Aún no tienes PQR registradas.</p>
            )}

            {!historialLoading && !historialError && historial.length > 0 && (
              <div className="table-wrapper">
                <table className="historial-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Descripción</th>
                      <th>Tipo</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((pqr) => {
                      const id = pqr.id
                      const estadoInfo = getEstadoInfo(pqr.estado)
                      return (
                        <tr key={id}>
                          <td>{id}</td>
                          <td>{pqr.descripcion}</td>
                          <td>{pqr.tipo}</td>
                          <td>{pqr.fecha_creacion ? new Date(pqr.fecha_creacion).toLocaleDateString() : "-"}</td>
                          <td><span className={`badge ${estadoInfo.className}`}>{estadoInfo.label}</span></td>
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