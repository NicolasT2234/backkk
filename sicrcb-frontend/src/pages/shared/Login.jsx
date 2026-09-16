import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ShieldCheck
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import api from "../../services/api"
import logo from "../../assets/img/Logo_SICRCB_dark_bg.png"
import "../../assets/css/auth.css"

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [correo, setCorreo] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await api.post("/auth/login", {
        email: correo.trim().toLowerCase(),
        contraseña: password.trim()
      })
      login(res.data.user)
      const userRole = (res.data.user?.rol || "").toLowerCase()
      const isAdmin = userRole.includes("admin") || userRole === "administrador"
      navigate(isAdmin ? "/dashboard" : "/residente-dashboard")
    } catch (err) {
      setError(
        err.response?.data?.error || 
        "Error al iniciar sesión. Verifica tus credenciales."
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="sicrcb-auth-page">
      <div className="auth-top-nav">
        <Link to="/" className="auth-back-btn">
          <ArrowLeft size={16} />
          <span>Volver al inicio</span>
        </Link>
      </div>

      <div className="sicrcb-auth-card">
        <div className="auth-card-header">
          <div className="auth-logo-badge">
            <img src={logo} alt="Logo SICRCB" />
          </div>
          <h1>Iniciar Sesión</h1>
          <p>Conjunto Residencial Casa Blanca</p>
        </div>

        <div className="auth-card-body">
          {error && (
            <div className="auth-alert-banner alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label className="auth-label">Correo Electrónico</label>
              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-field-icon" />
                <input
                  type="email"
                  className="auth-input"
                  placeholder="ejemplo@correo.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Contraseña</label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-field-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="Digita tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div className="auth-aux-links">
              <Link to="/recuperar" className="auth-forgot-link">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="auth-spinner" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* El registro fue retirado: solo el Administrador crea usuarios */}
        </div>
      </div>

      <div className="auth-page-copyright">
        © {new Date().getFullYear()} SICRCB · Sistema Integral de Conjuntos Residenciales
      </div>
    </div>
  )
}

export default Login