import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "../assets/css/styles.css"
import NavbarApp from "../components/NavbarApp.jsx"
import api from "../services/api"

function Perfil() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    numeroDocumento: "",
    tipoDocumento: "",
    celular: ""
  })

  useEffect(() => {
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
        celular: userData.celular || ""
      })
    }
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

    const userId = usuario?.id ?? usuario?.userId
    if (!userId) {
      alert("No se pudo identificar el usuario. Vuelva a iniciar sesión.")
      return
    }

    try {
      const payload = {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        numeroDocumento: formData.numeroDocumento,
        tipoDocumento: formData.tipoDocumento,
        celular: formData.celular,
        email: formData.email,
      }

      const response = await api.put(`/users/${userId}`, payload)
      const updatedUser = { ...usuario, ...response.data }
      setUsuario(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setIsEditing(false)
      alert("Perfil actualizado correctamente")
    } catch (error) {
      console.error("Error al actualizar el perfil:", error)
      alert("No se pudo guardar el perfil. Intente de nuevo.")
    }
  }

  if (!usuario) {
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