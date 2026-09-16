import {
    BellRing,
    Calendar,
    ExternalLink,
    Eye,
    FileText,
    Newspaper,
    PlusCircle,
    Search,
    Trash2,
    UploadCloud,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/css/noticias.css";
import "../../assets/css/styles.css";
import Footer from "../../components/Footer.jsx";
import NavbarApp from "../../components/NavbarApp.jsx";
import api from "../../services/api.js";

function Noticias() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("buscar");
    const [noticias, setNoticias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Formulario nueva noticia
    const [formData, setFormData] = useState({
        descripcion: "",
        fechaPublicacion: new Date().toISOString().split("T")[0],
        selectedFile: null,
    });
    const [formMsg, setFormMsg] = useState({ error: "", success: "" });

    // Modal de confirmación para eliminar
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState(null);

    // Modal para ver noticia e imagen completa en grande
    const [noticiaActiva, setNoticiaActiva] = useState(null);

    const getBackendUrl = () => {
        if (import.meta.env.PROD) {
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
            return apiUrl.replace(/\/api$/, "");
        }
        return "http://localhost:5000";
    };

    const getArchivoUrl = n => {
        const archivo = n?.archivo_url || n?.archivoUrl || n?.archivo || n?.imagenUrl || n?.imagen || null;
        if (archivo) {
            if (archivo.startsWith("http://") || archivo.startsWith("https://")) {
                return archivo;
            }
            return `${getBackendUrl()}${archivo.startsWith("/") ? "" : "/"}${archivo}`;
        }
        return null;
    };

    const esImagen = url => {
        if (!url) return false;
        return /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url);
    };

    const esPdf = url => {
        if (!url) return false;
        return /\.pdf(\?.*)?$/i.test(url);
    };

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout");
        } catch (e) {
            console.error(e);
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/");
        }
    };

    const fetchNoticias = async () => {
        setLoading(true);
        try {
            const res = await api.get("/noticias");
            setNoticias(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Error al obtener noticias:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNoticias();
    }, []);

    // Publicar nueva noticia
    const handleSubmit = async e => {
        e.preventDefault();
        setFormMsg({ error: "", success: "" });

        if (!formData.descripcion.trim()) {
            setFormMsg({ error: "La descripción del comunicado es requerida.", success: "" });
            return;
        }

        const form = new FormData();
        form.append("descripcion", formData.descripcion);
        form.append("fechaPublicacion", formData.fechaPublicacion);
        if (formData.selectedFile) {
            form.append("archivo", formData.selectedFile);
        }

        try {
            await api.post("/noticias", form, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setFormMsg({ error: "", success: "¡Comunicado publicado con éxito!" });
            setFormData({
                descripcion: "",
                fechaPublicacion: new Date().toISOString().split("T")[0],
                selectedFile: null,
            });
            fetchNoticias();
            setTimeout(() => setActiveTab("buscar"), 1400);
        } catch (err) {
            setFormMsg({ error: "Error al publicar la noticia. Intenta nuevamente.", success: "" });
        }
    };

    // Eliminar noticia
    const handleDelete = async () => {
        if (!idToDelete) return;
        try {
            await api.delete(`/noticias/${idToDelete}`);
            setDeleteModalOpen(false);
            fetchNoticias();
        } catch (err) {
            console.error("Error al eliminar:", err);
        }
    };

    const noticiasFiltradas = noticias.filter(n => {
        const desc = (n.descripcion || n.contenido || "").toLowerCase();
        return desc.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="noticias-page">
            <NavbarApp onLogout={handleLogout} />

            <main className="noticias-main-container">
                {/* Banner Superior Administrativo */}
                <section className="sicrcb-news-hero">
                    <div className="news-hero-text">
                        <h1>
                            <span>Administración de Noticias & Circulares</span>
                            <BellRing size={26} stroke="#FFD0A0" />
                        </h1>
                        <p>Emite anuncios oficiales y comunicados para todos los copropietarios.</p>
                    </div>
                    <div className="news-hero-badge">
                        <Newspaper size={16} stroke="#FFD0A0" />
                        <span>{noticias.length} Comunicados Emitidos</span>
                    </div>
                </section>

                {/* Toolbar de Pestañas & Buscador */}
                <div className="sicrcb-news-toolbar">
                    <div className="news-tabs-group">
                        <button
                            type="button"
                            className={`news-tab-btn ${activeTab === "buscar" ? "active" : ""}`}
                            onClick={() => setActiveTab("buscar")}
                        >
                            <Newspaper size={16} />
                            <span>Boletín Publicado ({noticias.length})</span>
                        </button>
                        <button
                            type="button"
                            className={`news-tab-btn ${activeTab === "nueva" ? "active" : ""}`}
                            onClick={() => setActiveTab("nueva")}
                        >
                            <PlusCircle size={16} />
                            <span>Crear Nuevo Comunicado</span>
                        </button>
                    </div>

                    {activeTab === "buscar" && (
                        <div className="news-search-box">
                            <Search size={17} className="news-search-icon" />
                            <input
                                type="text"
                                className="news-search-input"
                                placeholder="Buscar en comunicados..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {/* Pestaña 1: Directorio & Tarjetas para Admin */}
                {activeTab === "buscar" && (
                    <div>
                        {loading ? (
                            <div style={{ textAlign: "center", padding: "4rem 0", color: "#8C3200" }}>
                                Cargando noticias...
                            </div>
                        ) : noticiasFiltradas.length === 0 ? (
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "3.5rem 1rem",
                                    background: "#ffffff",
                                    borderRadius: "18px",
                                    border: "1px solid var(--news-border)",
                                }}
                            >
                                <p style={{ color: "#735340", margin: 0 }}>
                                    No hay comunicados que coincidan con la búsqueda.
                                </p>
                            </div>
                        ) : (
                            <div className="sicrcb-news-grid">
                                {noticiasFiltradas.map(n => {
                                    const id = n.id || n._id || n.idNoticia;
                                    const desc = n.descripcion || n.contenido || "";
                                    const fecha = n.fechaPublicacion || n.fechaEnvio || n.fecha_publicacion;
                                    const archivoUrl = getArchivoUrl(n);
                                    const tieneImg = esImagen(archivoUrl);

                                    return (
                                        <div key={id} className="sicrcb-news-card">
                                            {/* Cabecera con Imagen de la Noticia o Placeholder */}
                                            <div
                                                className="news-card-media"
                                                style={{ cursor: "pointer" }}
                                                onClick={() => setNoticiaActiva(n)}
                                                title="Clic para ver detalle e imagen completa"
                                            >
                                                {tieneImg ? (
                                                    <img src={archivoUrl} alt="Noticia" />
                                                ) : (
                                                    <div className="news-media-placeholder">
                                                        {esPdf(archivoUrl) ? (
                                                            <FileText size={38} />
                                                        ) : (
                                                            <Newspaper size={38} />
                                                        )}
                                                        <span style={{ fontSize: "0.78rem", fontWeight: "700" }}>
                                                            {esPdf(archivoUrl) ? "Documento PDF" : "Casa Blanca"}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="news-card-body">
                                                <div className="news-meta-row">
                                                    <span className="news-badge">Oficial Casa Blanca</span>
                                                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                        <Calendar size={13} />
                                                        {fecha ? new Date(fecha).toLocaleDateString() : "Hoy"}
                                                    </span>
                                                </div>
                                                <p
                                                    className="news-card-desc"
                                                    style={{ fontSize: "0.95rem", color: "#2C1203" }}
                                                >
                                                    {desc}
                                                </p>
                                            </div>

                                            <div className="news-card-footer">
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <small style={{ color: "#735340", fontWeight: "600" }}>
                                                        ID: #{id}
                                                    </small>
                                                    {archivoUrl && (
                                                        <span
                                                            style={{
                                                                fontSize: "0.74rem",
                                                                padding: "2px 8px",
                                                                borderRadius: "10px",
                                                                backgroundColor: tieneImg ? "#fff7ed" : "#f0fdf4",
                                                                color: tieneImg ? "#c2410c" : "#166534",
                                                                border: `1px solid ${tieneImg ? "#fed7aa" : "#bbf7d0"}`,
                                                                fontWeight: "600",
                                                            }}
                                                        >
                                                            {tieneImg ? "Con Imagen" : "PDF Adjunto"}
                                                        </span>
                                                    )}
                                                </div>
                                                <div
                                                    className="news-admin-actions"
                                                    style={{ display: "flex", gap: "6px" }}
                                                >
                                                    {/* Botón ver imagen/detalle */}
                                                    <button
                                                        type="button"
                                                        className="btn-news-action"
                                                        style={{
                                                            background: "rgba(140,50,0,0.08)",
                                                            color: "#8C3200",
                                                            border: "none",
                                                            borderRadius: "8px",
                                                            padding: "6px",
                                                            cursor: "pointer",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                        }}
                                                        title="Ver Noticia Completa con Imagen"
                                                        onClick={() => setNoticiaActiva(n)}
                                                    >
                                                        <Eye size={16} />
                                                    </button>

                                                    {/* Botón Eliminar */}
                                                    <button
                                                        type="button"
                                                        className="btn-news-action delete"
                                                        title="Eliminar Noticia"
                                                        onClick={() => {
                                                            setIdToDelete(id);
                                                            setDeleteModalOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
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

                {/* Pestaña 2: Formulario de Nueva Publicación */}
                {activeTab === "nueva" && (
                    <div className="news-form-card">
                        <div className="news-form-header">
                            <h2>Publicar Nuevo Comunicado</h2>
                            <p>El anuncio será visible de forma inmediata en el portal de los residentes.</p>
                        </div>

                        <div className="news-form-body">
                            {formMsg.error && (
                                <div
                                    style={{
                                        padding: "0.75rem 1rem",
                                        background: "#fde8e8",
                                        color: "#9b1c1c",
                                        borderRadius: "10px",
                                        marginBottom: "1.25rem",
                                        fontWeight: "600",
                                    }}
                                >
                                    {formMsg.error}
                                </div>
                            )}
                            {formMsg.success && (
                                <div
                                    style={{
                                        padding: "0.75rem 1rem",
                                        background: "#def7ec",
                                        color: "#03543f",
                                        borderRadius: "10px",
                                        marginBottom: "1.25rem",
                                        fontWeight: "600",
                                    }}
                                >
                                    {formMsg.success}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="news-field-group">
                                    <label className="news-label">Fecha de Publicación</label>
                                    <input
                                        type="date"
                                        className="news-input"
                                        value={formData.fechaPublicacion}
                                        onChange={e => setFormData({ ...formData, fechaPublicacion: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="news-field-group">
                                    <label className="news-label">Contenido del Comunicado</label>
                                    <textarea
                                        rows={5}
                                        className="news-textarea"
                                        placeholder="Escribe el mensaje o circular oficial para los residentes..."
                                        value={formData.descripcion}
                                        onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="news-field-group">
                                    <label className="news-label">Adjuntar Imagen o PDF Oficial (Opcional)</label>
                                    <div className="news-file-upload-box">
                                        <UploadCloud size={32} stroke="#8C3200" style={{ marginBottom: "0.5rem" }} />
                                        <p
                                            style={{
                                                margin: "0 0 0.5rem 0",
                                                fontWeight: "600",
                                                fontSize: "0.88rem",
                                                color: "#8C3200",
                                            }}
                                        >
                                            {formData.selectedFile
                                                ? formData.selectedFile.name
                                                : "Haz clic para seleccionar un archivo"}
                                        </p>
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            onChange={e =>
                                                setFormData({ ...formData, selectedFile: e.target.files[0] })
                                            }
                                            style={{ fontSize: "0.82rem", color: "#735340" }}
                                        />
                                    </div>

                                    {formData.selectedFile &&
                                        formData.selectedFile.type &&
                                        formData.selectedFile.type.startsWith("image/") && (
                                            <div
                                                style={{
                                                    marginTop: "0.85rem",
                                                    borderRadius: "12px",
                                                    overflow: "hidden",
                                                    maxWidth: "260px",
                                                    border: "1.5px solid #fed7aa",
                                                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                                }}
                                            >
                                                <img
                                                    src={URL.createObjectURL(formData.selectedFile)}
                                                    alt="Vista previa seleccionada"
                                                    style={{ width: "100%", height: "auto", display: "block" }}
                                                />
                                            </div>
                                        )}
                                </div>

                                <button type="submit" className="btn-publish-submit">
                                    <PlusCircle size={18} />
                                    <span>Publicar en la Comunidad</span>
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>

            {/* Modal Confirmar Eliminación */}
            {deleteModalOpen && (
                <div className="sicrcb-news-modal-backdrop" onClick={() => setDeleteModalOpen(false)}>
                    <div
                        className="sicrcb-news-modal-card"
                        style={{ maxWidth: "460px" }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="news-modal-header">
                            <h3>Confirmar Eliminación</h3>
                            <button
                                type="button"
                                onClick={() => setDeleteModalOpen(false)}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#8C3200",
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="news-modal-body">
                            <p style={{ margin: 0, color: "#594234", lineHeight: "1.5" }}>
                                ¿Estás seguro de que deseas eliminar este comunicado? Dejará de ser visible para los
                                residentes en su panel.
                            </p>
                        </div>
                        <div
                            style={{
                                padding: "1rem 1.5rem",
                                background: "#fdfaf7",
                                borderTop: "1px solid var(--news-border)",
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "0.75rem",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setDeleteModalOpen(false)}
                                style={{
                                    padding: "0.6rem 1.2rem",
                                    background: "#ffffff",
                                    border: "1px solid var(--news-border)",
                                    borderRadius: "10px",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                style={{
                                    padding: "0.6rem 1.2rem",
                                    background: "#e53e3e",
                                    border: "none",
                                    borderRadius: "10px",
                                    color: "#ffffff",
                                    cursor: "pointer",
                                    fontWeight: "700",
                                }}
                            >
                                Eliminar Noticia
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para ver noticia completa con imagen ampliada */}
            {noticiaActiva && (
                <div className="sicrcb-news-modal-backdrop" onClick={() => setNoticiaActiva(null)}>
                    <div className="sicrcb-news-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="news-modal-header">
                            <h3 style={{ margin: 0 }}>Comunicado Oficial Casa Blanca</h3>
                            <button
                                type="button"
                                onClick={() => setNoticiaActiva(null)}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#8C3200",
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="news-modal-body">
                            {getArchivoUrl(noticiaActiva) && esImagen(getArchivoUrl(noticiaActiva)) && (
                                <div
                                    style={{
                                        marginBottom: "1.25rem",
                                        borderRadius: "12px",
                                        overflow: "hidden",
                                        maxHeight: "380px",
                                        border: "1px solid rgba(140,50,0,0.15)",
                                    }}
                                >
                                    <img
                                        src={getArchivoUrl(noticiaActiva)}
                                        alt="Imagen de la noticia"
                                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                    />
                                </div>
                            )}

                            <div
                                style={{
                                    display: "flex",
                                    gap: "1rem",
                                    color: "#735340",
                                    fontSize: "0.82rem",
                                    marginBottom: "1.25rem",
                                }}
                            >
                                <span>
                                    Fecha:{" "}
                                    {new Date(
                                        noticiaActiva.fechaPublicacion || noticiaActiva.fecha_publicacion || Date.now(),
                                    ).toLocaleDateString()}
                                </span>
                                <span>·</span>
                                <span>Publicado por: Administrador</span>
                            </div>

                            <div
                                className="news-modal-text"
                                style={{
                                    fontSize: "0.95rem",
                                    lineHeight: "1.6",
                                    color: "#2C1203",
                                    whiteSpace: "pre-wrap",
                                }}
                            >
                                {noticiaActiva.descripcion || noticiaActiva.contenido}
                            </div>

                            {getArchivoUrl(noticiaActiva) && esPdf(getArchivoUrl(noticiaActiva)) && (
                                <div
                                    style={{
                                        marginTop: "1.5rem",
                                        padding: "1rem",
                                        background: "#fff8f2",
                                        borderRadius: "12px",
                                        border: "1px solid rgba(140,50,0,0.15)",
                                    }}
                                >
                                    <a
                                        href={getArchivoUrl(noticiaActiva)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                            color: "#8C3200",
                                            fontWeight: "700",
                                            textDecoration: "none",
                                        }}
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
    );
}

export default Noticias;
