import { AlertTriangle, Building, CheckCircle2, Edit3, X } from "lucide-react";
import { useEffect, useState } from "react";
import "../../assets/css/gestion-usuarios.css";
import BotonReporte from "../../components/BotonReporte.jsx";
import Footer from "../../components/Footer.jsx";
import NavbarApp from "../../components/NavbarApp.jsx";
import api from "../../services/api.js";

export default function GestionUsuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [apartamentos, setApartamentos] = useState([]);
    const [tiposDoc, setTiposDoc] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(false);

    // Modal de Creación / Edición
    const [mostrarModal, setMostrarModal] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [usuarioEditandoId, setUsuarioEditandoId] = useState(null);

    const [credencialGenerada, setCredencialGenerada] = useState(null);
    const [mensajeError, setMensajeError] = useState("");

    // Modal de Aviso de Reactivación (Reemplazo elegante de alert)
    const [avisoReactivacion, setAvisoReactivacion] = useState(null);

    // Sistema de notificaciones Toast (flotante)
    const [toast, setToast] = useState(null);

    const mostrarToast = (mensaje, tipo = "exito") => {
        setToast({ mensaje, tipo });
        setTimeout(() => {
            setToast(null);
        }, 4000);
    };

    const [formData, setFormData] = useState({
        primerNombre: "",
        segundoNombre: "",
        primerApellido: "",
        segundoApellido: "",
        idTipoDocumento: "",
        numeroDocumento: "",
        email: "",
        idApartamentos: [], // Soporte para múltiples apartamentos asignados
    });

    // Filtro en tiempo real: Solo letras y espacios para nombres y apellidos
    const handleNameChange = (campo, valor) => {
        const soloLetras = valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "");
        setFormData(prev => ({ ...prev, [campo]: soloLetras }));
    };

    // Filtro en tiempo real: Solo números para documento
    const handleDocumentChange = valor => {
        const soloNumeros = valor.replace(/\D/g, "");
        setFormData(prev => ({ ...prev, numeroDocumento: soloNumeros }));
    };

    // 1. Cargar usuarios agrupando apartamentos (sin filas repetidas)
    const cargarUsuarios = async () => {
        setCargando(true);
        try {
            const res = await api.get("/admin/usuarios", {
                params: { search: busqueda },
            });
            setUsuarios(res.data.usuarios || []);
        } catch (err) {
            console.error("Error al cargar usuarios:", err);
        } finally {
            setCargando(false);
        }
    };

    // 2. Cargar catálogos: Solo apartamentos libres o de residentes INACTIVOS
    const cargarCatalogos = async (idUsuario = null) => {
        try {
            const params = idUsuario ? { idUsuario } : {};
            const res = await api.get("/admin/usuarios/catalogos", { params });
            setApartamentos(res.data.apartamentos || []);
            setTiposDoc(res.data.tiposDocumento || []);
            if (!idUsuario && res.data.tiposDocumento && res.data.tiposDocumento.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    idTipoDocumento: res.data.tiposDocumento[0].id,
                }));
            }
        } catch (err) {
            console.error("Error al cargar catálogos:", err);
        }
    };

    // Debounce para búsqueda
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            cargarUsuarios();
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [busqueda]);

    useEffect(() => {
        cargarCatalogos();
    }, []);

    // 3. Activar o desactivar residente (con blindaje y modal elegante)
    const handleToggleEstado = async u => {
        const nuevoEstado = u.estado_usuario === "Activo" ? "Inactivo" : "Activo";
        try {
            const res = await api.patch(`/admin/usuarios/${u.id_usuario}/estado`, {
                nuevoEstado,
            });

            if (res.status === 200) {
                cargarUsuarios();
                cargarCatalogos();

                // Si hay advertencia de apartamento reasignado, mostrar el modal estilizado
                if (res.data.advertencia) {
                    setAvisoReactivacion({
                        usuario: u,
                        mensaje: res.data.advertencia,
                        apartamentosOcupados: res.data.apartamentosOcupados || [],
                    });
                } else {
                    mostrarToast(`Estado actualizado: el usuario ahora está ${nuevoEstado}.`, "exito");
                }
            }
        } catch (err) {
            console.error("Error al actualizar estado:", err);
            mostrarToast(err.response?.data?.error || "Error al cambiar el estado del usuario.", "error");
        }
    };

    // 4. Abrir modal para Crear Residente
    const handleAbrirCrear = async () => {
        setModoEdicion(false);
        setUsuarioEditandoId(null);
        setCredencialGenerada(null);
        setMensajeError("");
        await cargarCatalogos();
        setFormData({
            primerNombre: "",
            segundoNombre: "",
            primerApellido: "",
            segundoApellido: "",
            idTipoDocumento: tiposDoc[0]?.id || "",
            numeroDocumento: "",
            email: "",
            idApartamentos: [],
        });
        setMostrarModal(true);
    };

    // 5. Abrir modal para Editar Residente existente
    const handleAbrirEditar = async u => {
        setModoEdicion(true);
        setUsuarioEditandoId(u.id_usuario);
        setCredencialGenerada(null);
        setMensajeError("");

        await cargarCatalogos(u.id_usuario);

        const aptoIds = (u.apartamentos || []).map(ap => ap.id);

        setFormData({
            primerNombre: u.primer_nombre || "",
            segundoNombre: u.segundo_nombre || "",
            primerApellido: u.primer_apellido || "",
            segundoApellido: u.segundo_apellido || "",
            idTipoDocumento: u.id_tipo_documento || tiposDoc[0]?.id || "",
            numeroDocumento: u.numero_documento || "",
            email: u.email || "",
            idApartamentos: aptoIds,
        });
        setMostrarModal(true);
    };

    // Manejar adición de un apartamento a la lista seleccionada
    const handleAddApartamento = idApto => {
        if (!idApto) return;
        const numId = parseInt(idApto, 10);
        if (!formData.idApartamentos.includes(numId)) {
            setFormData(prev => ({
                ...prev,
                idApartamentos: [...prev.idApartamentos, numId],
            }));
        }
    };

    // Remover un apartamento de la lista seleccionada
    const handleRemoveApartamento = idApto => {
        setFormData(prev => ({
            ...prev,
            idApartamentos: prev.idApartamentos.filter(id => id !== idApto),
        }));
    };

    // 6. Enviar formulario (Creación o Edición)
    const handleSubmit = async e => {
        e.preventDefault();
        setMensajeError("");

        const regexSoloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

        if (!formData.primerNombre.trim() || !regexSoloLetras.test(formData.primerNombre.trim())) {
            setMensajeError(
                "El primer nombre es obligatorio y solo debe contener letras (sin números ni caracteres especiales).",
            );
            return;
        }

        if (
            formData.segundoNombre &&
            formData.segundoNombre.trim() !== "" &&
            !regexSoloLetras.test(formData.segundoNombre.trim())
        ) {
            setMensajeError("El segundo nombre solo debe contener letras (sin números ni caracteres especiales).");
            return;
        }

        if (!formData.primerApellido.trim() || !regexSoloLetras.test(formData.primerApellido.trim())) {
            setMensajeError(
                "El primer apellido es obligatorio y solo debe contener letras (sin números ni caracteres especiales).",
            );
            return;
        }

        if (
            formData.segundoApellido &&
            formData.segundoApellido.trim() !== "" &&
            !regexSoloLetras.test(formData.segundoApellido.trim())
        ) {
            setMensajeError("El segundo apellido solo debe contener letras (sin números ni caracteres especiales).");
            return;
        }

        if (!formData.numeroDocumento.toString().trim() || !/^\d+$/.test(formData.numeroDocumento.toString().trim())) {
            setMensajeError("El número de documento es obligatorio y solo debe contener números.");
            return;
        }

        if (formData.idApartamentos.length === 0) {
            setMensajeError("Debes asignar al menos un apartamento al residente.");
            return;
        }

        try {
            if (modoEdicion) {
                await api.put(`/admin/usuarios/${usuarioEditandoId}`, formData);
                setMostrarModal(false);
                mostrarToast("Residente y apartamentos actualizados con éxito.", "exito");
                cargarUsuarios();
                cargarCatalogos();
            } else {
                const res = await api.post("/admin/usuarios", formData);
                setCredencialGenerada(res.data.credenciales);
                mostrarToast("Residente registrado exitosamente.", "exito");
                cargarUsuarios();
                cargarCatalogos();
            }
        } catch (err) {
            console.error("Error al guardar residente:", err);
            setMensajeError(err.response?.data?.error || "Ocurrió un error al procesar la solicitud.");
        }
    };

    return (
        <div className="gestion-usuarios-page">
            <NavbarApp />

            {/* NOTIFICACIÓN TOAST FLOTANTE */}
            {toast && (
                <div
                    style={{
                        position: "fixed",
                        top: "24px",
                        right: "24px",
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 20px",
                        borderRadius: "12px",
                        backgroundColor: toast.tipo === "error" ? "#fef2f2" : "#f0fdf4",
                        border: `1.5px solid ${toast.tipo === "error" ? "#f87171" : "#86efac"}`,
                        color: toast.tipo === "error" ? "#991b1b" : "#166534",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                        animation: "fadeIn 0.3s ease-in-out",
                        fontSize: "0.92rem",
                        fontWeight: 600,
                    }}
                >
                    {toast.tipo === "error" ? (
                        <AlertTriangle size={20} color="#dc2626" />
                    ) : (
                        <CheckCircle2 size={20} color="#16a34a" />
                    )}
                    <span>{toast.mensaje}</span>
                    <button
                        onClick={() => setToast(null)}
                        style={{
                            background: "none",
                            border: "none",
                            color: "inherit",
                            cursor: "pointer",
                            padding: "0 0 0 8px",
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <main className="usuarios-main-container">
                {/* Banner Superior Hero */}
                <div className="usuarios-hero">
                    <div className="hero-text">
                        <h1>Gestión de Propietarios y Residentes</h1>
                        <p>
                            Registro formal, asignación de múltiples apartamentos y administración de estados en Casa
                            Blanca.
                        </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <BotonReporte
                            endpoint="/reportes/admin/censo-apartamentos-pdf"
                            nombreArchivo="Censo_Inmuebles_Directorio_Casa_Blanca.pdf"
                            texto="Descargar Censo de Inmuebles (PDF)"
                            className="btn btn-secondary d-inline-flex align-items-center gap-2 shadow-sm fw-bold px-3 py-2 text-white"
                        />
                        <div className="hero-badge">
                            <span>Total Residentes: {usuarios.length}</span>
                        </div>
                    </div>
                </div>

                {/* Barra de Búsqueda y Botón de Registro */}
                <div className="usuarios-toolbar">
                    <div className="usuarios-search-box">
                        <svg
                            className="search-icon"
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="text"
                            placeholder="Buscar por cédula, nombre o correo..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                        />
                    </div>

                    <button className="btn-nuevo-usuario" onClick={handleAbrirCrear}>
                        + Registrar Residente
                    </button>
                </div>

                {/* Tabla de Residentes */}
                <div className="usuarios-table-card">
                    <table className="usuarios-table">
                        <thead>
                            <tr>
                                <th>Documento</th>
                                <th>Nombre Completo</th>
                                <th>Correo Electrónico</th>
                                <th>Apartamento(s) Asignado(s)</th>
                                <th>Rol</th>
                                <th>Estado</th>
                                <th style={{ textAlign: "right" }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cargando ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-4">
                                        Buscando usuarios...
                                    </td>
                                </tr>
                            ) : usuarios.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-4">
                                        No se encontraron registros que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            ) : (
                                usuarios.map(u => (
                                    <tr key={u.id_usuario}>
                                        <td>
                                            <strong>{u.tipo_documento}</strong> {u.numero_documento}
                                        </td>
                                        <td>
                                            {u.primer_nombre} {u.segundo_nombre} {u.primer_apellido}{" "}
                                            {u.segundo_apellido}
                                        </td>
                                        <td>{u.email}</td>
                                        <td>
                                            {/* Lista de apartamentos asignados sin duplicar fila */}
                                            {u.apartamentos && u.apartamentos.length > 0 ? (
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                                                    {u.apartamentos.map(apto => (
                                                        <span key={apto.id} className="apto-badge">
                                                            {apto.bloque} • Int {apto.interior} • Apto {apto.numero}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : u.numero_apartamento ? (
                                                <span className="apto-badge">
                                                    {u.nombre_bloque} • Int {u.numero_interior} • Apto{" "}
                                                    {u.numero_apartamento}
                                                </span>
                                            ) : (
                                                <span className="sin-apto">Sin asignar</span>
                                            )}
                                        </td>
                                        <td>{u.rol || "Propietario"}</td>
                                        <td>
                                            <span
                                                className={`estado-pill ${
                                                    u.estado_usuario === "Activo" ? "activo" : "inactivo"
                                                }`}
                                            >
                                                {u.estado_usuario}
                                            </span>
                                        </td>
                                        <td>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "8px",
                                                    justifyContent: "flex-end",
                                                    alignItems: "center",
                                                }}
                                            >
                                                {/* Botón Editar residente y sus apartamentos */}
                                                <button
                                                    type="button"
                                                    className="btn-editar-usuario"
                                                    onClick={() => handleAbrirEditar(u)}
                                                    style={{
                                                        padding: "0.4rem 0.8rem",
                                                        borderRadius: "8px",
                                                        border: "1.5px solid #d4b8a2",
                                                        backgroundColor: "#ffffff",
                                                        color: "#8c3200",
                                                        fontSize: "0.82rem",
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "4px",
                                                    }}
                                                >
                                                    <Edit3 size={13} />
                                                    <span>Editar</span>
                                                </button>

                                                {/* Botón Activar / Desactivar */}
                                                <button
                                                    className={`btn-estado ${
                                                        u.estado_usuario === "Activo" ? "btn-desactivar" : "btn-activar"
                                                    }`}
                                                    onClick={() => handleToggleEstado(u)}
                                                >
                                                    {u.estado_usuario === "Activo" ? "Desactivar" : "Activar"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* MODAL ELEGANTE: AVISO DE APARTAMENTOS REASIGNADOS AL REACTIVAR */}
            {avisoReactivacion && (
                <div className="modal-overlay" style={{ zIndex: 1200 }}>
                    <div
                        className="modal-content"
                        style={{
                            maxWidth: "530px",
                            borderRadius: "16px",
                            padding: "1.75rem",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
                            border: "1.5px solid #fed7aa",
                            backgroundColor: "#ffffff",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "1rem" }}>
                            <div
                                style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "12px",
                                    backgroundColor: "#fff7ed",
                                    border: "1.5px solid #fed7aa",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#ea580c",
                                    flexShrink: 0,
                                }}
                            >
                                <AlertTriangle size={26} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3
                                    style={{
                                        fontSize: "1.25rem",
                                        color: "#431407",
                                        margin: "0 0 4px 0",
                                        fontWeight: 700,
                                    }}
                                >
                                    Apartamento ya Reasignado
                                </h3>
                                <p style={{ margin: 0, fontSize: "0.88rem", color: "#78350f" }}>
                                    El residente fue reactivado, pero uno de sus apartamentos anteriores ya tiene otro
                                    dueño activo.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAvisoReactivacion(null)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: "1.25rem",
                                    color: "#9a3412",
                                    cursor: "pointer",
                                    padding: "0",
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div
                            style={{
                                backgroundColor: "#fffaf5",
                                border: "1.5px solid #fed7aa",
                                borderRadius: "12px",
                                padding: "1.1rem",
                                marginBottom: "1.5rem",
                            }}
                        >
                            <p
                                style={{
                                    margin: "0 0 0.85rem 0",
                                    fontSize: "0.88rem",
                                    color: "#7c2d12",
                                    lineHeight: 1.5,
                                }}
                            >
                                Durante el tiempo en que este usuario permaneció inactivo, la siguiente unidad fue
                                reasignada legítimamente a otro residente activo:
                            </p>

                            {avisoReactivacion.apartamentosOcupados &&
                            avisoReactivacion.apartamentosOcupados.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {avisoReactivacion.apartamentosOcupados.map((item, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                backgroundColor: "#ffffff",
                                                border: "1px solid #fdba74",
                                                borderRadius: "8px",
                                                padding: "0.65rem 0.9rem",
                                                boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <Building size={16} color="#ea580c" />
                                                <strong style={{ color: "#9a3412", fontSize: "0.9rem" }}>
                                                    {item.bloque} • Int {item.interior} • Apto {item.numero_apto}
                                                </strong>
                                            </div>
                                            <span style={{ fontSize: "0.82rem", color: "#475569" }}>
                                                Ocupante actual:{" "}
                                                <strong style={{ color: "#0f172a" }}>{item.ocupante_actual}</strong>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ fontSize: "0.85rem", color: "#9a3412", margin: 0 }}>
                                    {avisoReactivacion.mensaje}
                                </p>
                            )}

                            <p
                                style={{
                                    margin: "0.85rem 0 0 0",
                                    fontSize: "0.8rem",
                                    color: "#9a3412",
                                    fontStyle: "italic",
                                }}
                            >
                                💡 Para no crear conflictos, el apartamento se mantuvo con el residente actual. Puedes
                                asignarle un nuevo apartamento disponible usando el botón inferior.
                            </p>
                        </div>

                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                            <button
                                type="button"
                                onClick={() => setAvisoReactivacion(null)}
                                style={{
                                    padding: "0.6rem 1.1rem",
                                    borderRadius: "8px",
                                    border: "1.5px solid #d1d5db",
                                    backgroundColor: "#ffffff",
                                    color: "#374151",
                                    fontSize: "0.88rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                }}
                            >
                                Entendido
                            </button>
                            {avisoReactivacion.usuario && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const u = avisoReactivacion.usuario;
                                        setAvisoReactivacion(null);
                                        handleAbrirEditar(u);
                                    }}
                                    style={{
                                        padding: "0.6rem 1.15rem",
                                        borderRadius: "8px",
                                        border: "none",
                                        backgroundColor: "#ea580c",
                                        color: "#ffffff",
                                        fontSize: "0.88rem",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        boxShadow: "0 4px 10px rgba(234, 88, 12, 0.3)",
                                    }}
                                >
                                    <Edit3 size={15} />
                                    <span>Asignar otro apartamento</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Registro y Edición de Residente */}
            {mostrarModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "620px" }}>
                        <div className="modal-header">
                            <h2>
                                {credencialGenerada
                                    ? "Credenciales Generadas"
                                    : modoEdicion
                                      ? "Editar Propietario y Apartamentos"
                                      : "Registrar Nuevo Residente"}
                            </h2>
                            <button className="btn-close" onClick={() => setMostrarModal(false)}>
                                ✕
                            </button>
                        </div>

                        {credencialGenerada ? (
                            <div className="credenciales-box">
                                <p className="cred-instruction">
                                    El usuario y sus apartamentos fueron registrados con éxito. Entregue las siguientes
                                    credenciales al residente para su primer inicio de sesión:
                                </p>
                                <div className="cred-data">
                                    <p>
                                        <strong>Correo Electrónico:</strong> <span>{credencialGenerada.email}</span>
                                    </p>
                                    <p>
                                        <strong>Contraseña Temporal:</strong>{" "}
                                        <code className="password-code">
                                            {credencialGenerada.contrasenaProvisional}
                                        </code>
                                    </p>
                                </div>
                                <button className="btn-confirmar" onClick={() => setMostrarModal(false)}>
                                    Entendido y Finalizar
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="modal-form">
                                {mensajeError && <div className="form-error-banner">{mensajeError}</div>}

                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Tipo de Documento *</label>
                                        <select
                                            value={formData.idTipoDocumento}
                                            onChange={e =>
                                                setFormData({
                                                    ...formData,
                                                    idTipoDocumento: e.target.value,
                                                })
                                            }
                                            required
                                        >
                                            {tiposDoc.map(td => (
                                                <option key={td.id} value={td.id}>
                                                    {td.sigla} - {td.nombre_documento}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Número de Documento (Cédula) *</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]+"
                                            title="Solo se permiten números"
                                            required
                                            placeholder="Ej. 1012345678"
                                            value={formData.numeroDocumento}
                                            onChange={e => handleDocumentChange(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Primer Nombre *</label>
                                        <input
                                            type="text"
                                            pattern="[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+"
                                            title="Solo se permiten letras y espacios"
                                            required
                                            placeholder="Ej. Carlos (solo letras)"
                                            value={formData.primerNombre}
                                            onChange={e => handleNameChange("primerNombre", e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Segundo Nombre</label>
                                        <input
                                            type="text"
                                            pattern="[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+"
                                            title="Solo se permiten letras y espacios"
                                            placeholder="Opcional (solo letras)"
                                            value={formData.segundoNombre}
                                            onChange={e => handleNameChange("segundoNombre", e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Primer Apellido *</label>
                                        <input
                                            type="text"
                                            pattern="[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+"
                                            title="Solo se permiten letras y espacios"
                                            required
                                            placeholder="Ej. Gómez (solo letras)"
                                            value={formData.primerApellido}
                                            onChange={e => handleNameChange("primerApellido", e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Segundo Apellido</label>
                                        <input
                                            type="text"
                                            pattern="[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+"
                                            title="Solo se permiten letras y espacios"
                                            placeholder="Opcional (solo letras)"
                                            value={formData.segundoApellido}
                                            onChange={e => handleNameChange("segundoApellido", e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label>Correo Electrónico *</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="residente@ejemplo.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                {/* SELECTOR MÚLTIPLE DE APARTAMENTOS CON REGLA DE DISPONIBILIDAD */}
                                <div
                                    className="form-group full-width"
                                    style={{
                                        background: "#fcf8f5",
                                        padding: "1rem",
                                        borderRadius: "10px",
                                        border: "1.5px solid #ebdcd0",
                                    }}
                                >
                                    <label
                                        style={{
                                            color: "#8c3200",
                                            fontWeight: 700,
                                            fontSize: "0.88rem",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                        }}
                                    >
                                        <Building size={16} />
                                        Asignar Apartamentos Disponibles (o de residentes inactivos) *
                                    </label>

                                    <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                                        <select
                                            id="select-agregar-apto"
                                            defaultValue=""
                                            onChange={e => {
                                                if (e.target.value) {
                                                    handleAddApartamento(e.target.value);
                                                    e.target.value = "";
                                                }
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: "0.6rem",
                                                borderRadius: "8px",
                                                border: "1px solid #ccc",
                                            }}
                                        >
                                            <option value="">
                                                + Seleccionar apartamento disponible para agregar...
                                            </option>
                                            {apartamentos
                                                .filter(apto => !formData.idApartamentos.includes(apto.id))
                                                .map(apto => (
                                                    <option key={apto.id} value={apto.id}>
                                                        {apto.bloque} — Interior {apto.interior} — Apto{" "}
                                                        {apto.numero_apto}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    {/* Lista de apartamentos actualmente vinculados */}
                                    <div style={{ marginTop: "0.75rem" }}>
                                        <span style={{ fontSize: "0.76rem", color: "#735340", fontWeight: 600 }}>
                                            Apartamentos seleccionados ({formData.idApartamentos.length}):
                                        </span>

                                        {formData.idApartamentos.length === 0 ? (
                                            <p
                                                style={{
                                                    color: "#c2410c",
                                                    fontSize: "0.8rem",
                                                    margin: "4px 0 0 0",
                                                    fontStyle: "italic",
                                                }}
                                            >
                                                ⚠ No hay apartamentos seleccionados. Elige al menos uno en el selector
                                                superior.
                                            </p>
                                        ) : (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    gap: "6px",
                                                    marginTop: "6px",
                                                }}
                                            >
                                                {formData.idApartamentos.map(aptoId => {
                                                    const aptoObj = apartamentos.find(a => a.id === aptoId);
                                                    return (
                                                        <span
                                                            key={aptoId}
                                                            className="apto-badge"
                                                            style={{
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: "6px",
                                                                padding: "4px 10px",
                                                                background: "#fff",
                                                                border: "1px solid #d4b8a2",
                                                                borderRadius: "8px",
                                                            }}
                                                        >
                                                            <span>
                                                                {aptoObj
                                                                    ? `${aptoObj.bloque} • Int ${aptoObj.interior} • Apto ${aptoObj.numero_apto}`
                                                                    : `Apto #${aptoId}`}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                title="Quitar apartamento"
                                                                onClick={() => handleRemoveApartamento(aptoId)}
                                                                style={{
                                                                    background: "none",
                                                                    border: "none",
                                                                    color: "#991b1b",
                                                                    fontWeight: 800,
                                                                    cursor: "pointer",
                                                                    padding: 0,
                                                                    marginLeft: "3px",
                                                                }}
                                                            >
                                                                ✕
                                                            </button>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="btn-cancelar"
                                        onClick={() => setMostrarModal(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-guardar">
                                        {modoEdicion ? "Guardar Cambios" : "Guardar y Asignar"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Pie de página inferior */}
            <Footer style={{ marginTop: "auto" }} />
        </div>
    );
}
