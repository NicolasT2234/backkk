import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../assets/css/styles.css"
import "../assets/css/recuperar.css"

function Recuperar() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email) {
      setMessage("Por favor ingresa tu correo electrónico.")
      return
    }
    setMessage("Por favor, revisa tu correo electrónico.")
  }

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <div className="auth-page">
      <div className="titulo">
        <h1>Recuperar Contraseña</h1>
      </div>

      <form className="formulario" onSubmit={handleSubmit}>
        <div className="campo">
          <h2>Correo electrónico</h2>
          <div className="input-wrapper">
            <input
              type="email"
              placeholder="Ingresa tu correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {message && <p style={{ color: "#8C3200", fontStyle: "normal", opacity: 1 }}>{message}</p>}

        <div className="contenedor">
          <button type="submit">
            Enviar
            <div className="arrow-wrapper">
              <div className="arrow"></div>
            </div>
          </button>
        </div>

        <div className="contenedor" style={{ marginTop: "1rem" }}>
          <button type="button" onClick={handleBack}>
            Volver
          </button>
        </div>
      </form>
    </div>
  )
}

export default Recuperar