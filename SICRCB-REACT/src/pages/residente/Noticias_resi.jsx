import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import "../../assets/css/styles.css"
import "../../assets/css/noticias.css"
import NavbarApp from "../../components/NavbarApp.jsx"
import Footer from "../../components/Footer.jsx"
import {
  Newspaper,
  Calendar,
  Search,
  FileText,
  Image as ImageIcon,
  ArrowRight,
  X,
  ExternalLink,
  BellRing
} from "lucide-react"

function NoticiasResi() {
  const navigate = useNavigate()
  const [noticias, setNoticias] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [noticiaActiva, setNoticiaActiva] = useState(null)

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/login")
  }

  const getBackendUrl = () => {
    if (import.meta.env.PROD) {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
      return apiUrl.replace(/\/api$/, "")
    }
    return "http://localhost:5000"
  }

  const getArchivoUrl = (n) => {
    const archivo = n.archivo_url || n.archivoUrl || n.archivo || n.imagenUrl || n.imagen || null
    if (archivo) {
      return `${getBackendUrl()}${archivo}`
    }
    return null
  }

  const esImagen = (url) => {
    if (!url) return false
    return /\.(png|jpe?g|gif|webp|svg)$/i.test(url)
  }

  const esPdf = (url) => {
    if (!url) return false
    return /\.pdf$/i.test(url)
  }

  useEffect(() => {
    const fetchNoticias = async () => {
      setLoading(true)
      try {
        const res = await api.get("/noticias/destacadas")
        const data = Array.isArray(res.data) ? res.data : []
        const lista = [...data].sort((a, b) => new Date(b.fechaPublicacion || 0) - new Date(a.fechaPublicacion || 0))
        setNoticias(lista)
      } catch (err) {
        console.error("Error al cargar noticias:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchNoticias()
  }, [])

  // Filtrado de noticias
  const noticiasFiltradas = noticias.filter((n) => {
    const titulo = (n.titulo || n.asunto || "").toLowerCase()
    const desc = (n.descripcion || n.contenido || "").toLowerCase()
    const term = searchTerm.toLowerCase()
    return titulo.includes(term) || desc.includes(term)
  })

  return (
    <div className="noticias-page">
      <NavbarApp onLogout={handleLogout} />

      <main className="noticias-main-container">
        {/* Banner Superior */}
        <section className="sicrcb-news-hero">
          <div className="news-hero-text">
            <h1>
              <span>Boletín Oficial & Noticias</span>
              <Newspaper size={26} stroke="#FFD0A0" />
            </h1>
            <p>Comunidad y avisos importantes del Conjunto Residencial Casa Blanca.</p>
          </div>
          <div className="news-hero-badge">
            <BellRing size={16} stroke="#FFD0A0" />
            <span>{noticias.length} Comunicados Activos</span>
          </div>
        </section>

        {/* Buscador */}
        <div className="sicrcb-news-toolbar">
          <span style={{ fontWeight: "700", color: "#8C3200", fontSize: "0.95rem" }}>
            Últimas Actualizaciones
          </span>
          <div className="news-search-box">
            <Search size={17} className="news-search-icon" />
            <input
              type="text"
              className="news-search-input"
              placeholder="Buscar en comunicados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Grid de Noticias */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "#8C3200" }}>
            Cargando boletín comunitario...
          </div>
        ) : noticiasFiltradas.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", background: "#ffffff", borderRadius: "18px", border: "1px solid rgba(140,50,0,0.12)" }}>
            <Newspaper size={48} stroke="#8C3200" style={{ opacity: 0.5, marginBottom: "1rem" }} />
            <h3 style={{ color: "#8C3200", fontWeight: "800", margin: "0 0 0.5rem 0" }}>
              No se encontraron comunicados
            </h3>
            <p style={{ color: "#735340", margin: 0 }}>
              No hay noticias que coincidan con los términos de búsqueda ingresados.
            </p>
          </div>
        ) : (
          <div className="sicrcb-news-grid">
            {noticiasFiltradas.map((n) => {
              const id = n.id || n._id || n.idNoticia
              const titulo = n.titulo || n.asunto || "Comunicado Oficial"
              const desc = n.descripcion || n.contenido || ""
              const fecha = n.fechaPublicacion || n.fechaEnvio
              const archivoUrl = getArchivoUrl(n)
              const tieneImg = esImagen(archivoUrl)

              return (
                <article key={id} className="sicrcb-news-card">
                  {/* Encabezado con imagen o placeholder */}
                  <div className="news-card-media">
                    {tieneImg ? (
                      <img src={archivoUrl} alt={titulo} />
                    ) : (
                      <div className="news-media-placeholder">
                        {esPdf(archivoUrl) ? <FileText size={36} /> : <Newspaper size={36} />}
                        <span style={{ fontSize: "0.75rem", fontWeight: "700" }}>Casa Blanca</span>
                      </div>
                    )}
                  </div>

                  <div className="news-card-body">
                    <div className="news-meta-row">
                      <span className="news-badge">Oficial</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Calendar size={13} />
                        {fecha ? new Date(fecha).toLocaleDateString() : "Reciente"}
                      </span>
                    </div>

                    <h2 className="news-card-title">{titulo}</h2>
                    <p className="news-card-desc">
                      {desc.length > 115 ? desc.substring(0, 115) + "..." : desc}
                    </p>
                  </div>

                  <div className="news-card-footer">
                    <button
                      type="button"
                      className="news-read-more-btn"
                      onClick={() => setNoticiaActiva(n)}
                    >
                      <span>Leer completo</span>
                      <ArrowRight size={15} />
                    </button>
                    {archivoUrl && esPdf(archivoUrl) && (
                      <span style={{ fontSize: "0.75rem", color: "#8C3200", fontWeight: "600" }}>
                        PDF Adjunto
                      </span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      {/* Modal para leer noticia completa */}
      {noticiaActiva && (
        <div className="sicrcb-news-modal-backdrop" onClick={() => setNoticiaActiva(null)}>
          <div className="sicrcb-news-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="news-modal-header">
              <h3>{noticiaActiva.titulo || "Comunicado de la Administración"}</h3>
              <button
                type="button"
                onClick={() => setNoticiaActiva(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#8C3200" }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="news-modal-body">
              {getArchivoUrl(noticiaActiva) && esImagen(getArchivoUrl(noticiaActiva)) && (
                <img
                  src={getArchivoUrl(noticiaActiva)}
                  alt="Imagen de noticia"
                  className="news-modal-img"
                />
              )}

              <div style={{ display: "flex", gap: "1rem", color: "#735340", fontSize: "0.82rem", marginBottom: "1.25rem" }}>
                <span>Fecha: {new Date(noticiaActiva.fechaPublicacion || Date.now()).toLocaleDateString()}</span>
                <span>·</span>
                <span>Autor: Administración Casa Blanca</span>
              </div>

              <div className="news-modal-text">
                {noticiaActiva.descripcion || noticiaActiva.contenido}
              </div>

              {getArchivoUrl(noticiaActiva) && esPdf(getArchivoUrl(noticiaActiva)) && (
                <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#fff8f2", borderRadius: "12px", border: "1px solid rgba(140,50,0,0.15)" }}>
                  <a
                    href={getArchivoUrl(noticiaActiva)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#8C3200", fontWeight: "700", textDecoration: "none" }}
                  >
                    <FileText size={18} />
                    <span>Ver documento adjunto oficial (PDF)</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer style={{ marginTop: "auto" }} />
    </div>
  )
}

export default NoticiasResi