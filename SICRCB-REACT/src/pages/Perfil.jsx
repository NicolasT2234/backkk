import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarApp from "../components/NavbarApp.jsx";
import Footer from "../components/Footer.jsx";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Mail,
  Shield,
  Home,
  Building,
  Layers,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Edit3,
  X,
  Save,
  LogOut,
  FileText,
  Info,
  RotateCw
} from "lucide-react";
import "../assets/css/styles.css";
import "../assets/css/perfil.css";

function Perfil() {
  const navigate = useNavigate();
  const { user: authUser, login: setAuthUser } = useAuth();

  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Datos de residencia (Apartamento, Interior, Bloque)
  const [residencia, setResidencia] = useState({
    bloque: "",
    interior: "",
    apartamento: ""
  });

  // Visibilidad de contraseñas
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    numeroDocumento: "",
    tipoDocumento: "",
    rol: "",
    contraseña: "",
    confirmarContraseña: ""
  });

  // Cargar datos del usuario y su apartamento
  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Obtener datos del perfil actual
      const response = await api.get("/usuarios/me");
      const userData = response.data;
      setUsuario(userData);
      setFormData({
        nombres: userData.nombres || "",
        apellidos: userData.apellidos || "",
        email: userData.email || "",
        numeroDocumento: userData.numeroDocumento || "",
        tipoDocumento: userData.tipoDocumento || "",
        rol: userData.rol || "Residente",
        contraseña: "",
        confirmarContraseña: ""
      });

      // 2. Obtener información de Bloque, Interior y Apartamento
      let bloque = userData.bloque || "";
      let interior = userData.interior || "";
      let apartamento = userData.apartamento || userData.numero_apartamento || "";

      // Si /usuarios/me no trae directamente el apartamento, consultamos /apartamentos
      if (!apartamento) {
        try {
          const resAptos = await api.get("/apartamentos");
          if (Array.isArray(resAptos.data) && resAptos.data.length > 0) {
            // Buscar la unidad donde el nombre del propietario coincida con el usuario
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
              bloque = miApto.bloque_nombre || miApto.bloque || "";
              interior = miApto.interior || "";
              apartamento = miApto.numero || "";
            } else if (resAptos.data.length > 0 && userData.rol?.toLowerCase() !== "administrador") {
              // Fallback: primer apartamento asignado si existe
              bloque = resAptos.data[0].bloque_nombre || "";
              interior = resAptos.data[0].interior || "";
              apartamento = resAptos.data[0].numero || "";
            }
          }
        } catch (aptErr) {
          console.warn("No se pudo obtener información de apartamentos:", aptErr);
        }
      }

      setResidencia({ bloque, interior, apartamento });
    } catch (err) {
      console.error("Error al cargar perfil:", err);
      setError("No se pudo cargar la información del perfil.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancelEdit = () => {
    if (!usuario) return;
    setFormData({
      nombres: usuario.nombres || "",
      apellidos: usuario.apellidos || "",
      email: usuario.email || "",
      numeroDocumento: usuario.numeroDocumento || "",
      tipoDocumento: usuario.tipoDocumento || "",
      rol: usuario.rol || "Residente",
      contraseña: "",
      confirmarContraseña: ""
    });
    setIsEditing(false);
    setError(null);
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout fallido:", err);
    } finally {
      navigate("/");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    if (!formData.nombres.trim() || !formData.apellidos.trim()) {
      setError("Los nombres y apellidos son campos obligatorios.");
      return;
    }

    if (formData.contraseña && formData.contraseña.trim() !== "") {
      if (formData.contraseña.length < 6) {
        setError("La nueva contraseña debe tener mínimo 6 caracteres.");
        return;
      }
      if (formData.contraseña !== formData.confirmarContraseña) {
        setError("La confirmación de la contraseña no coincide.");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim()
      };

      if (formData.contraseña && formData.contraseña.trim() !== "") {
        payload.contraseña = formData.contraseña.trim();
      }

      const response = await api.put("/usuarios/me", payload);
      const updatedUser = { ...usuario, ...response.data };

      setUsuario(updatedUser);
      if (setAuthUser) {
        setAuthUser(updatedUser);
      }

      setFormData((prev) => ({
        ...prev,
        nombres: updatedUser.nombres || "",
        apellidos: updatedUser.apellidos || "",
        contraseña: "",
        confirmarContraseña: ""
      }));

      setIsEditing(false);
      setSuccess("¡Perfil actualizado con éxito!");
    } catch (err) {
      console.error("Error al actualizar perfil:", err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "No se pudo guardar la información del perfil. Intenta nuevamente.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    const primer = (formData.nombres || "U").trim().charAt(0);
    const segundo = (formData.apellidos || "").trim().charAt(0);
    return `${primer}${segundo}`.toUpperCase();
  };

  const esAdmin = (formData.rol || "").toLowerCase().includes("admin");

  return (
    <>
      <NavbarApp onLogout={handleLogout} />

      <div className="perfil-page">
        <div className="perfil-container">
          
          {/* Encabezado */}
          <header className="perfil-header">
            <span className="perfil-badge">Configuración de Cuenta</span>
            <h1>Perfil de Usuario</h1>
            <p className="perfil-subtitle">
              Gestiona tu información personal, datos residenciales y credenciales de acceso.
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
                onClick={() => setSuccess(null)}
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
                onClick={() => setError(null)}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {loading ? (
            <div className="perfil-loading-card">
              <RotateCw size={36} className="spinning" />
              <p>Cargando información del usuario...</p>
            </div>
          ) : !usuario ? (
            <div className="perfil-error-card">
              <AlertCircle size={40} />
              <h3>No se encontró la cuenta</h3>
              <p>No fue posible obtener tus datos. Por favor reintenta o vuelve a iniciar sesión.</p>
              <button className="btn-retry" onClick={fetchUser}>
                <RotateCw size={16} /> Reintentar
              </button>
            </div>
          ) : (
            <div className="perfil-main-grid">
              
              {/* Columna Izquierda: Tarjeta de Identidad y Residencia */}
              <aside className="perfil-id-card">
                <div className="id-card-top">
                  <div className="avatar-circle">
                    <span>{getInitials()}</span>
                  </div>

                  <h2 className="user-fullname">
                    {formData.nombres} {formData.apellidos}
                  </h2>
                  <p className="user-email">{formData.email}</p>

                  <div className="badge-row">
                    <span className={`role-badge ${esAdmin ? "admin" : "propietario"}`}>
                      {esAdmin ? <Shield size={14} /> : <Home size={14} />}
                      {formData.rol || "Residente"}
                    </span>
                    <span className="status-badge active">
                      <span className="status-dot"></span>
                      Activo
                    </span>
                  </div>
                </div>

                <div className="id-card-divider"></div>

                {/* Residencia destacada en la tarjeta lateral */}
                <div className="residencia-box">
                  <div className="residencia-box-header">
                    <Home size={15} />
                    <span>Unidad Residencial</span>
                  </div>
                  {esAdmin ? (
                    <p className="residencia-admin-text">Oficina de Administración General</p>
                  ) : (
                    <div className="residencia-pills-row">
                      <div className="residencia-pill">
                        <span className="pill-lbl">Bloque</span>
                        <span className="pill-val">{residencia.bloque || "-"}</span>
                      </div>
                      <div className="residencia-pill">
                        <span className="pill-lbl">Interior</span>
                        <span className="pill-val">{residencia.interior || "-"}</span>
                      </div>
                      <div className="residencia-pill destaque">
                        <span className="pill-lbl">Apto</span>
                        <span className="pill-val">{residencia.apartamento || "-"}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="id-card-details">
                  <div className="id-detail-item">
                    <div className="detail-icon">
                      <FileText size={16} />
                    </div>
                    <div>
                      <span className="detail-label">Documento</span>
                      <span className="detail-value">
                        {formData.tipoDocumento || "CC"} · {formData.numeroDocumento || "No registrado"}
                      </span>
                    </div>
                  </div>

                  <div className="id-detail-item">
                    <div className="detail-icon">
                      <Mail size={16} />
                    </div>
                    <div>
                      <span className="detail-label">Correo Registrado</span>
                      <span className="detail-value">{formData.email}</span>
                    </div>
                  </div>
                </div>

                <div className="id-card-note">
                  <Info size={15} />
                  <p>
                    Para cambios en tu documento, correo o cesión de apartamento, debes solicitarlos en la administración de Casa Blanca.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-logout"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Cerrar Sesión</span>
                </button>
              </aside>

              {/* Columna Derecha: Formulario de Datos */}
              <section className="perfil-form-card">
                <div className="form-card-header">
                  <div className="header-info">
                    <h2>Datos de la Cuenta</h2>
                    <p>Revisa y actualiza tus nombres o credenciales de seguridad.</p>
                  </div>
                  {!isEditing && (
                    <button
                      type="button"
                      className="btn-edit-mode"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit3 size={15} />
                      <span>Editar Perfil</span>
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="perfil-form-body">
                  
                  {/* Bloque 1: Ubicación en el Conjunto Residencial (Bloque, Interior, Apto) */}
                  <div className="form-section">
                    <div className="section-title-with-badge">
                      <h3 className="section-title">
                        <Building size={17} />
                        <span>Ubicación en el Conjunto Residencial</span>
                      </h3>
                      <span className="protected-badge">
                        <Lock size={12} /> Asignación Oficial
                      </span>
                    </div>

                    <div className="form-row-3">
                      <div className="form-group">
                        <label className="input-label">Bloque / Torre</label>
                        <div className="input-with-icon-static">
                          <Building size={16} className="field-inner-icon" />
                          <input
                            type="text"
                            className="form-input locked with-icon"
                            value={
                              residencia.bloque
                                ? `Bloque ${residencia.bloque}`
                                : esAdmin
                                ? "Administración Central"
                                : "No asignado"
                            }
                            disabled
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="input-label">Interior</label>
                        <div className="input-with-icon-static">
                          <Layers size={16} className="field-inner-icon" />
                          <input
                            type="text"
                            className="form-input locked with-icon"
                            value={
                              residencia.interior
                                ? `Interior ${residencia.interior}`
                                : esAdmin
                                ? "Oficina 1"
                                : "No asignado"
                            }
                            disabled
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="input-label">Apartamento</label>
                        <div className="input-with-icon-static">
                          <Home size={16} className="field-inner-icon" />
                          <input
                            type="text"
                            className="form-input locked with-icon destaque-input"
                            value={
                              residencia.apartamento
                                ? `Apto ${residencia.apartamento}`
                                : esAdmin
                                ? "Sede Administrativa"
                                : "No asignado"
                            }
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bloque 2: Información Personal (Editable) */}
                  <div className="form-section">
                    <h3 className="section-title">
                      <User size={17} />
                      <span>Información Personal</span>
                    </h3>

                    <div className="form-row-2">
                      <div className="form-group">
                        <label className="input-label" htmlFor="nombres">
                          Nombres <span className="required">*</span>
                        </label>
                        <input
                          id="nombres"
                          type="text"
                          name="nombres"
                          placeholder="Tus nombres"
                          className={`form-input ${!isEditing ? "readonly" : ""}`}
                          value={formData.nombres}
                          onChange={handleChange}
                          disabled={!isEditing || saving}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="input-label" htmlFor="apellidos">
                          Apellidos <span className="required">*</span>
                        </label>
                        <input
                          id="apellidos"
                          type="text"
                          name="apellidos"
                          placeholder="Tus apellidos"
                          className={`form-input ${!isEditing ? "readonly" : ""}`}
                          value={formData.apellidos}
                          onChange={handleChange}
                          disabled={!isEditing || saving}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bloque 3: Datos de Identidad Institucional (Protegidos) */}
                  <div className="form-section">
                    <div className="section-title-with-badge">
                      <h3 className="section-title">
                        <Shield size={17} />
                        <span>Identificación Oficial</span>
                      </h3>
                      <span className="protected-badge">
                        <Lock size={12} /> Protegido
                      </span>
                    </div>

                    <div className="form-row-3">
                      <div className="form-group">
                        <label className="input-label">Tipo de Documento</label>
                        <input
                          type="text"
                          className="form-input locked"
                          value={formData.tipoDocumento || "Cédula de Ciudadanía"}
                          disabled
                        />
                      </div>

                      <div className="form-group">
                        <label className="input-label">Número de Documento</label>
                        <input
                          type="text"
                          className="form-input locked"
                          value={formData.numeroDocumento || "N/A"}
                          disabled
                        />
                      </div>

                      <div className="form-group">
                        <label className="input-label">Correo Electrónico</label>
                        <input
                          type="email"
                          className="form-input locked"
                          value={formData.email || ""}
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bloque 4: Seguridad (Contraseña) */}
                  <div className="form-section">
                    <h3 className="section-title">
                      <Lock size={17} />
                      <span>Seguridad de Acceso</span>
                    </h3>

                    {!isEditing ? (
                      <div className="security-static-box">
                        <div>
                          <strong>Contraseña de acceso</strong>
                          <p>••••••••••••••••</p>
                        </div>
                        <span className="security-hint">
                          Para modificar tu contraseña, activa el modo de edición arriba.
                        </span>
                      </div>
                    ) : (
                      <div className="form-row-2">
                        <div className="form-group">
                          <label className="input-label" htmlFor="contraseña">
                            Nueva Contraseña
                          </label>
                          <div className="password-wrapper">
                            <input
                              id="contraseña"
                              type={mostrarPassword ? "text" : "password"}
                              name="contraseña"
                              placeholder="Mínimo 6 caracteres"
                              className="form-input"
                              value={formData.contraseña}
                              onChange={handleChange}
                              disabled={saving}
                            />
                            <button
                              type="button"
                              className="btn-toggle-password"
                              onClick={() => setMostrarPassword(!mostrarPassword)}
                              tabIndex="-1"
                            >
                              {mostrarPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          <span className="field-hint">
                            Déjalo en blanco si deseas conservar la actual.
                          </span>
                        </div>

                        <div className="form-group">
                          <label className="input-label" htmlFor="confirmarContraseña">
                            Confirmar Nueva Contraseña
                          </label>
                          <input
                            id="confirmarContraseña"
                            type={mostrarPassword ? "text" : "password"}
                            name="confirmarContraseña"
                            placeholder="Repite la nueva contraseña"
                            className="form-input"
                            value={formData.confirmarContraseña}
                            onChange={handleChange}
                            disabled={saving}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botones de acción al editar */}
                  {isEditing && (
                    <div className="form-footer-actions">
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={handleCancelEdit}
                        disabled={saving}
                      >
                        <X size={16} />
                        <span>Cancelar</span>
                      </button>

                      <button
                        type="submit"
                        className="btn-save"
                        disabled={saving}
                      >
                        <Save size={16} />
                        <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
                      </button>
                    </div>
                  )}
                </form>
              </section>

            </div>
          )}

        </div>

        {/* Footer 100% Full-Width */}
        <Footer />
      </div>
    </>
  );
}

export default Perfil;