import React from "react"
import "../assets/css/footer.css"

function Footer({
  nombreAdministracion = "Conjunto Residencial · Oficina de administración",
  horario = "Lunes a viernes, 8:00 a.m. – 5:00 p.m.",
  correo = "administracion@conjunto.com",
  telefono = "(601) 000 0000",
  mensajeUrgencia = "Comunícate directamente con portería para casos que requieran atención inmediata.",
  style = {}
}) {
  return (
    <footer className="app-footer" style={style}>
      <div className="footer-inner">
        <div className="footer-container">
        <div className="footer-brand">
          <span className="footer-brand-title">SICRCB</span>
          <span className="footer-brand-subtitle">Sistema de Información para la Gestión de Conjuntos Residenciales</span>
        </div>

        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-col-header">
              <span className="footer-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
                </svg>
              </span>
              <h6>Administración</h6>
            </div>
            <p>{nombreAdministracion}</p>
            <p className="footer-with-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
              </svg>
              {horario}
            </p>
          </div>

          <div className="footer-col">
            <div className="footer-col-header">
              <span className="footer-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0-.83.67-1.5 1.5-1.5h16.5c.83 0 1.5.67 1.5 1.5v10.5c0 .83-.67 1.5-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V6.75z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 7l9.5 6.5L21.5 7" />
                </svg>
              </span>
              <h6>Contacto</h6>
            </div>
            <a className="footer-with-icon footer-link" href={`mailto:${correo}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0-.83.67-1.5 1.5-1.5h16.5c.83 0 1.5.67 1.5 1.5v10.5c0 .83-.67 1.5-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V6.75z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 7l9.5 6.5L21.5 7" />
              </svg>
              {correo}
            </a>
            <a className="footer-with-icon footer-link" href={`tel:${telefono.replace(/[^\d+]/g, "")}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h1.5a1.5 1.5 0 001.5-1.5v-2.36a1 1 0 00-.757-.97l-4.11-1.028a1 1 0 00-.986.263l-1.293 1.293a11.25 11.25 0 01-5.25-5.25l1.293-1.293a1 1 0 00.263-.986L8.28 3.007a1 1 0 00-.97-.757H4.5a1.5 1.5 0 00-1.5 1.5v2.25z" />
              </svg>
              {telefono}
            </a>
          </div>

          <div className="footer-col">
            <div className="footer-col-header">
              <span className="footer-icon footer-icon-alert">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </span>
              <h6>¿Necesitas ayuda urgente?</h6>
            </div>
            <p>{mensajeUrgencia}</p>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} SICRCB · Todos los derechos reservados</span>
        </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer