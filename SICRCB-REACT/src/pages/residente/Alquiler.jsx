import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import "../../assets/css/styles.css"
import "../../assets/css/alquiler.css"
import NavbarApp from "../../components/NavbarApp.jsx"
import Footer from "../../components/Footer.jsx"

function Alquiler() {

  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      navigate("/");
    }
  };

  const [formData, setFormData] = useState({
    idApartamento: "",
    fechaInicio: "",
    fechaFin: "",
    montoTotal: ""
  })

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccess("")
    setError("")
    setLoading(true)

    if (!formData.idApartamento || !formData.fechaInicio || !formData.fechaFin || !formData.montoTotal) {
      setError("Complete todos los campos obligatorios")
      setLoading(false)
      return
    }

    try {
      const res = await api.post("/alquileres", {
        idApartamento: parseInt(formData.idApartamento),
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        montoTotal: parseFloat(formData.montoTotal)
      })

      const id = res.data && res.data.id
      setSuccess(id ? `Reserva creada exitosamente (ID: ${id})` : "Reserva creada exitosamente")

      setFormData({ idApartamento: "", fechaInicio: "", fechaFin: "", montoTotal: "" })
    } catch (err) {
      console.error("Error creating reservation:", err)
      const serverMsg = err.response?.data?.message || err.response?.data || err.message
      setError(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <NavbarApp onLogout={handleLogout} />
      <div className="alquiler-page">
        <div className="titulo">
          <h1>ALQUER</h1>
        </div>

        <div className="subtitulo">
          <span className="subtitulo-banda">Salón Comunal y Sillas</span>
        </div>

        <div className="page-layout">

          <div className="a-noticia side-card" aria-hidden="false">
            <h6>Recomendaciones</h6>
            <hr />
            <p>Llega 15 minutos antes para recibir las llaves y revisar el espacio.</p>
            <p>Las sillas deben devolverse limpias y en el mismo lugar donde se recogieron.</p>
            <p>Reporta cualquier daño antes de finalizar tu reserva.</p>
          </div>

          <div className="panel-container">
            <div className="a-noticia panel">

              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">ID del Apartamento</label>
                    <input
                      type="number"
                      placeholder="Ej: 101"
                      className="input"
                      value={formData.idApartamento}
                      onChange={(e) => setFormData({...formData, idApartamento: e.target.value})}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Monto Total</label>
                    <input
                      type="number"
                      placeholder="Ej: 150000"
                      className="input"
                      value={formData.montoTotal}
                      onChange={(e) => setFormData({...formData, montoTotal: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Fecha y hora de inicio</label>
                    <input
                      type="datetime-local"
                      className="input"
                      required
                      value={formData.fechaInicio}
                      onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Fecha y hora de fin</label>
                    <input
                      type="datetime-local"
                      className="input"
                      required
                      value={formData.fechaFin}
                      onChange={(e) => setFormData({...formData, fechaFin: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-footer">
                  <button type="submit" className="btn-success" onClick={handleSubmit} disabled={loading}>
                    {loading ? "Procesando..." : "Crear Reserva"}
                  </button>
                  <p className="hint"><i>La reserva genera un ID al ser registrada</i></p>
                </div>

                {success && <p className="success">{success}</p>}
                {error && <p className="error">{error}</p>}
              </form>

            </div>
          </div>

          <div className="a-noticia side-card">
            <h6>Política de cancelación</h6>
            <hr />
            <p>Puedes cancelar o modificar tu reserva hasta 24 horas antes sin ningún costo.</p>
            <p>Cancelaciones el mismo día no generan reembolso.</p>
            <p>Escríbenos por PQRS si necesitas ayuda con tu reserva.</p>
          </div>

        </div>

        <Footer />
      </div>
    </>
  )
}

export default Alquiler