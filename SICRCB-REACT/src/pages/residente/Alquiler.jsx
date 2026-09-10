import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import NavbarApp from "../../components/NavbarApp.jsx";
import Footer from "../../components/Footer.jsx";
import {
  Calendar,
  Clock,
  DollarSign,
  Building,
  CheckCircle,
  AlertCircle,
  X,
  Send,
  Info,
  RotateCw,
  Trash2,
  AlertTriangle,
  Armchair,
  Home,
  Search
} from "lucide-react";
import "../../assets/css/styles.css";
import "../../assets/css/alquiler.css";

const TIPOS_RESERVA = [
  { id: "salon", label: "Salón Social", desc: "Solo espacio del salón comunal", icon: Home },
  { id: "sillas", label: "Solo Sillas", desc: "Mobiliario y silletería", icon: Armchair },
  { id: "ambos", label: "Salón + Sillas", desc: "Espacio completo y mobiliario", icon: Building }
];

function Alquiler() {
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

  // Fecha actual formateada (YYYY-MM-DD) para bloquear fechas pasadas
  const todayDateString = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
  }, []);

  // Formulario por HORAS en el MISMO DÍA
  const [formData, setFormData] = useState({
    descripcion: "",
    tipoAlquiler: "salon",
    fechaEvento: "",
    horaInicio: "",
    horaFin: "",
    valorHora: "50000"
  });

  // Apartamento asociado automático
  const [apartamentoAsociado, setApartamentoAsociado] = useState(null);
  const [loadingApto, setLoadingApto] = useState(true);

  // Estados de retroalimentación
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Historial
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [reservaACancelar, setReservaACancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);

  // Filtros de fecha en tabla
  const [filtroTiempo, setFiltroTiempo] = useState("todas");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // 1. Cargar apartamento asociado y tarifa sugerida
  useEffect(() => {
    const fetchDatosIniciales = async () => {
      setLoadingApto(true);
      try {
        const resUser = await api.get("/usuarios/me");
        const userData = resUser.data;

        // Asociar apartamento del propietario
        const resAptos = await api.get("/apartamentos");
        if (Array.isArray(resAptos.data)) {
          const miApto = resAptos.data.find(
            (a) =>
              a.nombre_propietario &&
              userData.nombres &&
              a.nombre_propietario.toLowerCase().trim() ===
                userData.nombres.toLowerCase().trim() &&
              a.apellido_propietario &&
              userData.apellidos &&
              a.apellido_propietario.toLowerCase().trim() ===
                userData.apellidos.toLowerCase().trim()
          );

          if (miApto) {
            setApartamentoAsociado(miApto);
          } else if (resAptos.data.length > 0) {
            setApartamentoAsociado(resAptos.data[0]);
          }
        }

        // Cargar costo por hora
        try {
          const resSalon = await api.get("/salon-comunal");
          if (Array.isArray(resSalon.data) && resSalon.data.length > 0) {
            const costoSugerido = resSalon.data[0].costo_hora;
            if (costoSugerido) {
              setFormData((prev) => ({
                ...prev,
                valorHora: costoSugerido.toString()
              }));
            }
          }
        } catch (salonErr) {}
      } catch (err) {
        console.warn("Error al cargar datos iniciales de alquiler:", err);
      } finally {
        setLoadingApto(false);
      }
    };

    fetchDatosIniciales();
  }, []);

  // 2. Cargar historial de alquileres del usuario
  const fetchHistorial = async () => {
    setLoadingHistorial(true);
    try {
      const res = await api.get("/alquileres/mis-alquileres");
      setHistorial(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error al obtener historial de alquileres:", err);
    } finally {
      setLoadingHistorial(false);
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, [success]);

  // Validación y cálculo de horas en el mismo día
  const calculoReserva = useMemo(() => {
    if (!formData.fechaEvento || !formData.horaInicio || !formData.horaFin) {
      return { horas: 0, total: 0, error: null };
    }

    const inicio = new Date(`${formData.fechaEvento}T${formData.horaInicio}:00`);
    const fin = new Date(`${formData.fechaEvento}T${formData.horaFin}:00`);
    const ahora = new Date();

    if (inicio < ahora) {
      return {
        horas: 0,
        total: 0,
        error: "Para eventos de hoy, la hora de inicio debe ser posterior a la hora actual."
      };
    }

    const diffMs = fin.getTime() - inicio.getTime();
    if (diffMs <= 0) {
      return {
        horas: 0,
        total: 0,
        error: "La hora de finalización debe ser posterior a la hora de inicio (mismo día)."
      };
    }

    const horas = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
    const valorHoraNum = parseFloat(formData.valorHora) || 50000;
    const total = Math.round(horas * valorHoraNum);

    return { horas, total, error: null };
  }, [formData.fechaEvento, formData.horaInicio, formData.horaFin, formData.valorHora]);

  // Manejo de cambio en hora de inicio (resetea fin si queda inconsistente)
  const handleHoraInicioChange = (e) => {
    const nuevaInicio = e.target.value;
    setFormData((prev) => {
      let nuevaFin = prev.horaFin;
      if (nuevaFin && nuevaFin <= nuevaInicio) {
        nuevaFin = "";
      }
      return { ...prev, horaInicio: nuevaInicio, horaFin: nuevaFin };
    });
  };

  // Filtrado reactivo por fechas y texto
  const historialFiltrado = useMemo(() => {
    return historial.filter((item) => {
      if (!item.hora_inicio) return false;
      const fechaItem = new Date(item.hora_inicio);
      const ahora = new Date();

      if (filtroTiempo === "proximas" && fechaItem < ahora) return false;
      if (filtroTiempo === "pasadas" && fechaItem >= ahora) return false;

      if (fechaDesde) {
        const dDesde = new Date(fechaDesde + "T00:00:00");
        if (fechaItem < dDesde) return false;
      }

      if (fechaHasta) {
        const dHasta = new Date(fechaHasta + "T23:59:59");
        if (fechaItem > dHasta) return false;
      }

      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const coincide =
          item.id?.toString().includes(q) ||
          item.descripcion?.toLowerCase().includes(q) ||
          item.tipo_alquiler?.toLowerCase().includes(q) ||
          item.estado?.toLowerCase().includes(q);
        if (!coincide) return false;
      }

      return true;
    });
  }, [historial, filtroTiempo, fechaDesde, fechaHasta, busqueda]);

  const hayFiltrosActivos = fechaDesde !== "" || fechaHasta !== "" || filtroTiempo !== "todas" || busqueda !== "";

  const limpiarFiltros = () => {
    setFechaDesde("");
    setFechaHasta("");
    setFiltroTiempo("todas");
    setBusqueda("");
  };

  // Validación de la Regla de 24 horas para cancelación
  const evaluarCancelacion = (horaInicioStr, estado) => {
    if (!horaInicioStr) return { cancelable: false, texto: "Fecha no válida" };
    if (estado?.toLowerCase() === "cancelado") return { cancelable: false, texto: "Cancelado" };
    if (estado?.toLowerCase() === "finalizado") return { cancelable: false, texto: "Finalizado" };

    const fechaInicio = new Date(horaInicioStr);
    const ahora = new Date();
    const diferenciaHoras = (fechaInicio.getTime() - ahora.getTime()) / (1000 * 60 * 60);

    if (diferenciaHoras < 0) {
      return { cancelable: false, texto: "Evento transcurrido" };
    }

    if (diferenciaHoras < 24) {
      const horasRestantes = Math.max(0, Math.floor(diferenciaHoras));
      return {
        cancelable: false,
        texto: `No cancelable (faltan ${horasRestantes}h · mín. 24h)`
      };
    }

    return {
      cancelable: true,
      texto: "Cancelar",
      horasRestantes: Math.floor(diferenciaHoras)
    };
  };

  // Cancelar reserva
  const handleConfirmarCancelacion = async () => {
    if (!reservaACancelar) return;
    setCancelando(true);
    setError("");
    try {
      await api.delete(`/alquileres/${reservaACancelar.id}`);
      setSuccess(`La reserva #${reservaACancelar.id} fue eliminada exitosamente.`);
      setReservaACancelar(null);
      fetchHistorial();
    } catch (err) {
      console.error("Error al cancelar alquiler:", err);
      const serverMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "No puedes cancelar una reserva con menos de 24 horas de anticipación.";
      setError(serverMsg);
      setReservaACancelar(null);
    } finally {
      setCancelando(false);
    }
  };

  // Envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!formData.descripcion.trim()) {
      setError("La descripción o motivo es requerida.");
      return;
    }
    if (!formData.fechaEvento) {
      setError("Debes seleccionar la fecha del evento.");
      return;
    }
    if (!formData.horaInicio || !formData.horaFin) {
      setError("Debes indicar las horas de inicio y fin del evento.");
      return;
    }
    if (calculoReserva.error) {
      setError(calculoReserva.error);
      return;
    }

    setLoading(true);
    try {
      // Formato fecha + hora en el mismo día
      const inicioCompleto = `${formData.fechaEvento} ${formData.horaInicio}:00`;
      const finCompleto = `${formData.fechaEvento} ${formData.horaFin}:00`;

      const payload = {
        descripcion: formData.descripcion.trim(),
        horaInicio: inicioCompleto,
        horaFin: finCompleto,
        tipoAlquiler: formData.tipoAlquiler,
        valorHora: parseFloat(formData.valorHora) || 50000
      };

      const res = await api.post("/alquileres", payload);
      const idGenerado = res.data?.id;

      setSuccess(
        idGenerado
          ? `¡Reserva creada exitosamente! Número de radicado: #${idGenerado}`
          : "¡Reserva creada exitosamente!"
      );

      setFormData((prev) => ({
        ...prev,
        descripcion: "",
        fechaEvento: "",
        horaInicio: "",
        horaFin: ""
      }));
    } catch (err) {
      console.error("Error al crear alquiler:", err);
      const serverMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Error al radicar la reserva. Verifica los datos ingresados.";
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavbarApp onLogout={handleLogout} />

      <div className="alquiler-page">
        <div className="alquiler-container">
          
          {/* Encabezado */}
          <header className="alquiler-header">
            <span className="alquiler-badge">Zonas Comunes</span>
            <h1>Alquiler de Salón Comunal</h1>
            <p className="alquiler-subtitle">
              Reserva el salón social y silletería por horas para tus reuniones familiares en Casa Blanca.
            </p>
          </header>

          {/* Banners de notificación */}
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

          {/* Grid Principal */}
          <div className="alquiler-main-grid">
            
            {/* Formulario de Reserva */}
            <section className="alquiler-card form-card">
              <div className="card-header">
                <div className="header-title-group">
                  <Calendar className="header-icon" size={20} />
                  <h2>Nueva Solicitud de Reserva</h2>
                </div>
                <span className="step-indicator">Alquiler por horas</span>
              </div>

              <form onSubmit={handleSubmit} className="alquiler-form">
                
                {/* 1. Apartamento Asociado */}
                <div className="form-group">
                  <label className="input-label">Apartamento Solicitante (Asignación Automática)</label>
                  <div className="input-with-icon-static">
                    <Building size={17} className="field-inner-icon" />
                    <input
                      type="text"
                      className="form-input locked with-icon destaque-apto"
                      value={
                        loadingApto
                          ? "Cargando apartamento asignado..."
                          : apartamentoAsociado
                          ? `Apto ${apartamentoAsociado.numero} — Torre ${apartamentoAsociado.bloque_nombre || apartamentoAsociado.bloque || "A"} (Int. ${apartamentoAsociado.interior || "1"})`
                          : "Unidad Residencial Activa"
                      }
                      disabled
                    />
                  </div>
                  <span className="field-hint">
                    Asociado automáticamente a tu cuenta de propietario en Casa Blanca.
                  </span>
                </div>

                {/* 2. Selector de Tipo de Alquiler */}
                <div className="form-group">
                  <label className="input-label">Tipo de Alquiler</label>
                  <div className="tipo-alquiler-selector">
                    {TIPOS_RESERVA.map((tipo) => {
                      const IconComponent = tipo.icon;
                      const isSelected = formData.tipoAlquiler === tipo.id;
                      return (
                        <button
                          type="button"
                          key={tipo.id}
                          className={`btn-tipo-alquiler ${isSelected ? "selected" : ""}`}
                          onClick={() => setFormData({ ...formData, tipoAlquiler: tipo.id })}
                        >
                          <IconComponent size={18} />
                          <div className="tipo-alquiler-text">
                            <strong>{tipo.label}</strong>
                            <small>{tipo.desc}</small>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Descripción del Evento */}
                <div className="form-group">
                  <label className="input-label" htmlFor="descripcion">
                    Descripción o Motivo del Evento <span className="required">*</span>
                  </label>
                  <textarea
                    id="descripcion"
                    rows={3}
                    maxLength={500}
                    placeholder="Ej. Celebración de cumpleaños familiar, reunión de copropietarios, baby shower..."
                    className="form-input textarea"
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion: e.target.value })
                    }
                    required
                  />
                  <span className="field-hint">
                    Indica el motivo del evento para conocimiento de la administración.
                  </span>
                </div>

                {/* 4. FECHA ÚNICA DEL EVENTO (Solo se alquila por horas el mismo día) */}
                <div className="form-group">
                  <label className="input-label" htmlFor="fechaEvento">
                    Fecha del Evento <span className="required">*</span>
                  </label>
                  <div className="input-with-icon-static">
                    <Calendar size={17} className="field-inner-icon" />
                    <input
                      id="fechaEvento"
                      type="date"
                      min={todayDateString}
                      className="form-input with-icon"
                      value={formData.fechaEvento}
                      onChange={(e) =>
                        setFormData({ ...formData, fechaEvento: e.target.value })
                      }
                      required
                    />
                  </div>
                  <span className="field-hint">
                    Las reservas se realizan para una sola jornada (mismo día).
                  </span>
                </div>

                {/* 5. HORARIOS DE INICIO Y FIN (POR HORAS) */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="input-label" htmlFor="horaInicio">
                      Hora de Inicio <span className="required">*</span>
                    </label>
                    <div className="input-with-icon-static">
                      <Clock size={16} className="field-inner-icon" />
                      <input
                        id="horaInicio"
                        type="time"
                        className="form-input with-icon"
                        value={formData.horaInicio}
                        onChange={handleHoraInicioChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="input-label" htmlFor="horaFin">
                      Hora de Finalización <span className="required">*</span>
                    </label>
                    <div className="input-with-icon-static">
                      <Clock size={16} className="field-inner-icon" />
                      <input
                        id="horaFin"
                        type="time"
                        min={formData.horaInicio}
                        className="form-input with-icon"
                        value={formData.horaFin}
                        onChange={(e) =>
                          setFormData({ ...formData, horaFin: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Aviso cronológico si las horas son erróneas */}
                {calculoReserva.error && (
                  <div className="field-error-notice">
                    <AlertCircle size={15} />
                    <span>{calculoReserva.error}</span>
                  </div>
                )}

                {/* 6. Campo Valor por Hora */}
                <div className="form-group">
                  <label className="input-label" htmlFor="valorHora">
                    Valor por Hora ($ COP) <span className="required">*</span>
                  </label>
                  <div className="input-with-icon-static">
                    <DollarSign size={17} className="field-inner-icon" />
                    <input
                      id="valorHora"
                      type="number"
                      step="1000"
                      min="1000"
                      placeholder="50000"
                      className="form-input with-icon"
                      value={formData.valorHora}
                      onChange={(e) =>
                        setFormData({ ...formData, valorHora: e.target.value })
                      }
                      required
                    />
                  </div>
                  <span className="field-hint">
                    Tarifa por hora fijada para el salón comunal (por defecto $50.000 COP).
                  </span>
                </div>

                {/* Resumen dinámico del cálculo de horas */}
                {calculoReserva.horas > 0 && !calculoReserva.error && (
                  <div className="calculation-box">
                    <div className="calc-item">
                      <Clock size={16} />
                      <span>Duración: <strong>{calculoReserva.horas} horas</strong></span>
                    </div>
                    <div className="calc-divider"></div>
                    <div className="calc-item">
                      <DollarSign size={16} />
                      <span>Total estimado: <strong>${calculoReserva.total.toLocaleString("es-CO")} COP</strong></span>
                    </div>
                  </div>
                )}

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-submit-alquiler"
                    disabled={loading || !!calculoReserva.error}
                  >
                    <Send size={16} />
                    <span>{loading ? "Procesando reserva..." : "Radicar Reserva"}</span>
                  </button>
                </div>
              </form>
            </section>

            {/* Columna Lateral de Normas y Política 24h */}
            <aside className="alquiler-info-column">
              <div className="alquiler-card info-card">
                <div className="card-header">
                  <div className="header-title-group">
                    <Info className="header-icon" size={20} />
                    <h3>Recomendaciones de Uso</h3>
                  </div>
                </div>
                <ul className="info-tips-list">
                  <li>
                    <span className="tip-dot"></span>
                    <div>
                      <strong>Alquiler por horas</strong>
                      <p>Las reservas se realizan exclusivamente por horas dentro de una misma jornada. No se permite apartar múltiples días continuos.</p>
                    </div>
                  </li>
                  <li>
                    <span className="tip-dot"></span>
                    <div>
                      <strong>Cuidado del mobiliario</strong>
                      <p>Las mesas y sillas deben entregarse limpias y ordenadas al finalizar las horas contratadas.</p>
                    </div>
                  </li>
                  <li>
                    <span className="tip-dot"></span>
                    <div>
                      <strong>Horarios permitidos</strong>
                      <p>El salón puede reservarse hasta un horario máximo de entrega de las 11:00 p.m.</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Política 24 Horas */}
              <div className="alquiler-card policy-card">
                <div className="card-header">
                  <div className="header-title-group">
                    <Clock className="header-icon" size={18} />
                    <h3>Plazo de Cancelación</h3>
                  </div>
                </div>
                <div className="policy-content">
                  <div className="policy-highlight-box">
                    <strong>Mínimo 24 horas de anticipación</strong>
                    <p>
                      Para anular una reserva, debes hacerlo con al menos 24 horas de antelación a la hora de inicio fijada.
                    </p>
                  </div>
                  <p className="policy-note">
                    Si faltan menos de 24 horas para el evento (por ejemplo, 3 horas antes), la cancelación se bloqueará automáticamente.
                  </p>
                </div>
              </div>
            </aside>
          </div>

          {/* Historial de Alquileres con FILTRO POR FECHAS */}
          <section className="alquiler-card table-card">
            
            <div className="table-toolbar">
              <div>
                <h2>Mis Reservas Realizadas</h2>
                <p className="table-subtitle">
                  Historial y seguimiento a tus alquileres de salón comunal y silletería.
                </p>
              </div>

              <button
                type="button"
                className="btn-refresh"
                onClick={fetchHistorial}
                title="Actualizar reservas"
              >
                <RotateCw size={16} className={loadingHistorial ? "spinning" : ""} />
              </button>
            </div>

            {/* Barra de Filtros */}
            <div className="table-filters-container">
              <div className="time-filter-tabs">
                {[
                  { id: "todas", label: "Todas" },
                  { id: "proximas", label: "Próximas" },
                  { id: "pasadas", label: "Pasadas" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`time-tab-btn ${filtroTiempo === tab.id ? "active" : ""}`}
                    onClick={() => setFiltroTiempo(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="date-range-filter-group">
                <div className="date-input-wrapper">
                  <label className="filter-label">Desde:</label>
                  <input
                    type="date"
                    className="filter-date-input"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                  />
                </div>

                <div className="date-input-wrapper">
                  <label className="filter-label">Hasta:</label>
                  <input
                    type="date"
                    className="filter-date-input"
                    value={fechaHasta}
                    min={fechaDesde}
                    onChange={(e) => setFechaHasta(e.target.value)}
                  />
                </div>

                <div className="table-search-box">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar evento..."
                    className="filter-search-input"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                  {busqueda && (
                    <button type="button" className="clear-btn" onClick={() => setBusqueda("")}>
                      <X size={12} />
                    </button>
                  )}
                </div>

                {hayFiltrosActivos && (
                  <button
                    type="button"
                    className="btn-clear-filters"
                    onClick={limpiarFiltros}
                    title="Restablecer filtros"
                  >
                    <X size={14} />
                    <span>Limpiar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tabla */}
            {loadingHistorial ? (
              <div className="empty-state">
                <RotateCw className="spinning" size={32} />
                <p>Cargando historial de alquileres...</p>
              </div>
            ) : historialFiltrado.length === 0 ? (
              <div className="empty-state">
                <Calendar size={40} className="empty-icon" />
                <h4>No se encontraron reservas</h4>
                <p>
                  {hayFiltrosActivos
                    ? "No hay reservas que coincidan con las fechas o criterios seleccionados."
                    : "Aún no tienes solicitudes de alquiler registradas."}
                </p>
                {hayFiltrosActivos && (
                  <button type="button" className="btn-reset-empty" onClick={limpiarFiltros}>
                    Ver todas las reservas
                  </button>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="alquiler-table">
                  <thead>
                    <tr>
                      <th>Radicado</th>
                      <th>Tipo</th>
                      <th>Descripción / Evento</th>
                      <th>Fecha</th>
                      <th>Horario</th>
                      <th>Valor / Hora</th>
                      <th>Estado</th>
                      <th style={{ textAlign: "right" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialFiltrado.map((item) => {
                      const evalCancel = evaluarCancelacion(item.hora_inicio, item.estado);
                      const fechaInicio = item.hora_inicio ? new Date(item.hora_inicio) : null;
                      const fechaFin = item.hora_fin ? new Date(item.hora_fin) : null;

                      // Duración en horas para mostrar en la celda
                      let horasDuracion = 0;
                      if (fechaInicio && fechaFin) {
                        horasDuracion = Math.round(((fechaFin - fechaInicio) / (1000 * 60 * 60)) * 10) / 10;
                      }

                      return (
                        <tr key={item.id}>
                          <td className="cell-id">
                            <span className="id-badge">#{item.id}</span>
                          </td>
                          <td>
                            <span className="tipo-badge">
                              {item.tipo_alquiler === "ambos"
                                ? "Salón + Sillas"
                                : item.tipo_alquiler === "sillas"
                                ? "Sillas"
                                : "Salón"}
                            </span>
                          </td>
                          <td className="cell-desc">
                            <strong>{item.descripcion}</strong>
                          </td>
                          <td className="cell-date">
                            {fechaInicio
                              ? fechaInicio.toLocaleDateString("es-CO", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric"
                                })
                              : "-"}
                          </td>
                          <td className="cell-date">
                            {fechaInicio && fechaFin ? (
                              <span>
                                {fechaInicio.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                                {" – "}
                                {fechaFin.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                                <small className="duration-tag">{horasDuracion} hrs</small>
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="cell-valor">
                            ${parseFloat(item.valor_hora || 50000).toLocaleString("es-CO")}
                          </td>
                          <td>
                            <span className={`status-pill ${item.estado?.toLowerCase() || "reservado"}`}>
                              {item.estado || "Reservado"}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {evalCancel.cancelable ? (
                              <button
                                type="button"
                                className="btn-cancelar-reserva"
                                onClick={() => setReservaACancelar(item)}
                                title={`Faltan ${evalCancel.horasRestantes}h para el evento`}
                              >
                                <Trash2 size={14} />
                                <span>Cancelar</span>
                              </button>
                            ) : (
                              <span className="badge-no-cancelable" title={evalCancel.texto}>
                                {evalCancel.texto}
                              </span>
                            )}
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

        {/* Modal de Confirmación de Cancelación */}
        {reservaACancelar && (
          <div className="modal-overlay" onClick={() => !cancelando && setReservaACancelar(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-with-icon">
                  <AlertTriangle className="modal-warn-icon" size={22} />
                  <h3>Confirmar Cancelación de Reserva</h3>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => !cancelando && setReservaACancelar(null)}
                  disabled={cancelando}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <p>
                  ¿Estás seguro de cancelar tu reserva <strong>#{reservaACancelar.id}</strong> para el evento <em>"{reservaACancelar.descripcion}"</em>?
                </p>
                <div className="cancel-notice-box">
                  <Info size={16} />
                  <span>
                    Cumples con el requisito de más de 24 horas de antelación. Esta acción liberará el espacio en la fecha programada.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-modal-back"
                  onClick={() => setReservaACancelar(null)}
                  disabled={cancelando}
                >
                  Volver
                </button>
                <button
                  type="button"
                  className="btn-modal-confirm-delete"
                  onClick={handleConfirmarCancelacion}
                  disabled={cancelando}
                >
                  {cancelando ? "Cancelando..." : "Sí, Cancelar Reserva"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Full-Width */}
        <Footer />
      </div>
    </>
  );
}

export default Alquiler;