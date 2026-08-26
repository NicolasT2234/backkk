import { Navbar, Container, Nav } from "react-bootstrap"
import { useNavigate, useLocation } from "react-router-dom"
import logo from "../assets/img/Logo_SICRCB_dark_bg.png"
import "../assets/css/NavbarApp.css"

function NavbarApp({ onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => location.pathname === path
  const handleLogout = onLogout || (() => navigate("/"))

  return (
    <Navbar expand="lg" className="sicrcb-navbar">
      <Container fluid>
        <Navbar.Brand href="#" onClick={() => navigate("/dashboard")}>
          <img src={logo} alt="Logo" width="30" height="24" />
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbarSupportedContent" />
        <Navbar.Collapse id="navbarSupportedContent">
          <Nav className="me-auto mb-2 mb-lg-0">
            <Nav.Link
              className={isActive("/multas") ? "active" : ""}
              onClick={() => navigate("/multas")}
            >
              Multas
            </Nav.Link>
            <Nav.Link
              className={isActive("/noticias") ? "active" : ""}
              onClick={() => navigate("/noticias")}
            >
              Noticias
            </Nav.Link>
            <Nav.Link
              className={isActive("/alquiler") ? "active" : ""}
              onClick={() => navigate("/alquiler")}
            >
              Alquiler
            </Nav.Link>
            <Nav.Link
              className={isActive("/pqrs") ? "active" : ""}
              onClick={() => navigate("/pqrs")}
            >
              PQRS
            </Nav.Link>
            <Nav.Link onClick={handleLogout}>Cerrar Sesion</Nav.Link>
          </Nav>

          <Nav className="navbar-profile-area">
            <button
              type="button"
              className={`profile-btn ${isActive("/perfil") ? "active" : ""}`}
              onClick={() => navigate("/perfil")}
            >
              <span className="profile-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </span>
              Perfil
            </button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

export default NavbarApp