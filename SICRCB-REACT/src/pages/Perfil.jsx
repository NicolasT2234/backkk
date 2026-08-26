import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "../assets/css/styles.css"
import NavbarApp from "../components/NavbarApp.jsx"
import api from "../services/api"

function Perfil() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    numeroDocumento: "",
    tipoDocumento: "",
    celular: "",
    contraseña: ""
  })

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/usuarios/me")
        const userData = response.data
        setUsuario(userData)
        setFormData({
          nombres: userData.nombres || "",
          apellidos: userData.apellidos || "",
          email: userData.email || "",
          numeroDocumento: userData.numeroDocumento || "",
          tipoDocumento: userData.tipoDocumento || "",
          celular: userData.celular || "",
          contraseña: ""  // Don't pre-fill password
        })
        // Also update localStorage with fresh data
        localStorage.setItem("user", JSON.stringify(userData))
      } catch (err) {
        console.error("Error fetching user data:", err)
        setError("No se pudo cargar la información del usuario")
        // Fallback to localStorage
        const userFromStorage = localStorage.getItem("user")
        if (userFromStorage) {
          const userData = JSON.parse(userFromStorage)
          setUsuario(userData)
          setFormData({
            nombres: userData.nombres || "",
            apellidos: userData.apellidos || "",
            email: userData.email || "",
            numeroDocumento: userData.numeroDocumento || "",
            tipoDocumento: userData.tipoDocumento || "",
            celular: userData.celular || "",
            contraseña: ""  // Don't pre-fill password
          })
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isEditing) {
      setIsEditing(true)
      return
    }

    try {
      // Prepare payload: convert empty strings to null for text fields
      // Hash password if provided (backend will hash with SHA2(?, 256))
      const payload = {
        nombres: formData.nombres === "" ? null : formData.nombres,
        apellidos: formData.apellidos === "" ? null : formData.apellidos,
        numeroDocumento: formData.numeroDocumento === "" ? null : formData.numeroDocumento,
        tipoDocumento: formData.tipoDocumento === "" ? null : formData.tipoDocumento,
        celular: formData.celular === "" ? null : formData.celular,
        email: formData.email === "" ? null : formData.email,
      }

      // Only add password to payload if it's provided and not empty
      if (formData.contraseña && formData.contraseña.trim() !== "") {
        payload.contraseña = formData.contraseña
      }

      const response = await api.put(`/usuarios/me`, payload)
      const updatedUser = { ...usuario, ...response.data }
      setUsuario(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setIsEditing(false)
      setError(null)
      alert("Perfil actualizado correctamente")
    } catch (error) {
      console.error("Error al actualizar el perfil:", error)
      setError("No se pudo guardar el perfil. Intente de nuevo.")
      alert("No se pudo guardar el perfil. Intente de nuevo.")
    }
  }

  if (loading) {
    return (
      <>
        <NavbarApp onLogout={handleLogout} />
        <div className="titulo">
          <h1>PERFIL DE USUARIO</h1>
        </div>
        <p style={{ textAlign: "center", marginTop: "20px" }}>Cargando información...</p>
      </>
    )
  }

  if (!usuario) {
    return (
      <>
        <NavbarApp onLogout={handleLogout} />
        <div className="titulo">
          <h1>PERFIL DE USUARIO</h1>
        </div>
        <p style={{ textAlign: "center", marginTop: "20px" }}>Error al cargar la información</p>
      </>
    )
  }

  return (
    <>
      <NavbarApp onLogout={handleLogout} />
      <div className="alquiler-page">
        <div className="titulo">
          <h1>PERFIL DE USUARIO</h1>
        </div>

        <div className="subtitulo">
          <span className="subtitulo-banda">Información Personal</span>
        </div>

        <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
          <form className="a-noticia" style={{ maxWidth: "500px", width: "100%" }} onSubmit={handleSubmit}>
            <legend>Datos Personales</legend>
            <hr />

            <label className="form-label">Nombre</label>
            <input
              type="text"
              name="nombres"
              placeholder="Nombres"
              className="input"
              value={formData.nombres}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <hr />

            <label className="form-label">Apellido</label>
            <input
              type="text"
              name="apellidos"
              placeholder="Apellidos"
              className="input"
              value={formData.apellidos}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <hr />

            <label className="form-label">Correo Electrónico</label>
            <input
              type="email"
              name="email"
              placeholder="Correo"
              className="input"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <hr />

            <label className="form-label">Tipo de Documento</label>
            <select
              className="input"
              required
              disabled={!isEditing}
              value={formData.tipoDocumento}
              onChange={(e) => setFormData({ ...formData, tipoDocumento: e.target.value })}
            >
              <option value="">Seleccione Tipo de Documento</option>
              <option value="Cédula de ciudadanía">Cédula de ciudadanía</option>
              <option value="Cédula de extranjería">Cédula de extranjería</option>
              <option value="Número de seguro social">Número de seguro social</option>
            </select>
            <hr />

            <label className="form-label">Número de Documento</label>
            <input
              type="text"
              name="numeroDocumento"
              placeholder="Número de Documento"
              className="input"
              value={formData.numeroDocumento}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <hr />

            <label className="form-label">Celular</label>
            <input
              type="text"
              name="celular"
              placeholder="Celular"
              className="input"
              value={formData.celular}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <hr />

            <label className="form-label">Contraseña (dejar vacío para no cambiar)</label>
            <input
              type="password"
              name="contraseña"
              placeholder="Nueva contraseña"
              className="input"
              value={formData.contraseña}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <hr />

            <button
              type="submit"
              className="btn-success"
            >
              {isEditing ? "Guardar Cambios" : "Editar Perfil"}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

export default Perfil