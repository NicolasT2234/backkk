import { useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import {
  Lock,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound
} from "lucide-react"
import logo from "../../assets/img/Logo_SICRCB_dark_bg.png"
import "../../assets/css/auth.css"
import api from "../../services/api"

export default function RestablecerPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!token) {
      setError("El enlace de recuperación es inválido o no incluye el token requerido.")
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden. Por favor verifícalas.")
      return
    }

    setIsLoading(true)

    try {
      await api.post("/auth/restablecer-password", {
        token,
        nuevaPassword: password
      })
      setIsSuccess(true)
    } catch (err) {
      console.error("Error al restablecer contraseña:", err)
      setError(
        err.response?.data?.error ||
        "No fue posible restablecer la contraseña. El enlace puede haber expirado."
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="sicrcb-auth-page">
      <div className="auth-top-nav">
        <Link to="/login" className="auth-back-btn">
          <ArrowLeft size={16} />
          <span>Volver al inicio de sesión</span>
        </Link>
      </div>

      <div className="sicrcb-auth-card">
        <div className="auth-card-header">
          <div className="auth-logo-badge">
            <img src={logo} alt="Logo SICRCB" />
          </div>
          <h1>Restablecer Contraseña</h1>
          <p>Conjunto Residencial Casa Blanca</p>
        </div>

        <div className="auth-card-body">
          {isSuccess ? (
            <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "#def7ec",
                  color: "#03543f",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.25rem auto"
                }}
              >
                <CheckCircle2 size={32} />
              </div>

              <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#8C3200", margin: "0 0 0.5rem 0" }}>
                ¡Contraseña restablecida con éxito!
              </h3>

              <p style={{ fontSize: "0.88rem", color: "#735340", lineHeight: "1.5", margin: "0 0 1.5rem 0" }}>
                Tu contraseña ha sido actualizada. Ya puedes acceder al sistema con tus nuevas credenciales.
              </p>

              <button
                type="button"
                className="auth-submit-btn"
                onClick={() => navigate("/login")}
              >
                <KeyRound size={18} />
                <span>Iniciar Sesión Ahora</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="auth-alert-banner alert-error" style={{ marginBottom: "1rem" }}>
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <p style={{ fontSize: "0.88rem", color: "#735340", margin: "0 0 1.5rem 0", lineHeight: "1.5" }}>
                Ingresa y confirma tu nueva contraseña de acceso a continuación.
              </p>

              <div className="auth-form-group">
                <label className="auth-label">Nueva Contraseña</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-field-icon" />
                  <input
                    type="password"
                    className="auth-input"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="auth-form-group" style={{ marginTop: "1rem" }}>
                <label className="auth-label">Confirmar Nueva Contraseña</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-field-icon" />
                  <input
                    type="password"
                    className="auth-input"
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                style={{ marginTop: "1.5rem" }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Guardando cambios...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={18} />
                    <span>Actualizar Contraseña</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}