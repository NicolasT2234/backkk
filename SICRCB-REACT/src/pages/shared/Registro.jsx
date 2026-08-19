import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import api from "../../services/api"
import "../../assets/css/styles.css"

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
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      await api.post("/auth/registro", {
        email: formData.correo,
        contraseña: formData.password,
        nombre: formData.nombres,
        apellido: formData.apellidos,
        telefono: formData.celular || null,
        direccion: null,
      })

      setSuccess("Usuario registrado correctamente")

      setFormData({
        ...formData,
        tipoDocumento: "",
        numeroDocumento: "",
        nombres: "",
        apellidos: "",
        correo: "",
        password: "",
        celular: "",
      })

      setTimeout(() => {
        navigate("/login")
      }, 1500)
    } catch (err) {
      console.error("Registration error:", err)
      if (err.response) {
        setError(err.response.data?.message || "Error en el registro")
      } else {
        setError("Error de conexión. Por favor inténtalo de nuevo.")
      }
    }
  }

  return (
    <div className="auth-page">
      <div className="text-center mb-4">
        <Link to="/" className="btn-volver">
          <ArrowLeft size={16} className="mr-2" />
          Volver al inicio
        </Link>
      </div>
      <div className="titulo">
        <h1>REGISTRO DE USUARIOS</h1>
      </div>

      <form onSubmit={handleSubmit} className="formulario">
        <div className="campo">
          <h2>TIPO DE DOCUMENTO</h2>
          <div className="input-wrapper">
            <select
              name="tipoDocumento"
              id="tipo-documento"
              value={formData.tipoDocumento}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione un tipo de documento</option>
              <option value="Cedula de ciudadania">Cédula de ciudadanía</option>
              <option value="Cedula de extranjeria">Cédula de extranjería</option>
              <option value="Numero de seguro social">Número de seguro social</option>
            </select>
          </div>
        </div>

        <div className="campo">
          <h2>NUMERO DE DOCUMENTO</h2>
          <div className="input-wrapper">
            <input
              type="number"
              placeholder="Ingrese el Numero de Documento"
              name="numeroDocumento"
              className="input"
              value={formData.numeroDocumento}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="campos-dobles">
          <div className="campo">
            <h2>NOMBRES</h2>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="Digite sus nombres"
                name="nombres"
                value={formData.nombres}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="campo">
            <h2>APELLIDOS</h2>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="Digite sus apellidos"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="campo">
          <h2>CORREO ELECTRONICO</h2>
          <div className="input-wrapper">
            <input
              type="email"
              placeholder="ejemplo@correo.com"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="campo">
          <h2>CONTRASE�ÑA</h2>
          <div className="input-wrapper">
            <input
              type="password"
              placeholder="Digite una contraseña"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="campo">
          <h2>ROL DE USUARIO</h2>
          <div className="input-wrapper">
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="user">Usuario Regular</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>

        <div className="campo">
          <h2>NUMERO CELULAR</h2>
          <div className="input-wrapper">
            <input
              type="number"
              placeholder="+57 123 456 7890"
              name="celular"
              value={formData.celular}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {error && <p style={{ color: "#8C3200", marginTop: "10px" }}>{error}</p>}
        {success && <p style={{ color: "#2e7d32", marginTop: "10px" }}>{success}</p>}

        <div className="contenedor">
          <button type="submit" className="btn-success">
            Registrarse
          </button>
        </div>

        <div className="iniciar-sesion">
          <h6>
            ¿Ya tienes una cuenta? <a href="/login" className="link">Inicia Sesión Aquí</a>
          </h6>
        </div>
      </form>
    </div>
  )
}

export default Registro