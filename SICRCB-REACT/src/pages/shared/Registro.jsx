import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  User,
  CreditCard,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserCheck
} from "lucide-react"
import api from "../../services/api"
import logo from "../../assets/img/Logo_SICRCB_dark_bg.png"
import "../../assets/css/auth.css"

function Registro() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    tipoDocumento: "",
    numeroDocumento: "",
    nombres: "",
    apellidos: "",
    correo: "",
    password: "",
    role: "user",
    celular: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      await api.post("/auth/registro", {
        email: formData.correo,
        contraseña: formData.password,
        nombre: formData.nombres,
        apellido: formData.apellidos,
        tipoDocumento: formData.tipoDocumento,
        numeroDocumento: formData.numeroDocumento,
        celular: formData.celular,
        rol: formData.role
      })

      setSuccess("¡Cuenta creada con éxito! Redirigiendo al inicio de sesión...")

      setFormData({
        tipoDocumento: "",
        numeroDocumento: "",
        nombres: "",
        apellidos: "",
        correo: "",
        password: "",
        role: "user",
        celular: "",
      })

      setTimeout(() => {
        navigate("/login")
      }, 1600)
    } catch (err) {
      console.error("Error en registro:", err)
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError("No se pudo completar el registro. Verifica los datos o intenta nuevamente.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="sicrcb-auth-page">
      {/* Botón Volver */}
      <div className="auth-top-nav">
        <Link to="/" className="auth-back-btn">
          <ArrowLeft size={16} />
          <span>Volver al inicio</span>
        </Link>
      </div>

      {/* Tarjeta de Registro */}
      <div className="sicrcb-auth-card auth-card-wide">
        <div className="auth-card-header">
          <div className="auth-logo-badge">
            <img src={logo} alt="Logo SICRCB" />
          </div>
          <h1>Registro de Residentes</h1>
          <p>Crea tu acceso al Conjunto Residencial Casa Blanca</p>
        </div>

        <div className="auth-card-body">
          {error && (
            <div className="auth-alert-banner alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="auth-alert-banner alert-success">
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Fila 1: Documento (Tipo + Número) */}
            <div className="auth-row-2col">
              <div className="auth-form-group">
                <label className="auth-label">Tipo de Documento</label>
                <div className="auth-input-wrapper">
                  <CreditCard size={18} className="auth-field-icon" />
                  <select
                    name="tipoDocumento"
                    className="auth-input"
                    value={formData.tipoDocumento}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecciona tipo</option>
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="CE">Cédula de Extranjería</option>
                    <option value="TI">Tarjeta de Identidad</option>
                    <option value="PAS">Pasaporte</option>
                  </select>
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Número de Documento</label>
                <div className="auth-input-wrapper">
                  <CreditCard size={18} className="auth-field-icon" />
                  <input
                    type="text"
                    name="numeroDocumento"
                    className="auth-input"
                    placeholder="Ej. 1020304050"
                    value={formData.numeroDocumento}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Fila 2: Nombres y Apellidos */}
            <div className="auth-row-2col">
              <div className="auth-form-group">
                <label className="auth-label">Nombres</label>
                <div className="auth-input-wrapper">
                  <User size={18} className="auth-field-icon" />
                  <input
                    type="text"
                    name="nombres"
                    className="auth-input"
                    placeholder="Tus nombres"
                    value={formData.nombres}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Apellidos</label>
                <div className="auth-input-wrapper">
                  <User size={18} className="auth-field-icon" />
                  <input
                    type="text"
                    name="apellidos"
                    className="auth-input"
                    placeholder="Tus apellidos"
                    value={formData.apellidos}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Fila 3: Correo Electrónico y Celular */}
            <div className="auth-row-2col">
              <div className="auth-form-group">
                <label className="auth-label">Correo Electrónico</label>
                <div className="auth-input-wrapper">
                  <Mail size={18} className="auth-field-icon" />
                  <input
                    type="email"
                    name="correo"
                    className="auth-input"
                    placeholder="ejemplo@correo.com"
                    value={formData.correo}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Número de Celular</label>
                <div className="auth-input-wrapper">
                  <Phone size={18} className="auth-field-icon" />
                  <input
                    type="tel"
                    name="celular"
                    className="auth-input"
                    placeholder="Ej. 3001234567"
                    value={formData.celular}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Fila 4: Contraseña y Rol */}
            <div className="auth-row-2col">
              <div className="auth-form-group">
                <label className="auth-label">Contraseña</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-field-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="auth-input"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Tipo de Usuario</label>
                <div className="auth-input-wrapper">
                  <UserCheck size={18} className="auth-field-icon" />
                  <select
                    name="role"
                    className="auth-input"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="user">Residente / Propietario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Botón Submit */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="auth-spinner" />
                  <span>Procesando registro...</span>
                </>
              ) : (
                <>
                  <UserCheck size={18} />
                  <span>Completar Registro</span>
                </>
              )}
            </button>
          </form>

          {/* Enlace a Login */}
          <div className="auth-card-footer">
            ¿Ya tienes una cuenta creada?
            <Link to="/login">Inicia sesión aquí</Link>
          </div>
        </div>
      </div>

      <div className="auth-page-copyright">
        © {new Date().getFullYear()} SICRCB · Conjunto Residencial Casa Blanca
      </div>
    </div>
  )
}

export default Registro