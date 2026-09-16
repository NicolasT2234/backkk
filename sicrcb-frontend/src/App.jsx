import { Routes, Route, Navigate } from "react-router-dom"

// Páginas en src/pages/
import Home from "./pages/Home"
import Perfil from "./pages/Perfil"
import Recuperar from "./pages/Recuperar"

// Páginas en src/pages/shared/
import Login from "./pages/shared/Login"
import RestablecerPassword from "./pages/shared/RestablecerPassword"

// Páginas de Residente (src/pages/residente/)
import Alquiler from "./pages/residente/Alquiler"
import Pqrs from "./pages/residente/Pqrs"
import ResidenteDashboard from "./pages/residente/ResidenteDashboard.jsx"
import MultaResidente from "./pages/residente/Multa-Residente.jsx"
import NoticiasResi from "./pages/residente/Noticias_resi.jsx"

// Páginas de Administración (src/pages/admin/)
import Dashboard from "./pages/admin/Dashboard"
import Multas from "./pages/admin/Multas"
import Noticias from "./pages/admin/Noticias"
import AlquilerAdmin from "./pages/admin/Alquiler-admin.jsx"
import Admin_Pqrs from "./pages/admin/Admin_Pqrs"
import GestionUsuarios from "./pages/admin/GestionUsuarios.jsx"

import { useAuth } from "./context/AuthContext"

function RutaPrivada({ children, rolesPermitidos = [] }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#fff3e0",
        color: "#8C3200",
        fontFamily: "Verdana, Geneva, Tahoma, sans-serif"
      }}>
        <h3>Cargando sesión...</h3>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (rolesPermitidos.length === 0) {
    return children
  }

  const userRole = user.rol?.toLowerCase() || ''
  const hasPermission = rolesPermitidos.some(role => role.toLowerCase() === userRole)

  if (!hasPermission) {
    if (userRole === 'administrador') {
      return <Navigate to="/dashboard" replace />
    } else {
      return <Navigate to="/residente-dashboard" replace />
    }
  }

  return children
}

function MultasPorRol() {
  const { user } = useAuth()
  return user && user.rol?.toLowerCase() === 'administrador' ? <Multas /> : <MultaResidente />
}

function NoticiasPorRol() {
  const { user } = useAuth()
  return user && user.rol?.toLowerCase() === 'administrador' ? <Noticias /> : <NoticiasResi />
}

function AlquilerPorRol() {
  const { user } = useAuth()
  return user && user.rol?.toLowerCase() === 'administrador' ? <AlquilerAdmin /> : <Alquiler />
}

function App() {
  return (
    <Routes>
      {/* ============================== */}
      {/* RUTAS PÚBLICAS                */}
      {/* ============================== */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      
      {/* Recuperación de Contraseña */}
      <Route path="/recuperar" element={<Recuperar />} />
      <Route path="/restablecer-password" element={<RestablecerPassword />} />

      {/* Perfil del Usuario Autenticado */}
      <Route path="/perfil" element={
        <RutaPrivada>
          <Perfil />
        </RutaPrivada>
      } />

      {/* ============================== */}
      {/* RUTAS COMPARTIDAS POR ROL      */}
      {/* ============================== */}
      <Route path="/multas" element={
        <RutaPrivada rolesPermitidos={['administrador', 'propietario']}>
          <MultasPorRol />
        </RutaPrivada>
      } />
      <Route path="/noticias" element={
        <RutaPrivada rolesPermitidos={['administrador', 'propietario']}>
          <NoticiasPorRol />
        </RutaPrivada>
      } />
      <Route path="/alquiler" element={
        <RutaPrivada rolesPermitidos={['administrador', 'propietario']}>
          <AlquilerPorRol />
        </RutaPrivada>
      } />

      {/* ============================== */}
      {/* RUTAS DE RESIDENTE            */}
      {/* ============================== */}
      <Route path="/pqrs" element={
        <RutaPrivada rolesPermitidos={['propietario']}>
          <Pqrs />
        </RutaPrivada>
      } />
      <Route path="/residente-dashboard" element={
        <RutaPrivada rolesPermitidos={['propietario']}>
          <ResidenteDashboard />
        </RutaPrivada>
      } />

      {/* ============================== */}
      {/* RUTAS DE ADMINISTRACIÓN       */}
      {/* ============================== */}
      <Route path="/dashboard" element={
        <RutaPrivada rolesPermitidos={['administrador']}>
          <Dashboard />
        </RutaPrivada>
      } />
      <Route path="/admin/usuarios" element={
        <RutaPrivada rolesPermitidos={['administrador']}>
          <GestionUsuarios />
        </RutaPrivada>
      } />
      <Route path="/admin/noticias" element={
        <RutaPrivada rolesPermitidos={['administrador']}>
          <Noticias />
        </RutaPrivada>
      } />
      <Route path="/admin/alquiler" element={
        <RutaPrivada rolesPermitidos={['administrador']}>
          <AlquilerAdmin />
        </RutaPrivada>
      } />
      <Route path="/admin/pqrs" element={
        <RutaPrivada rolesPermitidos={['administrador']}>
          <Admin_Pqrs />
        </RutaPrivada>
      } />
      <Route path="/admin_pqrs" element={
        <RutaPrivada rolesPermitidos={['administrador']}>
          <Admin_Pqrs />
        </RutaPrivada>
      } />

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App