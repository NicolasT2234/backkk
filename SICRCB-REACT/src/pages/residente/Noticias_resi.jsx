import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import "../../assets/css/styles.css"
import "../../assets/css/noticias_resi.css"
import NavbarApp from "../../components/NavbarApp.jsx"
import Footer from "../../components/Footer.jsx"

function NoticiaResi() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const [noticias, setNoticias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [filtroTexto, setFiltroTexto] = useState("")

  const [noticiaActiva, setNoticiaActiva] = useState(null)

  // --- Paginación ---
  const porPagina = 6
  const [paginaActual, setPaginaActual] = useState(1)

  useEffect(() => {
    const fetchNoticias = async () => {
      setLoading(true)
      setError("")
      try {
        // Changed to highlighted news endpoint (public)
        const res = await api.get("/noticias/destacadas")
        const data = Array.isArray(res.data) ? res.data : []
        const noticiasList = [...data] // copy to avoid mutating original
        noticiasList.sort((a, b) => new Date(b.fechaPublicacion || 0) - new Date(a.fechaPublicacion || 0))
        setNoticias(noticiasList)
      } catch (err) {
        console.error("Error fetching noticias:", err)
        setError("Error al cargar noticias")
        setNoticias([])
      } finally {
        setLoading(false)
      }
    }

    fetchNoticias()
  }, [])

  // Vuelve a la página 1 cada vez que cambia la búsqueda
  useEffect(() => {
    setPaginaActual(1)
  }, [filtroTexto])

  const getId = (n) => n.id || n._id || n.idNoticia
  const getTitulo = (n) => n.titulo || n.asunto || "Sin título"
  const getDescripcion = (n) => n.descripcion || n.contenido || ""
  // Get backend URL for static files (consistent with API configuration)
const getBackendUrl = () => {
  if (import.meta.env.PROD) {
    // In production, use VITE_API_URL (remove /api suffix if present)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return apiUrl.replace(/\/api$/, '');
  } else {
    // In development, Vite proxies /api to http://localhost:5000
    // Static files are served directly from the backend server
    return 'http://localhost:5000';
  }
};

const getArchivoUrl = (n) => {
  const archivo = n.archivo_url || n.archivoUrl || n.archivo || n.imagenUrl || n.imagen || null;
  // If we have an archivo path, return the full URL
  if (archivo) {
    return `${getBackendUrl()}${archivo}`;
  }
  return null;
}
  const getFecha = (n) => n.fechaPublicacion || n.fechaEnvio || null

  const esImagen = (url) => {
    if (!url) return false
    return /\.(png|jpe?g|gif|webp|svg)$/i.test(url)
  }

  const esPdf = (url) => {
    if (!url) return false
    return /\.pdf$/i.test(url)
  }

  const noticiasFiltradas = (Array.isArray(noticias) ? noticias : []).filter((n) => {
    const titulo = String(getTitulo(n) || "").toLowerCase()
    const descripcion = String(getDescripcion(n) || "").toLowerCase()
    const texto = String(filtroTexto || "").toLowerCase()
    return titulo.includes(texto) || descripcion.includes(texto)
  })

  // --- Cálculo de la página actual ---
  const totalPaginas = Math.max(1, Math.ceil(noticiasFiltradas.length / porPagina))
  const paginaSegura = Math.min(paginaActual, totalPaginas)
  const inicio = (paginaSegura - 1) * porPagina
  const noticiasPagina = noticiasFiltradas.slice(inicio, inicio + porPagina)

  const irPaginaAnterior = () => {
    setPaginaActual((p) => Math.max(1, p - 1))
  }

  const irPaginaSiguiente = () => {
    setPaginaActual((p) => Math.min(totalPaginas, p + 1))
  }

  return (
    <>
      <NavbarApp onLogout={handleLogout} />
      <div className="noticias-res-page">
        <div className="titulo">
          <h1>NOTICIAS</h1>
        </div>

        <div className="subtitulo">
          <span className="subtitulo-banda">Publicaciones y Comunicados</span>
        </div>

        <div className="noticias-content">

          <div className="filtros-row">
            <input
              type="text"
              className="input filtro-input"
              placeholder="Buscar noticia..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
            />
          </div>

          {loading && <p className="hint">Cargando noticias...</p>}
          {error && <p className="error">{error}</p>}
          {!loading && !error && noticias.length === 0 && (
            <p className="hint">No hay noticias publicadas por el momento</p>
          )}
          {!loading && !error && noticias.length > 0 && noticiasFiltradas.length === 0 && (
            <p className="hint">Ningún resultado coincide con tu búsqueda.</p>
          )}

          {!loading && noticiasPagina.length > 0 && (
            <div className="noticias-grid">
              {noticiasPagina.map((n) => {
                const id = getId(n)
                const url = getArchivoUrl(n)
                const fecha = getFecha(n)
                return (
                  <div className="noticia-card" key={id}>
                    <div className="noticia-imagen">
                      {esImagen(url) ? (
                        <img src={url} alt={getTitulo(n)} />
                      ) : esPdf(url) ? (
                        <div className="noticia-pdf-placeholder">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125.1125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          <span>Documento PDF</span>
                        </div>
                      ) : (
                        <div className="noticia-sin-imagen">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25M3 8.25V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25M3 8.25h18" />
                          </svg>
                          <span>SICRCB</span>
                        </div>
                      )}
                    </div>
                    <div className="noticia-body">
                      <span className="noticia-fecha">
                        {fecha ? new Date(fecha).toLocaleDateString() : "Sin fecha"}
                      </span>
                      <h3 className="noticia-titulo">{getTitulo(n)}</h3>
                      {getDescripcion(n) && (
                        <p className="noticia-descripcion">{getDescripcion(n)}</p>
                      )}
                      <button type="button" className="btn-ver-noticia" onClick={() => setNoticiaActiva(n)}>
                        Ver más
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* --- Paginación --- */}
          {!loading && noticiasFiltradas.length > porPagina && (
            <div className="paginacion">
              <button
                type="button"
                className="pagina-flecha"
                onClick={irPaginaAnterior}
                disabled={paginaSegura === 1}
                aria-label="Página anterior"
              >
                &#8249;
              </button>

              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`pagina-numero ${num === paginaSegura ? "activa" : ""}`}
                  onClick={() => setPaginaActual(num)}
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                className="pagina-flecha"
                onClick={irPaginaSiguiente}
                disabled={paginaSegura === totalPaginas}
                aria-label="Página siguiente"
              >
                &#8250;
              </button>
            </div>
          )}

          {/* --- Modal: detalle de noticia --- */}
          {noticiaActiva && (
            <div className="modal-overlay" onClick={() => setNoticiaActiva(null)}>
              <div className="noticia-modal" onClick={(e) => e.stopPropagation()}>
                {getArchivoUrl(noticiaActiva) && esImagen(getArchivoUrl(noticiaActiva)) && (
                  <img className="noticia-modal-imagen" src={getArchivoUrl(noticiaActiva)} alt={getTitulo(noticiaActiva)} />
                )}
                <div className="noticia-modal-body">
                  <span className="noticia-fecha">
                    {getFecha(noticiaActiva) ? new Date(getFecha(noticiaActiva)).toLocaleDateString() : "Sin fecha"}
                  </span>
                  <h3 className="noticia-titulo">{getTitulo(noticiaActiva)}</h3>
                  <p className="noticia-descripcion-completa">{getDescripcion(noticiaActiva) || "Sin descripción disponible."}</p>

                  {getArchivoUrl(noticiaActiva) && esPdf(getArchivoUrl(noticiaActiva)) && (
                    <a
                      className="noticia-pdf-link"
                      href={getArchivoUrl(noticiaActiva)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver documento PDF
                    </a>
                  )}
                </div>
                <div className="actions">
                  <button className="cancel" type="button" onClick={() => setNoticiaActiva(null)}>Cerrar</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  )
}

export default NoticiaResi