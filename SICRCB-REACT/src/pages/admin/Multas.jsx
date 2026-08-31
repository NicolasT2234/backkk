import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../assets/css/styles.css";
import "../../assets/css/multas.css";
import NavbarApp from "../../components/NavbarApp.jsx";
import Footer from "../../components/Footer.jsx";

function Multas() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    // Form state for agregar multa
    const [formData, setFormData] = useState({
        nombre: "",
        descripcion: "",
        id_tipo_multa: "",
        idApartamento: "",
        evidencia: "",
    });

    // States for the general list of multas
    const [multas, setMultas] = useState([]);
    const [multasLoading, setMultasLoading] = useState(true);
    const [multasError, setMultasError] = useState("");

    // States for dropdowns in Agregar form
    const [tiposMulta, setTiposMulta] = useState([]);
    const [apartamentos, setApartamentos] = useState([]);
    const [dropdownsLoading, setDropdownsLoading] = useState(true);
    const [dropdownsError, setDropdownsError] = useState("");

    // Tabs state
    const [activeTab, setActiveTab] = useState("nueva");

    // Form submit states
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Search / filter state
    const [searchTerm, setSearchTerm] = useState("");

    // Edit modal states (similar to Noticias)
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [multaAEditar, setMultaAEditar] = useState(null);
    const [editFormData, setEditFormData] = useState({
        estado: "",
    });
    const [editError, setEditError] = useState("");
    const [editSuccess, setEditSuccess] = useState("");

    // Delete confirmation states
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [multaIdToDelete, setMultaIdToDelete] = useState(null);
    const [deleteError, setDeleteError] = useState("");
    const [deleteSuccess, setDeleteSuccess] = useState("");

    // Helper to get ID from multa object (supports different possible field names)
    const getId = m => m.id || m._id || m.idMulta;
    // Helper to get apartamento display string
    const getApartamentoDisplay = m => {
        const bloque = m.bloque || "";
        const numero = m.numero_apartamento !== undefined ? m.numero_apartamento : m.numero;
        const interior = m.interior ? `- ${m.interior}` : "";
        return `${bloque}-${numero}${interior}`;
    };

    // Load data on mount
    useEffect(() => {
        const fetchMultasList = async () => {
            setMultasLoading(true);
            setMultasError("");
            try {
                const res = await api.get("/multas");
                setMultas(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Error fetching multas list:", err);
                setMultasError("No se pudo cargar la lista de multas");
                setMultas([]);
            } finally {
                setMultasLoading(false);
            }
        };

        const fetchDropdownData = async () => {
            setDropdownsLoading(true);
            setDropdownsError("");
            try {
                // Fetch tipos de multa
                const tiposRes = await api.get("/tipos_multa");
                setTiposMulta(Array.isArray(tiposRes.data) ? tiposRes.data : []);

                // Fetch apartamentos
                const apartamentosRes = await api.get("/apartamentos");
                setApartamentos(Array.isArray(apartamentosRes.data) ? apartamentosRes.data : []);
            } catch (err) {
                console.error("Error fetching dropdown data:", err);
                setDropdownsError("No se pudo cargar los datos para los formularios");
                setTiposMulta([]);
                setApartamentos([]);
            } finally {
                setDropdownsLoading(false);
            }
        };

        fetchMultasList();
        fetchDropdownData();
    }, []);

    // Filtered multas based on search term
    const multasFiltradas = (Array.isArray(multas) ? multas : []).filter(multa => {
        const texto = searchTerm.toLowerCase();
        const idStr = String(getId(multa)).toLowerCase();
        const nombre = (multa.nombre || "").toLowerCase();
        const tipoDesc = (multa.descripcion_tipo_multa || "").toLowerCase();
        const evidencia = (multa.evidencia || "").toLowerCase();
        const bloqueNumero = (getApartamentoDisplay(multa) || "").toLowerCase();
        return (
            idStr.includes(texto) ||
            nombre.includes(texto) ||
            tipoDesc.includes(texto) ||
            evidencia.includes(texto) ||
            bloqueNumero.includes(texto)
        );
    });

    // Handle submit for agregar multa
    const handleSubmit = async e => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Validate required fields
        if (
            !formData.nombre ||
            !formData.descripcion ||
            !formData.id_tipo_multa ||
            !formData.idApartamento ||
            !formData.evidencia
        ) {
            setError("Complete todos los campos obligatorios");
            return;
        }

        try {
            // Send data as JSON
            const res = await api.post("/multas", formData, {
                headers: { "Content-Type": "application/json" },
            });

            const id = res.data && (res.data.id || res.data._id || res.data.idMulta);
            setSuccess(id ? `Multa agregada con éxito (ID: ${id})` : "Multa agregada con éxito");

            // Reset form
            setFormData({
                nombre: "",
                descripcion: "",
                id_tipo_multa: "",
                idApartamento: "",
                evidencia: "",
            });

            // Refresh the list after adding a new multa
            const res2 = await api.get("/multas");
            setMultas(Array.isArray(res2.data) ? res2.data : []);
        } catch (err) {
            console.error("Error creating multa:", err);
            const serverMsg = err.response?.data?.message || err.response?.data || err.message;
            setError(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg));
        }
    };

    // Handle edit multa (update estado)
    const handleUpdate = async () => {
        setEditError("");
        setEditSuccess("");

        if (!editFormData.estado) {
            setEditError("Seleccione el nuevo estado de la multa");
            return;
        }

        const id = getId(multaAEditar);
        if (!id) {
            setEditError("Seleccione una multa para actualizar");
            return;
        }

        try {
            // Send data as JSON
            const res = await api.put(
                `/multas/${id}`,
                { estado: editFormData.estado },
                {
                    headers: { "Content-Type": "application/json" },
                },
            );

            const updatedId = res.data && (res.data.id || res.data._id || res.data.idMulta);
            setEditSuccess(
                updatedId ? `Multa actualizada correctamente (ID: ${updatedId})` : "Multa actualizada correctamente",
            );
            setEditModalOpen(false);
            setMultaAEditar(null);
            setEditFormData({ estado: "" });

            // Refresh the list after updating
            const res2 = await api.get("/multas");
            setMultas(Array.isArray(res2.data) ? res2.data : []);
        } catch (err) {
            console.error("Error updating multa:", err);
            const serverMsg = err.response?.data?.message || err.response?.data || err.message;
            setEditError(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg));
        }
    };

    // Handle delete multa
    const handleDelete = async () => {
        setDeleteError("");
        setDeleteSuccess("");

        const id = multaIdToDelete;
        if (!id) {
            setDeleteError("ID de multa inválido");
            return;
        }

        try {
            await api.delete(`/multas/${id}`);
            setDeleteSuccess("Multa eliminada correctamente");
            setDeleteModalOpen(false);
            setMultaIdToDelete(null);

            // Refresh the list after deletion
            const res = await api.get("/multas");
            setMultas(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Error deleting multa:", err);
            const serverMsg = err.response?.data?.message || err.response?.data || err.message;
            setDeleteError(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg));
        }
    };

    // Open edit modal with multa data
    const openEditModal = multa => {
        setMultaAEditar(multa);
        setEditFormData({ estado: multa.estado || "" });
        setEditError("");
        setEditSuccess("");
        setEditModalOpen(true);
    };

    // Open delete confirmation modal
    const openDeleteModal = id => {
        setMultaIdToDelete(id);
        setDeleteError("");
        setDeleteSuccess("");
        setDeleteModalOpen(true);
    };

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
                                <button
                                    type="button"
                                    className={activeTab === "nueva" ? "btn-success" : ""}
                                    onClick={() => setActiveTab("nueva")}
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

                            {/* --- Agregar multa --- */}
                            {activeTab === "nueva" && (
                                <form onSubmit={handleSubmit}>
                                    <div className="form-row">
                                        <div className="form-field">
                                            <label className="form-label">Nombre de la multa</label>
                                            <input
                                                type="text"
                                                className="input"
                                                required
                                                value={formData.nombre}
                                                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label className="form-label">Descripción</label>
                                            <input
                                                type="text"
                                                className="input"
                                                required
                                                value={formData.descripcion}
                                                onChange={e =>
                                                    setFormData({ ...formData, descripcion: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-field">
                                            <label className="form-label">Tipo de multa</label>
                                            <select
                                                className="input"
                                                required
                                                value={formData.id_tipo_multa}
                                                onChange={e =>
                                                    setFormData({ ...formData, id_tipo_multa: e.target.value })
                                                }
                                            >
                                                <option value="">Seleccione un tipo...</option>
                                                {tiposMulta.map(tipo => (
                                                    <option key={tipo.id} value={tipo.id}>
                                                        {tipo.descripcion}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-field">
                                            <label className="form-label">Apartamento</label>
                                            <select
                                                className="input"
                                                required
                                                value={formData.idApartamento}
                                                onChange={e =>
                                                    setFormData({ ...formData, idApartamento: e.target.value })
                                                }
                                            >
                                                <option value="">Seleccione un apartamento...</option>
                                                {apartamentos.map(apt => (
                                                    <option key={apt.id} value={apt.id}>
                                                        {apt.bloque_nombre}-{apt.numero}
                                                        {apt.interior ? " - " + apt.interior : ""}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-field">
                                            <label className="form-label">Evidencia (URL o referencia)</label>
                                            <input
                                                type="text"
                                                className="input"
                                                required
                                                value={formData.evidencia}
                                                onChange={e => setFormData({ ...formData, evidencia: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-footer">
                                        <button type="submit" className="btn-success">
                                            Agregar
                                        </button>
                                        <p className="hint">
                                            <i>La multa genera un ID a la hora de ser registrada</i>
                                        </p>
                                    </div>
                                    {success && <p className="success">{success}</p>}
                                    {error && <p className="error">{error}</p>}
                                    {dropdownsLoading && <p className="hint">Cargando datos para los formularios...</p>}
                                    {dropdownsError && <p className="error">{dropdownsError}</p>}
                                </form>
                            )}

                            {/* --- Buscar multa (now main view with search filter) --- */}
                            {activeTab === "buscar" && (
                                <div>
                                    <div className="form-row">
                                        <div className="form-field">
                                            <label className="form-label">Buscar multas</label>
                                            <input
                                                type="text"
                                                placeholder="Buscar por ID, nombre, tipo, evidencia o apartamento..."
                                                className="input filtro-input"
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {multasLoading && <p className="hint">Cargando lista de multas...</p>}
                                    {multasError && <p className="error">{multasError}</p>}
                                    {!multasLoading && !multasError && multas.length === 0 && (
                                        <p className="hint">No hay multas registradas.</p>
                                    )}
                                    {!multasLoading &&
                                        !multasError &&
                                        multas.length > 0 &&
                                        multasFiltradas.length === 0 && (
                                            <p className="hint">
                                                No se encontraron multas que coincidan con la búsqueda.
                                            </p>
                                        )}
                                    {!multasLoading && !multasError && multasFiltradas.length > 0 && (
                                        <div className="multa-list">
                                            {multasFiltradas.map(multa => {
                                                const id = getId(multa);
                                                return (
                                                    <div className="multa-list-item" key={id}>
                                                        <div className="multa-list-item-content">
                                                            <div className="multa-list-item-row">
                                                                <span className="multa-list-item-id">#{id}</span>
                                                                <span className="multa-list-item-nombre">
                                                                    {multa.nombre}
                                                                </span>
                                                            </div>
                                                            <div className="multa-list-item-row">
                                                                <span className="multa-list-item-label">Tipo:</span>
                                                                <span className="multa-list-item-tipo">
                                                                    {multa.descripcion_tipo_multa}
                                                                </span>
                                                            </div>
                                                            <div className="multa-list-item-row">
                                                                <span className="multa-list-item-label">
                                                                    Evidencia:
                                                                </span>
                                                                <span className="multa-list-item-evidencia">
                                                                    {multa.evidencia}
                                                                </span>
                                                            </div>
                                                            <div className="multa-list-item-row">
                                                                <span className="multa-item-label">Apartamento:</span>
                                                                <span className="multa-item-apartamento">
                                                                    {getApartamentoDisplay(multa)}
                                                                </span>
                                                            </div>
                                                            <div className="multa-list-item-row">
                                                                <span className="multa-list-item-label">Estado:</span>
                                                                <span
                                                                    className={`badge ${
                                                                        (multa.estado || "").toLowerCase() === "pendiente"
                                                                            ? "badge-pendiente"
                                                                            : (multa.estado || "").toLowerCase() ===
                                                                                "en proceso"
                                                                              ? "badge-en-proceso"
                                                                              : (multa.estado || "").toLowerCase() ===
                                                                                  "resuelta"
                                                                                ? "badge-resuelta"
                                                                                : "badge-otros"
                                                                    }`}
                                                                >
                                                                    {multa.estado}
                                                                </span>
                                                            </div>
                                                            <div className="multa-list-item-actions">
                                                                <button
                                                                    className="edit-button"
                                                                    title="Editar estado"
                                                                    onClick={() => openEditModal(multa)}
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    className="delete-button"
                                                                    title="Eliminar multa"
                                                                    onClick={() => openDeleteModal(id)}
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
                {/* Edit Modal (similar to Noticias) */}
                {editModalOpen && multaAEditar && (
                    <div id="editModalOverlay" className="modal-overlay">
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
                                    <span className="title">Actualizar estado de multa</span>
                                    <p className="message">
                                        ¿Está seguro de que desea actualizar el estado de esta multa? Esta acción modificará
                                        el registro permanentemente.
                                    </p>
                                </div>
                            </div>
                            <div className="actions">
                                <div className="form-row">
                                    <div className="form-field">
                                        <label className="form-label">Nuevo estado</label>
                                        <select
                                            className="input"
                                            required
                                            value={editFormData.estado}
                                            onChange={e => setEditFormData({ ...editFormData, estado: e.target.value })}
                                        >
                                            <option value="">Seleccione un estado...</option>
                                            <option value="Pendiente">Pendiente</option>
                                            <option value="En proceso">En proceso</option>
                                            <option value="Resuelta">Resuelta</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-footer">
                                    <button type="button" className="btn-success" onClick={handleUpdate}>
                                        Actualizar
                                    </button>
                                    <button
                                        type="button"
                                        className="cancel"
                                        onClick={() => {
                                            setEditModalOpen(false);
                                            setMultaAEditar(null);
                                            setEditFormData({ estado: "" });
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                                {editError && <p className="error">{editError}</p>}
                                {editSuccess && <p className="success">{editSuccess}</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteModalOpen && (
                    <div id="deleteModalOverlay" className="modal-overlay">
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
                                    <span className="title">¿Eliminar esta multa?</span>
                                    <p className="message">
                                        Esta acción no se puede deshacer. La multa con ID {multaIdToDelete} se eliminará
                                        permanentemente.
                                    </p>
                                </div>
                            </div>
                            <div className="actions">
                                <button className="btn-success" type="button" onClick={handleDelete}>
                                    Sí, eliminar
                                </button>
                                <button
                                    className="cancel"
                                    type="button"
                                    onClick={() => {
                                        setDeleteModalOpen(false);
                                        setMultaIdToDelete(null);
                                    }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <Footer />
            </div>

            {/* Edit Modal (similar to Noticias) */}
            {editModalOpen && multaAEditar && (
                <div id="editModalOverlay" className="modal-overlay">
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
                                <span className="title">Actualizar estado de multa</span>
                                <p className="message">
                                    ¿Está seguro de que desea actualizar el estado de esta multa? Esta acción modificará
                                    el registro permanentemente.
                                </p>
                            </div>
                        </div>
                        <div className="actions">
                            <div className="form-row">
                                <div className="form-field">
                                    <label className="form-label">Nuevo estado</label>
                                    <select
                                        className="input"
                                        required
                                        value={editFormData.estado}
                                        onChange={e => setEditFormData({ ...editFormData, estado: e.target.value })}
                                    >
                                        <option value="">Seleccione un estado...</option>
                                        <option value="Pendiente">Pendiente</option>
                                        <option value="En proceso">En proceso</option>
                                        <option value="Resuelta">Resuelta</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-footer">
                                <button type="button" className="btn-success" onClick={handleUpdate}>
                                    Actualizar
                                </button>
                                <button
                                    type="button"
                                    className="cancel"
                                    onClick={() => {
                                        setEditModalOpen(false);
                                        setMultaAEditar(null);
                                        setEditFormData({ estado: "" });
                                    }}
                                >
                                    Cancelar
                                </button>
                            </div>
                            {editError && <p className="error">{editError}</p>}
                            {editSuccess && <p className="success">{editSuccess}</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div id="deleteModalOverlay" className="modal-overlay">
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
                                <span className="title">¿Eliminar esta multa?</span>
                                <p className="message">
                                    Esta acción no se puede deshacer. La multa con ID {multaIdToDelete} se eliminará
                                    permanentemente.
                                </p>
                            </div>
                        </div>
                        <div className="actions">
                            <button className="btn-success" type="button" onClick={handleDelete}>
                                Sí, eliminar
                            </button>
                            <button
                                className="cancel"
                                type="button"
                                onClick={() => {
                                    setDeleteModalOpen(false);
                                    setMultaIdToDelete(null);
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Multas;
