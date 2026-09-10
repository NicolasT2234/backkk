import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import NavbarApp from "../../components/NavbarApp.jsx";
import Footer from "../../components/Footer.jsx";
import {
  FileText,
  AlertTriangle,
  HelpCircle,
  MessageSquare,
  Building,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Eye,
  X,
  Send,
  Info,
  RotateCw,
  Edit3,
  Save,
  Lock
} from "lucide-react";
import "../../assets/css/styles.css";
import "../../assets/css/pqrs.css";

const TIPOS_PQR = [
  {
    id: "Petición",
    label: "Petición",
    icon: HelpCircle,
    desc: "Solicitud formal de información o trámites."
  },
  {
    id: "Queja",
    label: "Queja",
    icon: AlertTriangle,
    desc: "Inconformidad por un servicio o conducta."
  },
  {
    id: "Reclamo",
    label: "Reclamo",
    icon: AlertCircle,
    desc: "Exigencia por incumplimiento o cobro indebido."
  },
  {
    id: "Sugerencia",
    label: "Sugerencia",
    icon: MessageSquare,
    desc: "Propuesta para mejorar la convivencia y áreas comunes."
  }
];

function Pqrs() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout fallido:", err);
    } finally {
      navigate("/");
    }
  };

  // Estados del formulario de creación
  const [formData, setFormData] = useState({
    descripcion: "",
    tipo: "Petición"
  });

  // Apartamento asociado automático (desde /pqrs/mi-apartamento)
  const [miApartamento, setMiApartamento] = useState(null);
  const [loadingApto, setLoadingApto] = useState(true);

  // Estados de retroalimentación
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Estados del historial
  const [historial, setHistorial] = useState([]);
  const [historialLoading, setHistorialLoading] = useState(true);
  const [historialError, setHistorialError] = useState("");

  // Filtros y modales
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [pqrSeleccionada, setPqrSeleccionada] = useState(null);

  // Modal y formulario de edición
  const [pqrAEditar, setPqrAEditar] = useState(null);
  const [editForm, setEditForm] = useState({ tipo: "Petición", descripcion: "" });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // 1. Cargar el apartamento asignado al residente desde tu backend (/pqrs/mi-apartamento)
  useEffect(() => {
    const fetchMiApartamento = async () => {
      setLoadingApto(true);
      try {
        const res = await api.get("/pqrs/mi-apartamento");
        if (res.data && res.data.apartamento) {
          setMiApartamento(res.data.apartamento);
        }
      } catch (err) {
        console.warn("No se pudo cargar el apartamento asignado:", err);
      } finally {
        setLoadingApto(false);
      }
    };
    fetchMiApartamento();
  }, []);

  // 2. Cargar historial de PQRs del residente
  const fetchHistorial = async () => {
    setHistorialLoading(true);
    setHistorialError("");
    try {
      const res = await api.get("/pqrs/mis-pqrs");
      setHistorial(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error al obtener historial:", err);
      setHistorialError("No se pudo cargar el historial de PQRs.");
    } finally {
      setHistorialLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, [success]);

  // Clasificación de estados
  const getEstadoInfo = (estadoRaw) => {
    const estado = (estadoRaw || "pendiente").toLowerCase();
    if (estado.includes("resuelt") || estado.includes("cerrad")) {
      return {
        label: estadoRaw || "Resuelta",
        badgeClass: "badge-resuelta",
        icon: CheckCircle
      };
    }
    if (estado.includes("proceso") || estado.includes("revisi")) {
      return {
        label: estadoRaw || "En proceso",
        badgeClass: "badge-proceso",
        icon: Clock
      };
    }
    return {
      label: estadoRaw || "Pendiente",
      badgeClass: "badge-pendiente",
      icon: AlertCircle
    };
  };

  // Contadores
  const stats = useMemo(() => {
    const total = historial.length;
    let pendientes = 0;
    let enProceso = 0;
    let resueltas = 0;

    historial.forEach((item) => {
      const st = getEstadoInfo(item.estado).badgeClass;
      if (st === "badge-resuelta") resueltas++;
      else if (st === "badge-proceso") enProceso++;
      else pendientes++;
    });

    return { total, pendientes, enProceso, resueltas };
  }, [historial]);

  // Filtrado dinámico
  const historialFiltrado = useMemo(() => {
    return historial.filter((item) => {
      const cumpleEstado =
        filtroEstado === "Todos" ||
        getEstadoInfo(item.estado).badgeClass.includes(filtroEstado.toLowerCase());

      const query = busqueda.toLowerCase().trim();
      const cumpleBusqueda =
        !query ||
        item.id?.toString().includes(query) ||
        item.descripcion?.toLowerCase().includes(query) ||
        item.tipo?.toLowerCase().includes(query) ||
        item.numero?.toString().includes(query) ||
        item.bloque?.toLowerCase().includes(query);

      return cumpleEstado && cumpleBusqueda;
    });
  }, [historial, filtroEstado, busqueda]);

  // Abrir modal de edición
  const handleAbrirEditar = (pqr) => {
    setPqrAEditar(pqr);
    setEditForm({
      tipo: pqr.tipo || "Petición",
      descripcion: pqr.descripcion || ""
    });
  };

  // Guardar edición de PQR llamando a PUT /pqrs/:id
  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!editForm.descripcion.trim() || !editForm.tipo) {
      setError("Por favor completa todos los campos requeridos.");
      return;
    }

    setGuardandoEdicion(true);
    setError("");
    try {
      await api.put(`/pqrs/${pqrAEditar.id}`, {
        descripcion: editForm.descripcion.trim(),
        tipo: editForm.tipo
      });

      setSuccess(`¡PQR #${pqrAEditar.id} actualizada con éxito!`);
      setPqrAEditar(null);
      fetchHistorial();
    } catch (err) {
      console.error("Error al actualizar PQR:", err);
      const serverMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "No se pudo actualizar la PQR. Solo se pueden editar solicitudes en estado Pendiente.";
      setError(serverMsg);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // Envío del formulario de creación (asigna apartamento automáticamente en el backend)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!formData.descripcion.trim() || !formData.tipo) {
      setError("Por favor diligencia la descripción y el tipo de solicitud.");
      return;
    }

    setLoading(true);
    try {
      // idApartamento es opcional: el backend lo asigna automáticamente al usuario
      const payload = {
        descripcion: formData.descripcion.trim(),
        tipo: formData.tipo
      };
      if (miApartamento?.idApartamento) {
        payload.idApartamento = miApartamento.idApartamento;
      }

      const res = await api.post("/pqrs", payload);
      const nuevoId = res.data?.id;

      setSuccess(
        nuevoId
          ? `¡PQR radicada con éxito! Número de radicado: #${nuevoId}`
          : "¡PQR radicada exitosamente!"
      );

      setFormData({
        descripcion: "",
        tipo: "Petición"
      });
    } catch (err) {
      console.error("Error al crear PQR:", err);
      const serverMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Ocurrió un error al radicar la PQR.";
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavbarApp onLogout={handleLogout} />

      <div className="pqrs-page">
        <div className="pqrs-container">
          
          {/* Encabezado */}
          <header className="pqrs-header">
            <span className="pqrs-badge">Atención al Residente</span>
            <h1>Gestión de PQRS</h1>
            <p className="pqrs-subtitle">
              Radica peticiones, quejas, reclamos o sugerencias y haz seguimiento o actualización en tiempo real.
            </p>
          </header>

          {/* Tarjetas de métricas (KPIs) */}
          <section className="pqrs-stats-grid">
            <div className="pqrs-stat-card">
              <div className="stat-icon-wrapper total">
                <FileText size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-title">Total radicadas</span>
              </div>
            </div>

            <div className="pqrs-stat-card">
              <div className="stat-icon-wrapper pendiente">
                <AlertCircle size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.pendientes}</span>
                <span className="stat-title">Pendientes</span>
              </div>
            </div>

            <div className="pqrs-stat-card">
              <div className="stat-icon-wrapper proceso">
                <Clock size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.enProceso}</span>
                <span className="stat-title">En proceso</span>
              </div>
            </div>

            <div className="pqrs-stat-card">
              <div className="stat-icon-wrapper resuelta">
                <CheckCircle size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.resueltas}</span>
                <span className="stat-title">Resueltas</span>
              </div>
            </div>
          </section>

          {/* Formulario y Guía */}
          <div className="pqrs-main-grid">
            {/* Formulario */}
            <section className="pqrs-card form-container">
              <div className="card-header">
                <div className="header-title-group">
                  <FileText className="header-icon" size={20} />
                  <h2>Radicar nueva solicitud</h2>
                </div>
                <span className="step-indicator">Asignación automática</span>
              </div>

              {success && (
                <div className="alert-banner alert-success">
                  <CheckCircle size={18} />
                  <span>{success}</span>
                  <button
                    type="button"
                    className="alert-close"
                    onClick={() => setSuccess("")}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {error && (
                <div className="alert-banner alert-error">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                  <button
                    type="button"
                    className="alert-close"
                    onClick={() => setError("")}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="pqrs-form">
                
                {/* 1. Apartamento Asociado (Automático / No editable) */}
                <div className="form-group">
                  <label className="field-label">Apartamento Solicitante (Asignación Automática)</label>
                  <div className="input-with-icon-static">
                    <Building size={17} className="field-inner-icon" />
                    <input
                      type="text"
                      className="form-input locked with-icon destaque-apto"
                      value={
                        loadingApto
                          ? "Cargando apartamento asignado..."
                          : miApartamento
                          ? `Apto ${miApartamento.numeroApartamento} — Torre ${miApartamento.bloque} (Int. ${miApartamento.interior})`
                          : "Unidad Residencial Activa"
                      }
                      disabled
                    />
                  </div>
                  <span className="field-hint">
                    Asignado directamente a tu inmueble registrado en Casa Blanca.
                  </span>
                </div>

                {/* 2. Selector de Tipo */}
                <div className="form-group">
                  <label className="field-label">Tipo de Solicitud</label>
                  <div className="tipo-selector-grid">
                    {TIPOS_PQR.map((tipo) => {
                      const IconComponent = tipo.icon;
                      const isSelected = formData.tipo === tipo.id;
                      return (
                        <button
                          type="button"
                          key={tipo.id}
                          className={`tipo-option-btn ${isSelected ? "selected" : ""}`}
                          onClick={() => setFormData({ ...formData, tipo: tipo.id })}
                        >
                          <IconComponent size={18} className="tipo-icon" />
                          <span className="tipo-name">{tipo.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="field-hint">
                    {TIPOS_PQR.find((t) => t.id === formData.tipo)?.desc}
                  </p>
                </div>

                {/* 3. Descripción detallada */}
                <div className="form-group">
                  <div className="label-with-counter">
                    <label className="field-label" htmlFor="descripcion">
                      Descripción de los hechos o solicitud
                    </label>
                    <span
                      className={`char-counter ${
                        formData.descripcion.length > 450 ? "warning" : ""
                      }`}
                    >
                      {formData.descripcion.length}/500
                    </span>
                  </div>
                  <textarea
                    id="descripcion"
                    rows={4}
                    maxLength={500}
                    placeholder="Detalla con claridad los hechos, lugares específicos, fechas y cualquier contexto necesario..."
                    className="form-control textarea"
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-submit-pqr"
                    disabled={loading}
                  >
                    <Send size={16} />
                    <span>{loading ? "Radicando solicitud..." : "Enviar Solicitud"}</span>
                  </button>
                </div>
              </form>
            </section>

            {/* Guía de Tiempos y Actualizaciones */}
            <aside className="pqrs-info-column">
              <div className="pqrs-card info-card">
                <div className="card-header">
                  <div className="header-title-group">
                    <Info className="header-icon" size={20} />
                    <h3>Tiempos legales de respuesta</h3>
                  </div>
                </div>
                <ul className="response-time-list">
                  <li>
                    <span className="time-badge">15 días</span>
                    <div>
                      <strong>Peticiones de interés general</strong>
                      <p>Consultas y trámites ante la administración.</p>
                    </div>
                  </li>
                  <li>
                    <span className="time-badge">15 días</span>
                    <div>
                      <strong>Quejas y Reclamos</strong>
                      <p>Inconformidades de convivencia o servicios comunes.</p>
                    </div>
                  </li>
                  <li>
                    <span className="time-badge">10 días</span>
                    <div>
                      <strong>Sugerencias</strong>
                      <p>Ideas de mejora para zonas verdes y copropiedad.</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="pqrs-card steps-card">
                <div className="card-header">
                  <h3>Edición de Solicitudes</h3>
                </div>
                <div className="process-steps">
                  <div className="step-item">
                    <div className="step-number">
                      <Edit3 size={14} />
                    </div>
                    <div className="step-text">
                      <strong>Modificación en estado Pendiente</strong>
                      <p>Puedes editar la descripción o el tipo de tu solicitud mientras la administración no la haya tomado en revisión.</p>
                    </div>
                  </div>
                  <div className="step-item">
                    <div className="step-number">
                      <Lock size={14} />
                    </div>
                    <div className="step-text">
                      <strong>Bloqueo formal</strong>
                      <p>Al pasar a estado "En proceso" o "Resuelta", la PQR se bloquea para conservar la validez legal del radicado.</p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* Historial de Solicitudes */}
          <section className="pqrs-card table-card">
            <div className="table-toolbar">
              <div>
                <h2>Historial de Solicitudes</h2>
                <p className="table-subtitle">
                  Consulta, haz seguimiento o actualiza las PQRs radicadas por tu unidad.
                </p>
              </div>

              <div className="toolbar-actions">
                <div className="search-box">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar por ID, tipo o texto..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="search-input"
                  />
                  {busqueda && (
                    <button
                      className="clear-search"
                      onClick={() => setBusqueda("")}
                      type="button"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="btn-refresh"
                  onClick={fetchHistorial}
                  title="Actualizar tabla"
                >
                  <RotateCw size={16} className={historialLoading ? "spinning" : ""} />
                </button>
              </div>
            </div>

            {/* Pestañas de filtro */}
            <div className="filter-tabs">
              {["Todos", "Pendiente", "Proceso", "Resuelta"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`filter-tab ${filtroEstado === tab ? "active" : ""}`}
                  onClick={() => setFiltroEstado(tab)}
                >
                  {tab === "Proceso" ? "En proceso" : tab}
                </button>
              ))}
            </div>

            {/* Tabla */}
            {historialLoading ? (
              <div className="empty-state">
                <RotateCw className="spinning" size={32} />
                <p>Cargando historial de solicitudes...</p>
              </div>
            ) : historialError ? (
              <div className="empty-state error">
                <AlertCircle size={32} />
                <p>{historialError}</p>
              </div>
            ) : historialFiltrado.length === 0 ? (
              <div className="empty-state">
                <FileText size={40} className="empty-icon" />
                <h4>No se encontraron PQRs</h4>
                <p>
                  {busqueda || filtroEstado !== "Todos"
                    ? "No hay resultados que coincidan con los filtros aplicados."
                    : "Aún no tienes solicitudes registradas en la copropiedad."}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="pqrs-table">
                  <thead>
                    <tr>
                      <th>Radicado</th>
                      <th>Tipo</th>
                      <th>Ubicación</th>
                      <th>Descripción</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th style={{ textAlign: "right" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialFiltrado.map((pqr) => {
                      const estadoInfo = getEstadoInfo(pqr.estado);
                      const EstadoIcon = estadoInfo.icon;
                      const esPendiente = (pqr.estado || "").toLowerCase().includes("pendiente");

                      return (
                        <tr key={pqr.id}>
                          <td className="cell-id">
                            <span className="id-badge">#{pqr.id}</span>
                          </td>
                          <td>
                            <span className={`tipo-pill ${pqr.tipo?.toLowerCase()}`}>
                              {pqr.tipo}
                            </span>
                          </td>
                          <td>
                            <span className="location-text">
                              Apto {pqr.numero || "S/N"}
                              <small>
                                {pqr.bloque ? ` · ${pqr.bloque}` : ""}
                                {pqr.interior ? ` (Int ${pqr.interior})` : ""}
                              </small>
                            </span>
                          </td>
                          <td className="cell-desc">
                            <p className="desc-truncated">{pqr.descripcion}</p>
                          </td>
                          <td className="cell-date">
                            {pqr.fecha_creacion
                              ? new Date(pqr.fecha_creacion).toLocaleDateString("es-CO", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric"
                                })
                              : "-"}
                          </td>
                          <td>
                            <span className={`status-pill ${estadoInfo.badgeClass}`}>
                              <EstadoIcon size={13} />
                              {estadoInfo.label}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div className="table-actions-group">
                              <button
                                type="button"
                                className="btn-view-detail"
                                onClick={() => setPqrSeleccionada(pqr)}
                                title="Ver detalles completos"
                              >
                                <Eye size={14} />
                                <span>Detalle</span>
                              </button>

                              {esPendiente ? (
                                <button
                                  type="button"
                                  className="btn-action-edit"
                                  onClick={() => handleAbrirEditar(pqr)}
                                  title="Actualizar mi solicitud"
                                >
                                  <Edit3 size={14} />
                                  <span>Editar</span>
                                </button>
                              ) : (
                                <span
                                  className="badge-locked-pqr"
                                  title="No editable: la PQR ya se encuentra en trámite o resuelta"
                                >
                                  Bloqueada
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>

        {/* Modal de Detalle */}
        {pqrSeleccionada && (
          <div
            className="modal-overlay"
            onClick={() => setPqrSeleccionada(null)}
          >
            <div
              className="modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <span className="modal-tag">Radicado #{pqrSeleccionada.id}</span>
                  <h3>Detalle de la Solicitud</h3>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setPqrSeleccionada(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Tipo</span>
                    <span className="detail-value">{pqrSeleccionada.tipo}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Estado</span>
                    <span
                      className={`status-pill ${
                        getEstadoInfo(pqrSeleccionada.estado).badgeClass
                      }`}
                    >
                      {getEstadoInfo(pqrSeleccionada.estado).label}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ubicación</span>
                    <span className="detail-value">
                      Apto {pqrSeleccionada.numero || "N/A"}{" "}
                      {pqrSeleccionada.bloque ? `(${pqrSeleccionada.bloque})` : ""}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Fecha de Radicación</span>
                    <span className="detail-value">
                      {pqrSeleccionada.fecha_creacion
                        ? new Date(
                            pqrSeleccionada.fecha_creacion
                          ).toLocaleString("es-CO")
                        : "No registrada"}
                    </span>
                  </div>
                </div>

                <div className="detail-description-box">
                  <label>Descripción completa:</label>
                  <p>{pqrSeleccionada.descripcion}</p>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-modal-close"
                  onClick={() => setPqrSeleccionada(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edición de PQR */}
        {pqrAEditar && (
          <div
            className="modal-overlay"
            onClick={() => !guardandoEdicion && setPqrAEditar(null)}
          >
            <div
              className="modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="header-title-group">
                  <Edit3 size={18} className="header-icon" />
                  <h3>Actualizar Solicitud #{pqrAEditar.id}</h3>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => !guardandoEdicion && setPqrAEditar(null)}
                  disabled={guardandoEdicion}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleGuardarEdicion}>
                <div className="modal-body">
                  
                  {/* Selector de Tipo */}
                  <div className="form-group" style={{ marginBottom: "1.2rem" }}>
                    <label className="field-label">Tipo de Solicitud</label>
                    <select
                      className="form-control"
                      value={editForm.tipo}
                      onChange={(e) =>
                        setEditForm({ ...editForm, tipo: e.target.value })
                      }
                      required
                    >
                      <option value="Petición">Petición</option>
                      <option value="Queja">Queja</option>
                      <option value="Reclamo">Reclamo</option>
                      <option value="Sugerencia">Sugerencia</option>
                    </select>
                  </div>

                  {/* Campo de Descripción */}
                  <div className="form-group">
                    <div className="label-with-counter">
                      <label className="field-label">Descripción</label>
                      <span className="char-counter">
                        {editForm.descripcion.length}/500
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      maxLength={500}
                      className="form-control textarea"
                      value={editForm.descripcion}
                      onChange={(e) =>
                        setEditForm({ ...editForm, descripcion: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="modal-info-note">
                    <Info size={15} />
                    <span>Solo puedes editar tu PQR mientras permanezca en estado Pendiente.</span>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-modal-back"
                    onClick={() => setPqrAEditar(null)}
                    disabled={guardandoEdicion}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-modal-save"
                    disabled={guardandoEdicion}
                  >
                    <Save size={15} />
                    <span>{guardandoEdicion ? "Guardando..." : "Guardar Cambios"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer Full-Width */}
        <Footer />
      </div>
    </>
  );
}

export default Pqrs;