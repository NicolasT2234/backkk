import React, { useState, useEffect } from "react";
import api from "../../services/api";
import "../../assets/css/gestion-usuarios.css";
import NavbarApp from "../../components/NavbarApp.jsx";
import Footer from "../../components/Footer.jsx";

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [apartamentos, setApartamentos] = useState([]);
  const [tiposDoc, setTiposDoc] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [credencialGenerada, setCredencialGenerada] = useState(null);
  const [mensajeError, setMensajeError] = useState("");

  const [formData, setFormData] = useState({
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    idTipoDocumento: "",
    numeroDocumento: "",
    email: "",
    idApartamento: "",
  });

  // 1. Cargar usuarios con filtro por nombre, cédula o correo
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

  // 2. Cargar catálogos (apartamentos y tipos de documento)
  const cargarCatalogos = async () => {
    try {
      const res = await api.get("/admin/usuarios/catalogos");
      setApartamentos(res.data.apartamentos || []);
      setTiposDoc(res.data.tiposDocumento || []);
      if (res.data.tiposDocumento && res.data.tiposDocumento.length > 0) {
        setFormData((prev) => ({
          ...prev,
          idTipoDocumento: res.data.tiposDocumento[0].id,
        }));
      }
    } catch (err) {
      console.error("Error al cargar catálogos:", err);
    }
  };

  // Debounce para la barra de búsqueda
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      cargarUsuarios();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [busqueda]);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  // 3. Activar o desactivar usuario (toggle estado)
  const handleToggleEstado = async (idUsuario, estadoActual) => {
    const nuevoEstado = estadoActual === "Activo" ? "Inactivo" : "Activo";
    try {
      const res = await api.patch(`/admin/usuarios/${idUsuario}/estado`, {
        nuevoEstado,
      });
      if (res.status === 200) {
        cargarUsuarios();
      }
    } catch (err) {
      console.error("Error al actualizar estado:", err);
    }
  };

  // 4. Enviar formulario de registro con apartamento
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensajeError("");

    try {
      const res = await api.post("/admin/usuarios", formData);
      setCredencialGenerada(res.data.credenciales);
      cargarUsuarios();
      // Reiniciar formulario
      setFormData({
        primerNombre: "",
        segundoNombre: "",
        primerApellido: "",
        segundoApellido: "",
        idTipoDocumento: tiposDoc[0]?.id || "",
        numeroDocumento: "",
        email: "",
        idApartamento: "",
      });
    } catch (err) {
      console.error("Error en registro:", err);
      setMensajeError(
        err.response?.data?.error || "Ocurrió un error al registrar el residente."
      );
    }
  };

  return (
    <div className="gestion-usuarios-page">
      {/* Barra de navegación superior */}
      <NavbarApp />

      <main className="usuarios-main-container">
        {/* Banner Superior Hero */}
        <div className="usuarios-hero">
          <div className="hero-text">
            <h1>Gestión de Propietarios y Residentes</h1>
            <p>
              Registro formal, asignación de apartamentos y administración de
              estados en Casa Blanca
            </p>
          </div>
          <div className="hero-badge">
            <span>Total Residentes: {usuarios.length}</span>
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
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <button
            className="btn-nuevo-usuario"
            onClick={() => {
              setMostrarModal(true);
              setCredencialGenerada(null);
              setMensajeError("");
            }}
          >
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
                <th>Apartamento Asignado</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acción</th>
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
                usuarios.map((u) => (
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
                      {u.numero_apartamento ? (
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
                      <button
                        className={`btn-estado ${
                          u.estado_usuario === "Activo"
                            ? "btn-desactivar"
                            : "btn-activar"
                        }`}
                        onClick={() =>
                          handleToggleEstado(u.id_usuario, u.estado_usuario)
                        }
                      >
                        {u.estado_usuario === "Activo"
                          ? "Desactivar"
                          : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal de Registro y Asignación de Apartamento */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                {credencialGenerada
                  ? "Credenciales Generadas"
                  : "Registrar Nuevo Residente"}
              </h2>
              <button
                className="btn-close"
                onClick={() => setMostrarModal(false)}
              >
                ✕
              </button>
            </div>

            {credencialGenerada ? (
              <div className="credenciales-box">
                <p className="cred-instruction">
                  El usuario y su apartamento fueron registrados con éxito.
                  Entregue las siguientes credenciales al residente para su
                  primer inicio de sesión:
                </p>
                <div className="cred-data">
                  <p>
                    <strong>Correo Electrónico:</strong>{" "}
                    <span>{credencialGenerada.email}</span>
                  </p>
                  <p>
                    <strong>Contraseña Temporal:</strong>{" "}
                    <code className="password-code">
                      {credencialGenerada.contrasenaProvisional}
                    </code>
                  </p>
                </div>
                <button
                  className="btn-confirmar"
                  onClick={() => setMostrarModal(false)}
                >
                  Entendido y Finalizar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="modal-form">
                {mensajeError && (
                  <div className="form-error-banner">{mensajeError}</div>
                )}

                <div className="form-grid">
                  <div className="form-group">
                    <label>Tipo de Documento *</label>
                    <select
                      value={formData.idTipoDocumento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          idTipoDocumento: e.target.value,
                        })
                      }
                      required
                    >
                      {tiposDoc.map((td) => (
                        <option key={td.id} value={td.id}>
                          {td.sigla} - {td.nombre_documento}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Número de Documento (Cédula) *</label>
                    <input
                      type="number"
                      required
                      placeholder="Ej. 1012345678"
                      value={formData.numeroDocumento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          numeroDocumento: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Primer Nombre *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Carlos"
                      value={formData.primerNombre}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          primerNombre: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Segundo Nombre</label>
                    <input
                      type="text"
                      placeholder="Opcional"
                      value={formData.segundoNombre}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          segundoNombre: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Primer Apellido *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Gómez"
                      value={formData.primerApellido}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          primerApellido: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Segundo Apellido</label>
                    <input
                      type="text"
                      placeholder="Opcional"
                      value={formData.segundoApellido}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          segundoApellido: e.target.value,
                        })
                      }
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
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                <div className="form-group full-width">
                  <label>Asignar Apartamento *</label>
                  <select
                    value={formData.idApartamento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        idApartamento: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Seleccione una unidad habitacional...</option>
                    {apartamentos.map((apto) => (
                      <option key={apto.id} value={apto.id}>
                        {apto.bloque} — Interior {apto.interior} — Apto{" "}
                        {apto.numero_apto}
                      </option>
                    ))}
                  </select>
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
                    Guardar y Asignar
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