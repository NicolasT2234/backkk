import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import logo from "../assets/img/Logo_SICRCB_dark_bg.png"
import {
  LayoutDashboard,
  ReceiptText,
  Newspaper,
  CalendarDays,
  MessageSquareText,
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Home
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import "../assets/css/NavbarApp.css"

function NavbarApp({ onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  let authData = { user: null, logout: null }
  try {
    authData = useAuth()
  } catch (e) {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        authData.user = JSON.parse(storedUser)
      } catch (err) {
        authData.user = null
      }
    }
  }

  const { user, logout } = authData
  const userRole = (user?.rol || "").toLowerCase()
  const isAdmin = userRole.includes("admin") || userRole === "administrador"

  // Detección precisa de la ruta activa
  const isPathActive = (targetKey) => {
    const current = location.pathname.toLowerCase()
    switch (targetKey) {
      case "dashboard":
        return current === "/dashboard" || current === "/residente-dashboard"
      case "multas":
        return current.startsWith("/multas")
      case "noticias":
        return current.startsWith("/noticias")
      case "alquiler":
        return current.includes("alquiler")
      case "pqrs":
        return current.includes("pqrs")
      default:
        return current === targetKey
    }
  }

  const handleLogoutAction = () => {
    if (onLogout) {
      onLogout()
    } else if (logout) {
      logout()
      navigate("/")
    } else {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      navigate("/")
    }
  }

  const navItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      path: isAdmin ? "/dashboard" : "/residente-dashboard",
      icon: LayoutDashboard
    },
    {
      key: "multas",
      label: "Multas",
      path: "/multas",
      icon: ReceiptText
    },
    {
      key: "noticias",
      label: "Noticias",
      path: "/noticias",
      icon: Newspaper
    },
    {
      key: "alquiler",
      label: "Alquiler",
      path: isAdmin ? "/admin/alquiler" : "/alquiler",
      icon: CalendarDays
    },
    {
      key: "pqrs",
      label: "PQRS",
      path: isAdmin ? "/admin/pqrs" : "/pqrs",
      icon: MessageSquareText
    }
  ]

  const userInitial = user?.nombres ? user.nombres.charAt(0).toUpperCase() : (isAdmin ? "A" : "R")
  const displayName = user?.nombres ? user.nombres.split(" ")[0] : (isAdmin ? "Admin" : "Residente")

  return (
    <>
      <header className="sicrcb-navbar-header">
        <div className="sicrcb-navbar-container">
          {/* Logo / Brand */}
          <div
            className="sicrcb-brand"
            onClick={() => navigate(isAdmin ? "/dashboard" : "/residente-dashboard")}
            role="button"
            tabIndex={0}
          >
            <div className="brand-logo-wrapper">
              <img src={logo} alt="Logo SICRCB" className="brand-logo-img" />
            </div>
            <div className="brand-text-block">
              <span className="brand-title">SICRCB</span>
              <span className="brand-subtitle">Casa Blanca</span>
            </div>
          </div>

          {/* Navegación Desktop */}
          <nav className="sicrcb-desktop-nav" aria-label="Navegación principal">
            <ul className="sicrcb-nav-list">
              {navItems.map((item) => {
                const IconComponent = item.icon
                const active = isPathActive(item.key)
                return (
                  <li key={item.key} className="sicrcb-nav-item">
                    <button
                      type="button"
                      className={`sicrcb-nav-link ${active ? "active" : ""}`}
                      onClick={() => navigate(item.path)}
                    >
                      <IconComponent size={18} />
                      <span>{item.label}</span>
                      {active && <span className="active-pill-dot" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Acciones y Perfil */}
          <div className="sicrcb-actions-area">
            {/* Chip de usuario */}
            <div
              className="sicrcb-user-chip"
              onClick={() => navigate("/perfil")}
              title="Ir a mi perfil"
              role="button"
              tabIndex={0}
            >
              <div className="user-avatar">{userInitial}</div>
              <div className="user-info">
                <span className="user-name">{displayName}</span>
                <span className="user-badge">
                  {isAdmin ? <ShieldCheck size={11} /> : <Home size={11} />}
                  {isAdmin ? "Admin" : "Residente"}
                </span>
              </div>
            </div>

            {/* Botón Salir */}
            <button
              type="button"
              className="sicrcb-logout-btn"
              onClick={handleLogoutAction}
              title="Cerrar sesión"
            >
              <LogOut size={16} />
              <span>Salir</span>
            </button>

            {/* Botón Menú Móvil */}
            <button
              type="button"
              className="sicrcb-mobile-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menú móvil"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Drawer Móvil */}
      <div className={`sicrcb-drawer-overlay ${isMobileMenuOpen ? "open" : ""}`} onClick={() => setIsMobileMenuOpen(false)}>
        <aside className="sicrcb-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="drawer-header">
            <div className="drawer-brand">
              <img src={logo} alt="Logo SICRCB" width="32" height="26" />
              <span>SICRCB</span>
            </div>
            <button
              type="button"
              className="drawer-close-btn"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Cerrar menú"
            >
              <X size={20} stroke="#FFD0A0" />
            </button>
          </div>

          <div className="drawer-user-card">
            <div className="user-avatar">{userInitial}</div>
            <div>
              <strong>{displayName}</strong>
              <div style={{ fontSize: "0.75rem", color: "#FFD0A0" }}>
                {isAdmin ? "Administrador" : "Residente"}
              </div>
            </div>
          </div>

          <ul className="drawer-menu">
            {navItems.map((item) => {
              const IconComponent = item.icon
              const active = isPathActive(item.key)
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    className={`drawer-link ${active ? "active" : ""}`}
                    onClick={() => {
                      navigate(item.path)
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    <IconComponent size={20} />
                    <span>{item.label}</span>
                  </button>
                </li>
              )
            })}
            <li>
              <button
                type="button"
                className={`drawer-link ${location.pathname === "/perfil" ? "active" : ""}`}
                onClick={() => {
                  navigate("/perfil")
                  setIsMobileMenuOpen(false)
                }}
              >
                <User size={20} />
                <span>Mi Perfil</span>
              </button>
            </li>
          </ul>

          <div className="drawer-footer">
            <button type="button" className="drawer-logout-btn" onClick={handleLogoutAction}>
              <LogOut size={18} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}

export default NavbarApp