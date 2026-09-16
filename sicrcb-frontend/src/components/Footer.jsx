import React from "react"
import { useNavigate } from "react-router-dom"
import logo from "../assets/img/Logo_SICRCB_dark_bg.png"
import {
  Building2,
  Clock,
  Mail,
  Phone,
  ShieldAlert,
  ArrowUp,
  MapPin,
  ExternalLink,
  HelpCircle,
  FileCheck
} from "lucide-react"
import "../assets/css/footer.css"

function Footer({
  nombreAdministracion = "Conjunto Residencial Casa Blanca · Oficina de Administración",
  horario = "Lunes a Viernes, 8:00 a.m. – 5:00 p.m.",
  correo = "administracion@conjunto.com",
  telefono = "(601) 000 0000",
  telefonoPorteria = "(601) 000 0001",
  mensajeUrgencia = "Comunícate de inmediato con portería para emergencias, accesos especiales o incidentes 24/7.",
  style = {}
}) {
  const navigate = useNavigate()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <footer className="sicrcb-footer" style={style}>
      {/* Línea decorativa luminosa superior */}
      <div className="footer-glow-bar" />

      <div className="footer-main-wrapper">
        <div className="footer-container">
          <div className="footer-grid">
            
            {/* Columna 1: Identidad y Misión */}
            <div className="footer-col footer-col-brand">
              <div className="footer-brand-header">
                <div className="footer-logo-box">
                  <img src={logo} alt="Logo SICRCB" className="footer-logo-img" />
                </div>
                <div>
                  <span className="footer-brand-title">SICRCB</span>
                  <span className="footer-brand-tag">Casa Blanca</span>
                </div>
              </div>
              <p className="footer-brand-desc">
                Sistema Integral de Información y Gestión para la Comunidad del Conjunto Residencial Casa Blanca.
              </p>
              <div className="footer-status-badge">
                <span className="status-indicator-dot" />
                <span>Plataforma Residencial Activa</span>
              </div>
            </div>

            {/* Columna 2: Administración y Horarios */}
            <div className="footer-col">
              <div className="footer-col-title">
                <div className="col-title-icon">
                  <Building2 size={18} stroke="#FFD0A0" />
                </div>
                <h6>Administración</h6>
              </div>
              <ul className="footer-info-list">
                <li>
                  <MapPin size={16} className="info-icon" />
                  <span>{nombreAdministracion}</span>
                </li>
                <li>
                  <Clock size={16} className="info-icon" />
                  <span>{horario}</span>
                </li>
                <li>
                  <FileCheck size={16} className="info-icon" />
                  <span>Atención presencial y virtual</span>
                </li>
              </ul>
            </div>

            {/* Columna 3: Canales de Contacto */}
            <div className="footer-col">
              <div className="footer-col-title">
                <div className="col-title-icon">
                  <Mail size={18} stroke="#FFD0A0" />
                </div>
                <h6>Canales Directos</h6>
              </div>
              <div className="footer-contact-cards">
                <a href={`mailto:${correo}`} className="contact-card-link">
                  <Mail size={15} />
                  <div className="contact-card-text">
                    <small>Correo electrónico</small>
                    <span>{correo}</span>
                  </div>
                </a>
                <a href={`tel:${telefono.replace(/[^\d+]/g, "")}`} className="contact-card-link">
                  <Phone size={15} />
                  <div className="contact-card-text">
                    <small>Línea fija oficina</small>
                    <span>{telefono}</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Columna 4: Atención Urgente y Portería */}
            <div className="footer-col footer-col-alert">
              <div className="footer-alert-card">
                <div className="alert-card-header">
                  <div className="alert-badge-icon">
                    <ShieldAlert size={18} />
                  </div>
                  <h6>¿Atención Inmediata?</h6>
                </div>
                <p className="alert-card-desc">{mensajeUrgencia}</p>
                <a
                  href={`tel:${telefonoPorteria.replace(/[^\d+]/g, "")}`}
                  className="alert-porteria-btn"
                >
                  <Phone size={14} />
                  <span>Llamar a Portería</span>
                </a>
              </div>
            </div>

          </div>

          {/* Barra inferior de Copyright y Enlaces */}
          <div className="footer-bottom-bar">
            <div className="bottom-left">
              <span>© {new Date().getFullYear()} <strong>SICRCB</strong> · Conjunto Residencial Casa Blanca.</span>
              <span className="bottom-divider">|</span>
              <span className="bottom-legal">Todos los derechos reservados.</span>
            </div>

            <div className="bottom-right">
              <button
                type="button"
                className="footer-scroll-top-btn"
                onClick={scrollToTop}
                title="Volver arriba"
                aria-label="Volver arriba"
              >
                <span>Subir</span>
                <ArrowUp size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer