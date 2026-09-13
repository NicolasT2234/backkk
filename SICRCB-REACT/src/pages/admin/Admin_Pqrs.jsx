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
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Eye,
  X,
  RotateCw,
  Edit3,
  Trash2,
  Building,
  User,
  Calendar,
  Filter,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ArrowUpDown,
  Download,
  CheckCircle
} from "lucide-react";
import "../../assets/css/styles.css";
import "../../assets/css/admin_pqrs.css";

const TIPOS_PQR = [
  { id: "Todos", label: "Todos los tipos" },
  { id: "Petición", label: "Peticiones", icon: HelpCircle, className: "tipo-peticion" },
  { id: "Queja", label: "Quejas", icon: AlertTriangle, className: "tipo-queja" },
  { id: "Reclamo", label: "Reclamos", icon: AlertCircle, className: "tipo-reclamo" },
  { id: "Sugerencia", label: "Sugerencias", icon: MessageSquare, className: "tipo-sugerencia" },
];

const ESTADOS_DISPONIBLES = [
  {
    value: "Pendiente",
    label: "Pendiente",
    badgeClass: "badge-pendiente",
    desc: "En espera de revisión y asignación administrativa.",
  },
  {
    value: "En proceso",
    label: "En proceso",
    badgeClass: "badge-proceso",
    desc: "En trámite, revisión técnica o comunicación con partes.",
  },
  {
    value: "Resuelta",
    label: "Resuelta",
    badgeClass: "badge-resuelta",
    desc: "Atendida, respuesta brindada y caso cerrado.",
  },
  {
    value: "Rechazada",
    label: "Rechazada",
    badgeClass: "badge-rechazada",
    desc: "No procedente según manual de convivencia o normatividad.",
  },
];

