import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import "../../assets/css/styles.css"
import "../../assets/css/noticias.css"
import NavbarApp from "../../components/NavbarApp.jsx"
import Footer from "../../components/Footer.jsx"

function Noticias() {
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
    confirmText: "",
  })
  const [activeTab, setActiveTab] = useState("agregar")
  const [noticias, setNoticias] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchResult, setSearchResult] = useState(null)

  const abrirModal = (tipo) => {
    const config = {
      actualizar: {
        title: "Actualizar noticia",
        message:
          "¿Estás seguro de que deseas actualizar esta noticia? Esta acción modificará el registro permanentemente.",
        confirmText: "Actualizar",
      },
      eliminar: {
        title: "Eliminar noticia",
        message:
          "¿Estás seguro de que deseas eliminar esta noticia? Todos los datos serán eliminados permanentemente. Esta acción no se puede deshacer.",
        confirmText: "Eliminar",
      },
    }

    setModalContent(config[tipo] || { title: "", message: "", confirmText: "" })
    setModalOpen(true)
  }

  const cerrarModal = () => {
    setModalOpen(false)
  }

  const handleConfirm = async () => {
    if (modalContent.confirmText === "Actualizar") {
      cerrarModal()
      // This would be called from the actualizar tab with specific ID and file
      // The actualizar tab has its own handler
    } else if (modalContent.confirmText === "Eliminar") {
      cerrarModal()
      // This would be called from the eliminar tab with specific ID
      // The eliminar tab has its own handler
    }
  }

  const fetchNoticias = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await api.get("/noticias")
      setNoticias(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error("Error fetching noticias:", err)
      setError("No se pudieron cargar las noticias")
      setNoticias([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    // Get form values - since we're using file inputs, we need FormData
    const formData = new FormData()
    // Note: The form inputs don't have names/values attached to state yet
    // For now, we'll assume the form is structured to capture the needed data
    // In a real implementation, we'd need to hook up the form inputs to state

    try {
      const res = await api.post("/noticias", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      await fetchNoticias() // Refresh the list
      alert("Noticia publicada correctamente")
    } catch (err) {
      console.error("Error creating noticia:", err)
      const serverMsg = err.response?.data?.message || err.response?.data || err.message
      alert(typeof serverMsg === "string" ? serverMsg : "Error al crear la noticia")
    }
  }

  const handleSearch = async () => {
    setError("")
    const searchId = document.querySelector('input[placeholder="#12345"]').value

    if (!searchId.trim()) {
      setError("Ingrese el ID de la noticia para buscar")
      return
    }

    setLoading(true)
    try {
      const res = await api.get(`/noticias/${encodeURIComponent(searchId)}`)
      setSearchResult(res.data)
    } catch (err) {
      setError("No se encontró la noticia. Verifica el ID e intenta de nuevo.")
      setSearchResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id, file) => {
    setError("")
    if (!id || !file) {
      setError("ID y archivo son requeridos para actualizar")
      return
    }

    const formData = new FormData()
    formData.append("archivo", file)

    try {
      const res = await api.put(`/noticias/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      await fetchNoticias() // Refresh the list
      alert("Noticia actualizada correctamente")
    } catch (err) {
      console.error("Error updating noticia:", err)
      const serverMsg = err.response?.data?.message || err.response?.data || err.message
      alert(typeof serverMsg === "string" ? serverMsg : "Error al actualizar la noticia")
    }
  }

  const handleDelete = async (id) => {
    setError("")
    if (!id) {
      setError("ID es requerido para eliminar")
      return
    }

    try {
      await api.delete(`/noticias/${id}`)
      await fetchNoticias() // Refresh the list
      alert("Noticia eliminada correctamente")
    } catch (err) {
      console.error("Error deleting noticia:", err)
      const serverMsg = err.response?.data?.message || err.response?.data || err.message
      alert(typeof serverMsg === "string" ? serverMsg : "Error al eliminar la noticia")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // Load noticias on mount
  // useEffect(() => {
  //   fetchNoticias()
  // }, [])

  return (
    <>
      <NavbarApp onLogout={handleLogout} />
      <div className="noticias-page">
        <div className="titulo">
          <h1>NOTICIAS</h1>
        </div>

        <div className="subtitulo">
          <span className="subtitulo-banda">Publicaciones y Comunicados</span>
        </div>

        <div className="page-layout">

          <div className="a-noticia side-card">
            <h6>Buenas prácticas</h6>
            <hr />
            <p>Usa imágenes o PDFs livianos para que la noticia cargue rápido para todos los residentes.</p>
            <p>Programa la fecha de publicación con anticipación para comunicados importantes.</p>
            <p>Revisa la redacción antes de publicar, no se puede editar el texto luego.</p>
          </div>

          <div className="panel-container">
            <div className="a-noticia panel">

              <div className="tabs-bar">
                <button type="button" className={activeTab === "agregar" ? "btn-success" : ""} onClick={() => setActiveTab("agregar")}>Agregar</button>
                <button type="button" className={activeTab === "buscar" ? "btn-success" : ""} onClick={() => setActiveTab("buscar")}>Buscar</button>
                <button type="button" className={activeTab === "actualizar" ? "btn-success" : ""} onClick={() => setActiveTab("actualizar")}>Actualizar</button>
                <button type="button" className={activeTab === "eliminar" ? "btn-danger" : ""} onClick={() => setActiveTab("eliminar")}>Eliminar</button>
              </div>
              <hr />

              {/* --- Agregar noticia --- */}
              {activeTab === "agregar" && (
                <div>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">Archivo de la noticia</label>
                      <input type="file" className="input" />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Fecha de publicación</label>
                      <input type="datetime-local" className="input" />
                    </div>
                  </div>

                  <div className="form-footer">
                    <button type="button" className="btn-success" onClick={handleSubmit}>Publicar</button>
                    <p className="hint"><i>Recuerda que la noticia genera un ID a la hora de ser publicada</i></p>
                  </div>
                  {error && <p className="error">{error}</p>}
                </div>
              )}

              {/* --- Buscar noticia --- */}
              {activeTab === "buscar" && (
                <div>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">ID de la noticia</label>
                      <input type="text" placeholder="#12345" className="input" />
                    </div>
                  </div>
                  <div className="form-footer">
                    <button type="button" className="btn-success" onClick={handleSearch}>Buscar</button>
                    {loading && <p className="hint">Buscando...</p>}
                  </div>
                  {error && <p className="error">{error}</p>}

                  {searchResult && (
                    <div className="search-result">
                      <p><strong>ID:</strong> {searchResult.id || searchResult._id}</p>
                      <p><strong>Título:</strong> {searchResult.titulo}</p>
                      <p><strong>Fecha:</strong> {searchResult.fecha_publicacion}</p>
                    </div>
                  )}
                </div>
              )}

              {/* --- Actualizar noticia --- */}
              {activeTab === "actualizar" && (
                <div>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">ID de la noticia</label>
                      <input type="text" placeholder="#12345" className="input" />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Nuevo archivo de la noticia</label>
                      <input type="file" className="input" />
                    </div>
                  </div>
                  <div className="form-footer">
                    <button type="button" className="btn-success" onClick={() => {
                      const id = document.querySelector('input[placeholder="#12345"]').value
                      const fileInput = document.querySelector('input[type="file"]')
                      const file = fileInput ? fileInput.files[0] : null
                      if (id && file) {
                        handleUpdate(id, file)
                      } else {
                        alert("Por favor ingrese ID y seleccione un archivo")
                      }
                    }}>Actualizar</button>
                  </div>
                </div>
              )}

              {/* --- Eliminar noticia --- */}
              {activeTab === "eliminar" && (
                <div>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">ID de la noticia</label>
                      <input type="text" placeholder="#12345" className="input" />
                    </div>
                  </div>
                  <div className="form-footer">
                    <button type="button" className="btn-danger" onClick={() => {
                      const id = document.querySelector('input[placeholder="#12345"]').value
                      if (id) {
                        handleDelete(id)
                      } else {
                        alert("Por favor ingrese un ID")
                      }
                    }}>Eliminar</button>
                  </div>
                </div>
              )}

            </div>
          </div>

          <div className="a-noticia side-card">
            <h6>Recuerda</h6>
            <hr />
            <p>Las noticias eliminadas no se pueden recuperar.</p>
            <p>Solo el equipo administrativo puede actualizar o eliminar publicaciones.</p>
            <p>Para dudas sobre una publicación, usa el módulo de PQRS.</p>
          </div>

        </div>
        <Footer />

        {modalOpen && (
          <div id="modalOverlay" className="modal-overlay">
            <div className="card">
              <div className="header">
                <div className="image">
                  <svg aria-hidden="true" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    ></path>
                  </svg>
                </div>
                <div className="content">
                  <span className="title">{modalContent.title}</span>
                  <p className="message">{modalContent.message}</p>
                </div>
              </div>
              <div className="actions">
                <button className="desactivate" type="button" onClick={handleConfirm}>{modalContent.confirmText}</button>
                <button className="cancel" type="button" onClick={cerrarModal}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Noticias