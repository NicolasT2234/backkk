import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  Mail,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Send
} from "lucide-react"
import logo from "../assets/img/Logo_SICRCB_dark_bg.png"
import "../assets/css/auth.css"
import api from "../services/api"

export default function Recuperar() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!email) {
      setError("Por favor ingresa tu correo electrónico registrado.")
      return
    }

    setIsLoading(true)

    try {
      await api.post("/auth/solicitar-recuperacion", { email })
      setIsSuccess(true)
    } catch (err) {
      console.error("Error al solicitar recuperación:", err)
      setError(
        err.response?.data?.error ||
        "No se pudo enviar el correo de recuperación. Verifica la dirección ingresada."
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
          <h1>Recuperar Contraseña</h1>
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
                  margin: "0 auto 1.25rem auto",
                  boxShadow: "0 4px 14px rgba(3, 84, 63, 0.15)"
                }}
              >
                <CheckCircle2 size={32} />
              </div>

              <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#8C3200", margin: "0 0 0.5rem 0" }}>
                ¡Correo de recuperación enviado!
              </h3>

              <p style={{ fontSize: "0.88rem", color: "#735340", lineHeight: "1.5", margin: "0 0 1.5rem 0" }}>
                Hemos enviado las instrucciones para restablecer tu contraseña a <strong>{email}</strong>. Revisa tu bandeja de entrada o carpeta de spam.
              </p>

              <button
                type="button"
                className="auth-submit-btn"
                onClick={() => navigate("/login")}
              >
                <KeyRound size={18} />
                <span>Ir al Inicio de Sesión</span>
              </button>

              <div style={{ marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setIsSuccess(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#F47820",
                    fontSize: "0.82rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  ¿No recibiste el correo? Reintentar
                </button>
              </div>
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
                Ingresa el correo electrónico asociado a tu cuenta y te enviaremos un enlace seguro para restablecer tu contraseña.
              </p>

              <div className="auth-form-group">
                <label className="auth-label">Correo Electrónico</label>
                <div className="auth-input-wrapper">
                  <Mail size={18} className="auth-field-icon" />
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Enviando enlace...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Enviar Enlace de Recuperación</span>
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