function PqrsAdmin() {
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

  const pqrsEjemplo = [
    {
      id: 101,
      tipo: "Reclamo",
      descripcion:
        "La luminaria del parqueadero principal torre 1 permanece apagada desde el viernes, dificultando el parqueo nocturno.",
      fecha_creacion: "2026-09-08T09:30:00",
      estado: "Pendiente",
      nombre_usuario: "Carlos",
      apellido_usuario: "Gómez",
      bloque: "Torre 1",
      interior: "1",
      numero: "302",
    },
    {
      id: 102,
      tipo: "Queja",
      descripcion:
        "Se reporta ruido excesivo y música con alto volumen en horario nocturno el domingo por parte del apartamento 405.",
      fecha_creacion: "2026-09-05T20:15:00",
      estado: "En proceso",
      nombre_usuario: "Laura",
      apellido_usuario: "Martínez",
      bloque: "Torre 2",
      interior: "2",
      numero: "405",
    },
    {
      id: 103,
      tipo: "Petición",
      descripcion:
        "Solicitud formal para consultar fechas disponibles, costos y requisitos para alquilar el salón social el próximo mes.",
      fecha_creacion: "2026-09-01T15:00:00",
      estado: "Resuelta",
      nombre_usuario: "Andrés",
      apellido_usuario: "Rodríguez",
      bloque: "Torre 1",
      interior: "1",
      numero: "104",
    },
    {
      id: 104,
      tipo: "Sugerencia",
      descripcion:
        "Proponemos instalar más bicicleteros techados en la zona de visitantes debido al incremento de residentes con bicicleta.",
      fecha_creacion: "2026-08-28T11:20:00",
      estado: "En proceso",
      nombre_usuario: "María",
      apellido_usuario: "Fernández",
      bloque: "Torre 3",
      interior: "1",
      numero: "201",
    },
  ];

  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [notificacion, setNotificacion] = useState(null);

  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [orden, setOrden] = useState("reciente");

  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 8;

  const [modalVer, setModalVer] = useState(null);
  const [modalActualizar, setModalActualizar] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [guardandoEstado, setGuardandoEstado] = useState(false);

  const [modalEliminar, setModalEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const fetchHistorial = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.get("/pqrs");
      const data = Array.isArray(res.data) ? res.data : [];
      setHistorial(data.length > 0 ? data : pqrsEjemplo);
    } catch (err) {
      console.error("Error al obtener PQRs de admin:", err);
      setHistorial(pqrsEjemplo);
      setErrorMsg("No fue posible conectar con el servidor. Se muestran datos de muestra.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, []);

  const getId = (pqr) => pqr.id || pqr._id || pqr.idPqr;

  const getNombreResidente = (pqr) => {
    if (pqr.nombre_usuario || pqr.apellido_usuario) {
      return `${pqr.nombre_usuario || ""} ${pqr.apellido_usuario || ""}`.trim();
    }
    return pqr.usuario || pqr.email || "Residente Casa Blanca";
  };

  const getUbicacion = (pqr) => {
    const parts = [];
    if (pqr.bloque) parts.push(pqr.bloque);
    if (pqr.interior) parts.push(`Int. ${pqr.interior}`);
    if (pqr.numero) parts.push(`Apto ${pqr.numero}`);
    return parts.length > 0 ? parts.join(" • ") : "No asignado";
  };

  const getTipoInfo = (tipoRaw) => {
    const tipo = (tipoRaw || "").toLowerCase();
    if (tipo.includes("queja")) {
      return { label: "Queja", icon: AlertTriangle, className: "tipo-queja" };
    }
    if (tipo.includes("reclamo")) {
      return { label: "Reclamo", icon: AlertCircle, className: "tipo-reclamo" };
    }
    if (tipo.includes("suger")) {
      return { label: "Sugerencia", icon: MessageSquare, className: "tipo-sugerencia" };
    }
    return { label: "Petición", icon: HelpCircle, className: "tipo-peticion" };
  };

  const getEstadoInfo = (estadoRaw) => {
    const estado = (estadoRaw || "pendiente").toLowerCase();
    if (estado.includes("resuelt") || estado.includes("cerrad") || estado.includes("solucion")) {
      return { label: "Resuelta", badgeClass: "badge-resuelta", icon: CheckCircle2, key: "Resuelta" };
    }
    if (estado.includes("proceso") || estado.includes("revisi") || estado.includes("tramite")) {
      return { label: "En proceso", badgeClass: "badge-proceso", icon: Clock, key: "En proceso" };
    }
    if (estado.includes("rechaz") || estado.includes("anulad") || estado.includes("cancel")) {
      return { label: "Rechazada", badgeClass: "badge-rechazada", icon: X, key: "Rechazada" };
    }
    return { label: "Pendiente", badgeClass: "badge-pendiente", icon: AlertCircle, key: "Pendiente" };
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "Sin fecha";
    try {
      const fecha = new Date(fechaStr);
      if (isNaN(fecha.getTime())) return fechaStr;
      return fecha.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return fechaStr;
    }
  };

  const formatearFechaHora = (fechaStr) => {
    if (!fechaStr) return "Sin fecha";
    try {
      const fecha = new Date(fechaStr);
      if (isNaN(fecha.getTime())) return fechaStr;
      return fecha.toLocaleString("es-CO", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return fechaStr;
    }
  };

  const stats = useMemo(() => {
    const total = historial.length;
    let pendientes = 0;
    let enProceso = 0;
    let resueltas = 0;
    let rechazadas = 0;

    historial.forEach((p) => {
      const st = getEstadoInfo(p.estado).key;
      if (st === "Resuelta") resueltas++;
      else if (st === "En proceso") enProceso++;
      else if (st === "Rechazada") rechazadas++;
      else pendientes++;
    });

    return { total, pendientes, enProceso, resueltas, rechazadas };
  }, [historial]);

  const historialFiltrado = useMemo(() => {
    const query = filtroTexto.toLowerCase().trim();

    return historial
      .filter((pqr) => {
        const estadoObj = getEstadoInfo(pqr.estado);
        const coincideEstado =
          filtroEstado === "Todos" ||
          estadoObj.key.toLowerCase() === filtroEstado.toLowerCase();

        const tipoObj = getTipoInfo(pqr.tipo || pqr.asunto);
        const coincideTipo =
          filtroTipo === "Todos" ||
          tipoObj.label.toLowerCase() === filtroTipo.toLowerCase();

        const id = getId(pqr).toString().toLowerCase();
        const residente = getNombreResidente(pqr).toLowerCase();
        const descripcion = (pqr.descripcion || "").toLowerCase();
        const tipoStr = tipoObj.label.toLowerCase();
        const bloque = (pqr.bloque || "").toLowerCase();
        const numeroApto = (pqr.numero || "").toString().toLowerCase();

        const coincideTexto =
          !query ||
          id.includes(query) ||
          residente.includes(query) ||
          descripcion.includes(query) ||
          tipoStr.includes(query) ||
          bloque.includes(query) ||
          numeroApto.includes(query);

        return coincideEstado && coincideTipo && coincideTexto;
      })
      .sort((a, b) => {
        if (orden === "reciente") {
          return new Date(b.fecha_creacion || b.fechaEnvio || 0) - new Date(a.fecha_creacion || a.fechaEnvio || 0);
        }
        if (orden === "antiguo") {
          return new Date(a.fecha_creacion || a.fechaEnvio || 0) - new Date(b.fecha_creacion || b.fechaEnvio || 0);
        }
        if (orden === "idDesc") {
          return getId(b) - getId(a);
        }
        if (orden === "idAsc") {
          return getId(a) - getId(b);
        }
        return 0;
      });
  }, [historial, filtroTexto, filtroEstado, filtroTipo, orden]);

  const totalPaginas = Math.ceil(historialFiltrado.length / itemsPorPagina) || 1;
  const itemsPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    return historialFiltrado.slice(inicio, inicio + itemsPorPagina);
  }, [historialFiltrado, paginaActual, itemsPorPagina]);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtroTexto, filtroEstado, filtroTipo, orden]);

  const mostrarAviso = (type, text) => {
    setNotificacion({ type, text });
    setTimeout(() => {
      setNotificacion(null);
    }, 4500);
  };

  const handleAbrirVer = (pqr) => setModalVer(pqr);

  const handleAbrirActualizar = (pqr) => {
    setModalActualizar(pqr);
    setNuevoEstado(pqr.estado || "Pendiente");
  };

  const handleAbrirEliminar = (pqr) => setModalEliminar(pqr);

  const handleGuardarEstado = async (e) => {
    e.preventDefault();
    if (!nuevoEstado) {
      mostrarAviso("error", "Por favor seleccione un estado.");
      return;
    }

    setGuardandoEstado(true);
    const id = getId(modalActualizar);
    try {
      await api.put(`/pqrs/${encodeURIComponent(id)}`, {
        estado: nuevoEstado,
      });

      mostrarAviso("success", `¡PQR #${id} actualizada a "${nuevoEstado}" correctamente!`);
      setModalActualizar(null);
      if (modalVer && getId(modalVer) === id) {
        setModalVer((prev) => ({ ...prev, estado: nuevoEstado }));
      }
      await fetchHistorial();
    } catch (err) {
      console.error("Error al actualizar estado:", err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "No fue posible actualizar el estado de la solicitud.";
      mostrarAviso("error", msg);
    } finally {
      setGuardandoEstado(false);
    }
  };

  const handleConfirmarEliminar = async () => {
    const id = getId(modalEliminar);
    setEliminando(true);
    try {
      await api.delete(`/pqrs/${encodeURIComponent(id)}`);
      mostrarAviso("success", `¡PQR #${id} eliminada permanentemente con éxito!`);
      setModalEliminar(null);
      if (modalVer && getId(modalVer) === id) {
        setModalVer(null);
      }
      await fetchHistorial();
    } catch (err) {
      console.error("Error al eliminar PQR:", err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "No se pudo eliminar la solicitud PQR seleccionada.";
      mostrarAviso("error", msg);
    } finally {
      setEliminando(false);
    }
  };

  const handleExportarCSV = () => {
    if (historialFiltrado.length === 0) {
      mostrarAviso("error", "No hay registros disponibles para exportar con los filtros actuales.");
      return;
    }

    const headers = ["ID", "Residente", "Ubicacion", "Tipo", "Estado", "Fecha", "Descripcion"];
    const rows = historialFiltrado.map((p) => [
      getId(p),
      `"${getNombreResidente(p).replace(/"/g, '""')}"`,
      `"${getUbicacion(p).replace(/"/g, '""')}"`,
      `"${getTipoInfo(p.tipo || p.asunto).label}"`,
      `"${p.estado || "Pendiente"}"`,
      `"${formatearFechaHora(p.fecha_creacion || p.fechaEnvio)}"`,
      `"${(p.descripcion || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PQRS_CasaBlanca_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    mostrarAviso("success", "Reporte descargado en formato CSV exitosamente.");
  };

  return (
    <>
      <NavbarApp onLogout={handleLogout} />
      <div className="pqrs-admin-page">
        {notificacion && (
          <div className={`toast-notification ${notificacion.type}`}>
            {notificacion.type === "success" ? (
              <CheckCircle size={18} className="toast-icon" />
            ) : (
              <AlertTriangle size={18} className="toast-icon" />
            )}
            <span>{notificacion.text}</span>
            <button
              type="button"
              className="btn-toast-close"
              onClick={() => setNotificacion(null)}
              aria-label="Cerrar notificación"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="admin-pqrs-container">
          <header className="admin-header">
            <div className="admin-badge">
              <ShieldCheck size={14} />
              <span>Panel de Administración</span>
            </div>
            <h1>Gestión y Control de PQRS</h1>
            <p className="admin-subtitle">
              Supervisa, atiende y actualiza las peticiones, quejas, reclamos y sugerencias radicadas por los
              residentes del Conjunto Residencial Casa Blanca.
            </p>
          </header>

          <section className="stats-grid" aria-label="Estadísticas de PQRS">
            <div
              className={`stat-card ${filtroEstado === "Todos" ? "active-stat" : ""}`}
              onClick={() => setFiltroEstado("Todos")}
              role="button"
              tabIndex={0}
            >
              <div className="stat-icon-box total">
                <FileText size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">Total Solicitudes</span>
              </div>
            </div>

            <div
              className={`stat-card ${filtroEstado === "Pendiente" ? "active-stat" : ""}`}
              onClick={() => setFiltroEstado(filtroEstado === "Pendiente" ? "Todos" : "Pendiente")}
              role="button"
              tabIndex={0}
            >
              <div className="stat-icon-box pendiente">
                <AlertCircle size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.pendientes}</span>
                <span className="stat-label">Pendientes</span>
              </div>
            </div>

            <div
              className={`stat-card ${filtroEstado === "En proceso" ? "active-stat" : ""}`}
              onClick={() => setFiltroEstado(filtroEstado === "En proceso" ? "Todos" : "En proceso")}
              role="button"
              tabIndex={0}
            >
              <div className="stat-icon-box proceso">
                <Clock size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.enProceso}</span>
                <span className="stat-label">En Proceso</span>
              </div>
            </div>

            <div
              className={`stat-card ${filtroEstado === "Resuelta" ? "active-stat" : ""}`}
              onClick={() => setFiltroEstado(filtroEstado === "Resuelta" ? "Todos" : "Resuelta")}
              role="button"
              tabIndex={0}
            >
              <div className="stat-icon-box resuelta">
                <CheckCircle2 size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.resueltas}</span>
                <span className="stat-label">Resueltas</span>
              </div>
            </div>
          </section>

          <section className="main-card">
            <div className="toolbar">
              <div className="toolbar-left">
                <h2>Solicitudes Radicadas</h2>
                <span className="results-badge">
                  {historialFiltrado.length} {historialFiltrado.length === 1 ? "resultado" : "resultados"}
                </span>
              </div>

              <div className="toolbar-actions">
                <button
                  type="button"
                  className="btn-toolbar-action"
                  onClick={handleExportarCSV}
                  title="Exportar registros filtrados a CSV"
                >
                  <Download size={15} />
                  <span>Exportar</span>
                </button>

                <button
                  type="button"
                  className="btn-toolbar-action"
                  onClick={fetchHistorial}
                  disabled={loading}
                  title="Actualizar listado desde el servidor"
                >
                  <RotateCw size={15} className={loading ? "spinning" : ""} />
                  <span>{loading ? "Cargando..." : "Recargar"}</span>
                </button>
              </div>
            </div>

            <div className="filters-bar">
              <div className="search-field">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar por ID, residente, torre, apto o descripción..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className="search-input"
                />
                {filtroTexto && (
                  <button
                    type="button"
                    className="btn-clear-search"
                    onClick={() => setFiltroTexto("")}
                    aria-label="Limpiar búsqueda"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="filter-select-wrapper">
                <Filter size={15} className="select-icon" />
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="custom-select"
                >
                  {TIPOS_PQR.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-select-wrapper">
                <ArrowUpDown size={15} className="select-icon" />
                <select
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                  className="custom-select"
                >
                  <option value="reciente">Más recientes primero</option>
                  <option value="antiguo">Más antiguas primero</option>
                  <option value="idDesc">Mayor ID (#)</option>
                  <option value="idAsc">Menor ID (#)</option>
                </select>
              </div>
            </div>

            <div className="status-tabs-nav">
              <button
                type="button"
                className={`tab-btn ${filtroEstado === "Todos" ? "active" : ""}`}
                onClick={() => setFiltroEstado("Todos")}
              >
                Todos ({stats.total})
              </button>
              <button
                type="button"
                className={`tab-btn ${filtroEstado === "Pendiente" ? "active" : ""}`}
                onClick={() => setFiltroEstado("Pendiente")}
              >
                Pendientes ({stats.pendientes})
              </button>
              <button
                type="button"
                className={`tab-btn ${filtroEstado === "En proceso" ? "active" : ""}`}
                onClick={() => setFiltroEstado("En proceso")}
              >
                En proceso ({stats.enProceso})
              </button>
              <button
                type="button"
                className={`tab-btn ${filtroEstado === "Resuelta" ? "active" : ""}`}
                onClick={() => setFiltroEstado("Resuelta")}
              >
                Resueltas ({stats.resueltas})
              </button>
              {stats.rechazadas > 0 && (
                <button
                  type="button"
                  className={`tab-btn ${filtroEstado === "Rechazada" ? "active" : ""}`}
                  onClick={() => setFiltroEstado("Rechazada")}
                >
                  Rechazadas ({stats.rechazadas})
                </button>
              )}
            </div>

            {errorMsg && (
              <div className="alert-box-warning">
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {loading ? (
              <div className="empty-loading-state">
                <RotateCw size={32} className="spinning" />
                <p>Cargando solicitudes de PQRS...</p>
              </div>
            ) : historialFiltrado.length === 0 ? (
              <div className="empty-results-state">
                <FileText size={42} className="empty-icon" />
                <h3>No se encontraron solicitudes</h3>
                <p>
                  {filtroTexto || filtroEstado !== "Todos" || filtroTipo !== "Todos"
                    ? "Intenta ajustar o restablecer los filtros de búsqueda aplicados."
                    : "Aún no se han registrado PQRS en el sistema."}
                </p>
                {(filtroTexto || filtroEstado !== "Todos" || filtroTipo !== "Todos") && (
                  <button
                    type="button"
                    className="btn-reset-filters"
                    onClick={() => {
                      setFiltroTexto("");
                      setFiltroEstado("Todos");
                      setFiltroTipo("Todos");
                    }}
                  >
                    Restablecer todos los filtros
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: "70px" }}>ID</th>
                        <th>Residente</th>
                        <th>Ubicación</th>
                        <th>Tipo</th>
                        <th>Descripción</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th style={{ textAlign: "center", width: "170px" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsPaginados.map((pqr) => {
                        const id = getId(pqr);
                        const tipoInfo = getTipoInfo(pqr.tipo || pqr.asunto);
                        const TipoIcon = tipoInfo.icon;
                        const estadoInfo = getEstadoInfo(pqr.estado);
                        const EstadoIcon = estadoInfo.icon;

                        return (
                          <tr key={id}>
                            <td>
                              <span className="id-badge">#{id}</span>
                            </td>

                            <td>
                              <div className="resident-cell">
                                <div className="user-avatar-mini">
                                  <User size={13} />
                                </div>
                                <span className="resident-name" title={getNombreResidente(pqr)}>
                                  {getNombreResidente(pqr)}
                                </span>
                              </div>
                            </td>

                            <td>
                              <div className="location-cell">
                                <Building size={13} className="cell-icon" />
                                <span>{getUbicacion(pqr)}</span>
                              </div>
                            </td>

                            <td>
                              <span className={`tipo-pill ${tipoInfo.className}`}>
                                <TipoIcon size={12} />
                                {tipoInfo.label}
                              </span>
                            </td>

                            <td>
                              <p className="desc-cell" title={pqr.descripcion}>
                                {pqr.descripcion || "Sin descripción proporcionada"}
                              </p>
                            </td>

                            <td>
                              <div className="date-cell">
                                <Calendar size={13} className="cell-icon" />
                                <span>{formatearFecha(pqr.fecha_creacion || pqr.fechaEnvio)}</span>
                              </div>
                            </td>

                            <td>
                              <span className={`status-pill ${estadoInfo.badgeClass}`}>
                                <EstadoIcon size={12} />
                                {estadoInfo.label}
                              </span>
                            </td>

                            <td>
                              <div className="action-buttons-group">
                                <button
                                  type="button"
                                  className="btn-action btn-action-view"
                                  onClick={() => handleAbrirVer(pqr)}
                                  title="Ver detalles completos"
                                >
                                  <Eye size={14} />
                                  <span>Ver</span>
                                </button>

                                <button
                                  type="button"
                                  className="btn-action btn-action-edit"
                                  onClick={() => handleAbrirActualizar(pqr)}
                                  title="Actualizar estado"
                                >
                                  <Edit3 size={14} />
                                  <span>Estado</span>
                                </button>

                                <button
                                  type="button"
                                  className="btn-action btn-action-delete"
                                  onClick={() => handleAbrirEliminar(pqr)}
                                  title="Eliminar registro"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mobile-cards-list">
                  {itemsPaginados.map((pqr) => {
                    const id = getId(pqr);
                    const tipoInfo = getTipoInfo(pqr.tipo || pqr.asunto);
                    const TipoIcon = tipoInfo.icon;
                    const estadoInfo = getEstadoInfo(pqr.estado);
                    const EstadoIcon = estadoInfo.icon;

                    return (
                      <div key={id} className="mobile-pqr-card">
                        <div className="mobile-card-header">
                          <span className="id-badge">#{id}</span>
                          <span className={`tipo-pill ${tipoInfo.className}`}>
                            <TipoIcon size={12} />
                            {tipoInfo.label}
                          </span>
                          <span className={`status-pill ${estadoInfo.badgeClass}`}>
                            <EstadoIcon size={12} />
                            {estadoInfo.label}
                          </span>
                        </div>

                        <div className="mobile-card-body">
                          <div className="mobile-info-row">
                            <User size={14} />
                            <strong>{getNombreResidente(pqr)}</strong>
                          </div>
                          <div className="mobile-info-row text-muted">
                            <Building size={14} />
                            <span>{getUbicacion(pqr)}</span>
                          </div>
                          <div className="mobile-info-row text-muted">
                            <Calendar size={14} />
                            <span>{formatearFecha(pqr.fecha_creacion || pqr.fechaEnvio)}</span>
                          </div>
                          <p className="mobile-card-desc">{pqr.descripcion}</p>
                        </div>

                        <div className="mobile-card-footer">
                          <button
                            type="button"
                            className="btn-action btn-action-view"
                            onClick={() => handleAbrirVer(pqr)}
                          >
                            <Eye size={14} />
                            <span>Detalle</span>
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-action-edit"
                            onClick={() => handleAbrirActualizar(pqr)}
                          >
                            <Edit3 size={14} />
                            <span>Estado</span>
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-action-delete"
                            onClick={() => handleAbrirEliminar(pqr)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPaginas > 1 && (
                  <div className="pagination-bar">
                    <span className="pagination-info">
                      Página {paginaActual} de {totalPaginas} (Total: {historialFiltrado.length} PQRS)
                    </span>
                    <div className="pagination-controls">
                      <button
                        type="button"
                        className="btn-pagination"
                        onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                        disabled={paginaActual === 1}
                      >
                        <ChevronLeft size={16} />
                        <span>Anterior</span>
                      </button>

                      {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          type="button"
                          className={`btn-pagination-page ${paginaActual === num ? "active" : ""}`}
                          onClick={() => setPaginaActual(num)}
                        >
                          {num}
                        </button>
                      ))}

                      <button
                        type="button"
                        className="btn-pagination"
                        onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                        disabled={paginaActual === totalPaginas}
                      >
                        <span>Siguiente</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        {modalVer && (
          <div className="modal-backdrop" onClick={() => setModalVer(null)}>
            <div className="modal-window" onClick={(e) => e.stopPropagation()}>
              <div className="modal-top">
                <div className="modal-top-title">
                  <span className="modal-id-badge">PQR #{getId(modalVer)}</span>
                  <h3>Detalle de la Solicitud</h3>
                </div>
                <button
                  type="button"
                  className="btn-modal-close"
                  onClick={() => setModalVer(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-scroll-body">
                <div className="modal-highlight-banner">
                  <div className="highlight-item">
                    <span className="label-caption">Tipo de solicitud</span>
                    <span className={`tipo-pill ${getTipoInfo(modalVer.tipo || modalVer.asunto).className}`}>
                      {getTipoInfo(modalVer.tipo || modalVer.asunto).label}
                    </span>
                  </div>
                  <div className="highlight-item">
                    <span className="label-caption">Estado actual</span>
                    <span className={`status-pill ${getEstadoInfo(modalVer.estado).badgeClass}`}>
                      {getEstadoInfo(modalVer.estado).label}
                    </span>
                  </div>
                  <div className="highlight-item">
                    <span className="label-caption">Radicación</span>
                    <span className="val-text">
                      {formatearFechaHora(modalVer.fecha_creacion || modalVer.fechaEnvio)}
                    </span>
                  </div>
                </div>

                <div className="modal-section-card">
                  <h4>Información del Residente</h4>
                  <div className="detail-two-cols">
                    <div className="detail-item">
                      <span className="label-caption">Nombre completo</span>
                      <strong className="val-text">{getNombreResidente(modalVer)}</strong>
                    </div>
                    <div className="detail-item">
                      <span className="label-caption">Apartamento / Unidad</span>
                      <strong className="val-text">{getUbicacion(modalVer)}</strong>
                    </div>
                  </div>
                </div>

                <div className="modal-section-card">
                  <h4>Descripción Detallada</h4>
                  <div className="description-box">
                    {modalVer.descripcion || "Sin descripción proporcionada."}
                  </div>
                </div>
              </div>

              <div className="modal-bottom-actions">
                <button
                  type="button"
                  className="btn-modal-danger"
                  onClick={() => {
                    const target = modalVer;
                    setModalVer(null);
                    handleAbrirEliminar(target);
                  }}
                >
                  <Trash2 size={14} />
                  <span>Eliminar</span>
                </button>

                <div className="actions-right">
                  <button
                    type="button"
                    className="btn-modal-secondary"
                    onClick={() => setModalVer(null)}
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    className="btn-modal-primary"
                    onClick={() => {
                      const target = modalVer;
                      setModalVer(null);
                      handleAbrirActualizar(target);
                    }}
                  >
                    <Edit3 size={14} />
                    <span>Gestionar Estado</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {modalActualizar && (
          <div className="modal-backdrop" onClick={() => setModalActualizar(null)}>
            <div className="modal-window modal-window-sm" onClick={(e) => e.stopPropagation()}>
              <div className="modal-top">
                <div className="modal-top-title">
                  <span className="modal-id-badge">PQR #{getId(modalActualizar)}</span>
                  <h3>Actualizar Estado</h3>
                </div>
                <button
                  type="button"
                  className="btn-modal-close"
                  onClick={() => setModalActualizar(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleGuardarEstado}>
                <div className="modal-scroll-body">
                  <p className="modal-intro-text">
                    Selecciona el nuevo estado administrativo para esta solicitud radicada por{" "}
                    <strong>{getNombreResidente(modalActualizar)}</strong>:
                  </p>

                  <div className="status-selection-list">
                    {ESTADOS_DISPONIBLES.map((est) => {
                      const seleccionado = nuevoEstado === est.value;
                      return (
                        <div
                          key={est.value}
                          className={`status-choice-card ${seleccionado ? "selected" : ""}`}
                          onClick={() => setNuevoEstado(est.value)}
                        >
                          <div className="status-radio-dot">
                            {seleccionado && <Check size={13} className="check-icon" />}
                          </div>
                          <div className="status-choice-info">
                            <div className="status-choice-header">
                              <span className={`status-pill ${est.badgeClass}`}>{est.label}</span>
                            </div>
                            <p className="status-choice-desc">{est.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="modal-bottom-actions">
                  <button
                    type="button"
                    className="btn-modal-secondary"
                    onClick={() => setModalActualizar(null)}
                    disabled={guardandoEstado}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-modal-primary"
                    disabled={guardandoEstado}
                  >
                    {guardandoEstado ? (
                      <>
                        <RotateCw size={15} className="spinning" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Check size={15} />
                        <span>Guardar Cambios</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {modalEliminar && (
          <div className="modal-backdrop" onClick={() => setModalEliminar(null)}>
            <div className="modal-window modal-window-sm" onClick={(e) => e.stopPropagation()}>
              <div className="modal-top danger-header">
                <div className="danger-avatar-icon">
                  <AlertTriangle size={24} />
                </div>
                <button
                  type="button"
                  className="btn-modal-close"
                  onClick={() => setModalEliminar(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-scroll-body text-center">
                <h3 className="danger-title">¿Eliminar solicitud PQR #{getId(modalEliminar)}?</h3>
                <p className="danger-desc">
                  Esta acción es definitiva y no se puede deshacer. Se eliminarán permanentemente el registro
                  de la PQR y sus vinculaciones de la base de datos de Casa Blanca.
                </p>

                <div className="danger-summary-box">
                  <strong>Residente:</strong> {getNombreResidente(modalEliminar)} <br />
                  <strong>Ubicación:</strong> {getUbicacion(modalEliminar)} <br />
                  <strong>Tipo:</strong> {getTipoInfo(modalEliminar.tipo || modalEliminar.asunto).label}
                </div>
              </div>

              <div className="modal-bottom-actions center-actions">
                <button
                  type="button"
                  className="btn-modal-secondary"
                  onClick={() => setModalEliminar(null)}
                  disabled={eliminando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-modal-danger-solid"
                  onClick={handleConfirmarEliminar}
                  disabled={eliminando}
                >
                  {eliminando ? (
                    <>
                      <RotateCw size={15} className="spinning" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={15} />
                      <span>Sí, eliminar solicitud</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </>
  );
}

export default PqrsAdmin;