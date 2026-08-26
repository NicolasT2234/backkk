import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/css/noticias.css";
import "../../assets/css/styles.css";
import Footer from "../../components/Footer.jsx";
import NavbarApp from "../../components/NavbarApp.jsx";
import api from "../../services/api";

function Noticias() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
    confirmText: "",
  });
  const [activeTab, setActiveTab] = useState("agregar");
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state for agregar/actualizar
  const [formData, setFormData] = useState({
    descripcion: "",
    fechaPublicacion: "",
    selectedFile: null,
  });

  // Buscar tab filter
  const [filtroBuscar, setFiltroBuscar] = useState("");
  // Actualizar tab filter and selected news - now used for edit modal
  const [filtroEditar, setFiltroEditar] = useState("");
  const [noticiaAEditar, setNoticiaAEditar] = useState(null);
  // State for delete confirmation
  const [newsIdToDelete, setNewsIdToDelete] = useState(null);

  const abrirModal = tipo => {
    const config = {
      actualizar: {
        title: "Actualizar noticia",
        message:
          "¿Está seguro de que desea actualizar esta noticia? Esta acción modificará el registro permanentemente.",
        confirmText: "Actualizar",
      },
      eliminar: {
        title: "Eliminar noticia",
        message:
          "¿Está seguro de que desea eliminar esta noticia? Todos los datos serán eliminados permanentemente. Esta acción no se puede deshacer.",
        confirmText: "Eliminar",
      },
    };

    setModalContent(config[tipo] || { title: "", message: "", confirmText: "" });
    // Asegurarse de que solo haya un modal abierto a la vez
    if (tipo === 'eliminar') {
      setModalOpen(true);
      setEditModalOpen(false);
      setNoticiaAEditar(null);
      setFormData({ descripcion: "", fechaPublicacion: "", selectedFile: null });
    } else if (tipo === 'actualizar') {
      setEditModalOpen(true);
      setModalOpen(false);
      setNewsIdToDelete(null);
    }
  };

  const cerrarModal = () => {
    setModalOpen(false);
  };

  const handleConfirm = async () => {
    if (modalContent.confirmText === "Actualizar") {
      // This path is no longer used since we moved actualizar to edit modal
      cerrarModal();
    } else if (modalContent.confirmText === "Eliminar") {
      cerrarModal();
      if (newsIdToDelete !== null) {
        handleDelete(newsIdToDelete);
      }
    }
  };

  const fetchNoticias = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/noticias");
      setNoticias(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching noticias:", err);
      setError("No se pudieron cargar las noticias");
      setNoticias([]);
    } finally {
      setLoading(false);
    }
  };

  // Load noticias on mount
  useEffect(() => {
    fetchNoticias();
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    if (!formData.descripcion.trim()) {
      setError("La descripción es requerida");
      return;
    }
    if (!formData.fechaPublicacion) {
      setError("La fecha de publicación es requerida");
      return;
    }

    const form = new FormData();
    form.append("descripcion", formData.descripcion);
    form.append("fechaPublicacion", formData.fechaPublicacion);
    if (formData.selectedFile) {
      form.append("archivo", formData.selectedFile);
    }

    try {
      const res = await api.post("/noticias", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchNoticias();
      setFormData({ descripcion: "", fechaPublicacion: "", selectedFile: null });
      alert("Noticia publicada correctamente");
    } catch (err) {
      console.error("Error creating noticia:", err);
      const serverMsg = err.response?.data?.message || err.response?.data || err.message;
      alert(typeof serverMsg === "string" ? serverMsg : "Error al crear la noticia");
    }
  };

  const handleUpdate = async () => {
    setError("");
    if (!formData.descripcion.trim()) {
      setError("La descripción es requerida");
      return;
    }
    if (!formData.fechaPublicacion) {
      setError("La fecha de publicación es requerida");
      return;
    }

    const id = noticiaAEditar?.id;
    if (!id) {
      setError("Seleccione una noticia para actualizar");
      return;
    }

    const form = new FormData();
    form.append("descripcion", formData.descripcion);
    form.append("fechaPublicacion", formData.fechaPublicacion);
    if (formData.selectedFile) {
      form.append("archivo", formData.selectedFile);
    }

    try {
      const res = await api.put(`/noticias/${id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchNoticias();
      setFormData({ descripcion: "", fechaPublicacion: "", selectedFile: null });
      setNoticiaAEditar(null);
      setEditModalOpen(false);
      alert("Noticia actualizada correctamente");
    } catch (err) {
      console.error("Error updating noticia:", err);
      const serverMsg = err.response?.data?.message || err.response?.data || err.message;
      alert(typeof serverMsg === "string" ? serverMsg : "Error al actualizar la noticia");
    }
  };

  const handleDelete = async id => {
    setError("");
    try {
      await api.delete(`/noticias/${id}`);
      await fetchNoticias();
      alert("Noticia eliminada correctamente");
    } catch (err) {
      console.error("Error deleting noticia:", err);
      const serverMsg = err.response?.data?.message || err.response?.data || err.message;
      alert(typeof serverMsg === "string" ? serverMsg : "Error al eliminar la noticia");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // Helper to get ID from noticia object (supports different possible field names)
  const getId = n => n.id || n._id || n.idNoticia;
  // Helper to get title (backend maps descripcion to titulo)
  const getTitulo = n => n.titulo || n.descripcion || "Sin título";
  // Helper to get description
  const getDescripcion = n => n.descripcion || n.contenido || "";
  // Helper to get backend URL for static files
  const getBackendUrl = () => {
    if (import.meta.env.PROD) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      return apiUrl.replace(/\/api$/, '');
    } else {
      return 'http://localhost:5000';
    }
  };
  // Helper to get archivo URL from noticia object
  const getArchivoUrl = n => n.archivo_url || n.archivoUrl || n.archivo || n.imagenUrl || n.imagen || null;
  // Helper to check if URL is an image
  const esImagen = url => {
    if (!url) return false;
    return /\.(png|jpe?g|gif|webp|svg)$/i.test(url);
  };
  // Helper to check if URL is a PDF
  const esPdf = url => {
    if (!url) return false;
    return /\.pdf$/i.test(url);
  };

  // Filtered news for Buscar tab (search in ID, title, description)
  const noticiasFiltradasBuscar = (Array.isArray(noticias) ? noticias : []).filter(noticia => {
    const texto = filtroBuscar.toLowerCase();
    const idStr = String(getId(noticia)).toLowerCase();
    const titulo = getTitulo(noticia).toLowerCase();
    const descripcion = getDescripcion(noticia).toLowerCase();
    return idStr.includes(texto) || titulo.includes(texto) || descripcion.includes(texto);
  });

  // Filtered news for edit modal (search in ID and title)
  const noticiasFiltradasEditar = (Array.isArray(noticias) ? noticias : []).filter(noticia => {
    const texto = filtroEditar.toLowerCase();
    const idStr = String(getId(noticia)).toLowerCase();
    const titulo = getTitulo(noticia).toLowerCase();
    return idStr.includes(texto) || titulo.includes(texto);
  });

  // State for edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);

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
            <p>Use imágenes o PDFs livianos para que la noticia cargue rápido para todos los residentes.</p>
            <p>Programe la fecha de publicación con anticipación para comunicados importantes.</p>
            <p>Revise la redacción antes de publicar, no se puede editar el texto luego.</p>
          </div>

          <div className="panel-container">
            <div className="a-noticia panel">
              <div className="tabs-bar">
                <button
                  type="button"
                  className={activeTab === "agregar" ? "btn-success" : ""}
                  onClick={() => setActiveTab("agregar")}
                >
                  Agregar
                </button>
                <button
                  type="button"
                  className={activeTab === "buscar" ? "btn-success" : ""}
                  onClick={() => setActiveTab("buscar")}
                >
                  Buscar
                </button>
              </div>
              <hr />

              {/* --- Agregar noticia --- */}
              {activeTab === "agregar" && (
                <div>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">Descripción de la noticia</label>
                      <textarea
                        className="input"
                        placeholder="Ingrese la descripción completa de la noticia"
                        value={formData.descripcion}
                        onChange={e =>
                          setFormData({ ...formData, descripcion: e.target.value })
                        }
                        rows="4"
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Fecha de publicación</label>
                      <input
                        type="datetime-local"
                        className="input"
                        value={formData.fechaPublicacion}
                        onChange={e =>
                          setFormData({ ...formData, fechaPublicacion: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Archivo adjunto (opcional)</label>
                      <input
                        type="file"
                        className="input"
                        onChange={e => {
                          setFormData({ ...formData, selectedFile: e.target.files[0] });
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-footer">
                    <button type="button" className="btn-success" onClick={handleSubmit}>
                      Publicar
                    </button>
                    <p className="hint">
                      <i>Recuerde que la noticia genera un ID a la hora de ser publicada</i>
                    </p>
                  </div>
                  {error && <p className="error">{error}</p>}
                </div>
              )}

              {/* --- Buscar noticia --- */}
              {activeTab === "buscar" && (
                <div>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">Buscar por palabra clave</label>
                      <input
                        type="text"
                        className="input filtro-input"
                        placeholder="Buscar por palabra clave..."
                        value={filtroBuscar}
                        onChange={e => setFiltroBuscar(e.target.value)}
                      />
                    </div>
                  </div>

                  {loading && <p className="hint">Cargando noticias...</p>}
                  {error && <p className="error">{error}</p>}
                  {!loading && !error && noticias.length === 0 && (
                    <p className="hint">No hay noticias publicadas por el momento</p>
                  )}
                  {!loading && !error && noticias.length > 0 && noticiasFiltradasBuscar.length === 0 && (
                    <p className="hint">Ningún resultado coincide con tu búsqueda.</p>
                  )}
                  {!loading && !error && noticiasFiltradasBuscar.length > 0 && (
                    <div className="noticia-list">
                      {noticiasFiltradasBuscar.map(noticia => {
                        const id = getId(noticia);
                        const titulo = getTitulo(noticia);
                        const fecha = noticia.fecha_publicacion;
                        const descripcion = getDescripcion(noticia);
                        const archivoUrl = getArchivoUrl(noticia);
                        return (
                          <div className="noticia-list-item" key={id}>
                            <div className="noticia-list-item-thumb">
                              {archivoUrl && esImagen(archivoUrl) ? (
                                <img
                                  src={`${getBackendUrl()}${archivoUrl}`}
                                  alt={titulo}
                                />
                              ) : archivoUrl && esPdf(archivoUrl) ? (
                                <div className="placeholder">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125.1125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                  </svg>
                                  <span>Documento PDF</span>
                                </div>
                              ) : (
                                <div className="placeholder">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159-5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25M3 8.25V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25M3 8.25h18" />
                                  </svg>
                                  <span>SICRCB</span>
                                </div>
                              )}
                            </div>
                            <div className="noticia-list-item-content">
                              <div className="noticia-list-item-date">
                                {fecha ? new Date(fecha).toLocaleDateString() : "SIN FECHA"}
                              </div>
                              <div className="noticia-list-item-title">{titulo}</div>
                              <div className="noticia-list-item-description">
                                {descripcion.length > 100 ? descripcion.substring(0, 100) + "..." : descripcion}
                              </div>
                              <div className="noticia-list-item-button-group">
                                <button className="noticia-list-item-button" type="button">
                                  Ver más
                                </button>
                                <button
                                  className="edit-button"
                                  title="Editar"
                                  onClick={() => {
                                    setNoticiaAEditar(noticia);
                                    setFormData({
                                      descripcion: getDescripcion(noticia),
                                      fechaPublicacion: noticia.fecha_publicacion
                                        ? new Date(noticia.fecha_publicacion)
                                            .toISOString()
                                            .slice(0, 16)
                                        : "",
                                      selectedFile: null,
                                    });
                                    setEditModalOpen(true);
                                    // Cerrar modal de confirmación si está abierto
                                    setModalOpen(false);
                                    setNewsIdToDelete(null);
                                  }}
                                >
                                  ✏️
                                </button>
                                <button
                                  className="delete-button"
                                  title="Eliminar"
                                  onClick={() => {
                                    setNewsIdToDelete(id);
                                    setModalContent({
                                      title: "Eliminar noticia",
                                      message:
                                        "¿Está seguro de que desea eliminar esta noticia? Todos los datos serán eliminados permanentemente. Esta acción no se puede deshacer.",
                                      confirmText: "Eliminar",
                                    });
                                    setModalOpen(true);
                                    // Cerrar modal de edición si está abierto
                                    setEditModalOpen(false);
                                    setNoticiaAEditar(null);
                                    setFormData({ descripcion: "", fechaPublicacion: "", selectedFile: null });
                                  }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* --- Actualizar noticia (now in edit modal) --- */}
              {editModalOpen && noticiaAEditar && (
                <div id="modalOverlay" className="modal-overlay">
                  <div className="card">
                    <div className="header">
                      <div className="image">
                        <svg
                          aria-hidden="true"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                          ></path>
                        </svg>
                      </div>
                      <div className="content">
                        <span className="title">Actualizar noticia</span>
                        <p className="message">
                          ¿Está seguro de que desea actualizar esta noticia? Esta acción modificará el registro permanentemente.
                        </p>
                      </div>
                    </div>
                    <div className="actions">
                      <div className="form-row">
                        <div className="form-field">
                          <label className="form-label">Descripción de la noticia</label>
                          <textarea
                            className="input"
                            value={formData.descripcion}
                            onChange={e =>
                              setFormData({ ...formData, descripcion: e.target.value })
                            }
                            rows="4"
                          />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Fecha de publicación</label>
                          <input
                            type="datetime-local"
                            className="input"
                            value={formData.fechaPublicacion}
                            onChange={e =>
                              setFormData({ ...formData, fechaPublicacion: e.target.value })
                            }
                          />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Archivo adjunto (opcional)</label>
                          <input
                            type="file"
                            className="input"
                            onChange={e => {
                              setFormData({ ...formData, selectedFile: e.target.files[0] });
                            }}
                          />
                        </div>
                      </div>
                      <div className="form-footer">
                        <button type="button" className="btn-success" onClick={handleUpdate}>
                          Actualizar
                        </button>
                        <button type="button" className="cancel" onClick={() => {
                          setEditModalOpen(false);
                          setNoticiaAEditar(null);
                          setFormData({ descripcion: "", fechaPublicacion: "", selectedFile: null });
                        }}>
                          Cancelar
                        </button>
                      </div>
                      {error && <p className="error">{error}</p>}
                    </div>
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
            <p>Para dudas sobre una publicación, use el módulo de PQRS.</p>
          </div>
        </div> {/* Cierra page-layout */}

        {/* Confirmation modal (for eliminar) */}
        {modalOpen && (
          <div id="confirmationModalOverlay" className="modal-overlay">
            <div className="card">
              <div className="header">
                <div className="image">
                  <svg
                    aria-hidden="true"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
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
                <button className="btn-success" type="button" onClick={handleConfirm}>
                  {modalContent.confirmText}
                </button>
                <button className="cancel" type="button" onClick={cerrarModal}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div> {/* <--- ¡ESTE ES EL DIV QUE FALTA! Cierra noticias-page */}

      <Footer />
    </>
  );
}

export default Noticias;