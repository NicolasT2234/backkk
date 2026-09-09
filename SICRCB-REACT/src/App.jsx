import { Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/shared/Login"
import Registro from "./pages/shared/Registro"
import Alquiler from "./pages/residente/Alquiler"
import Multas from "./pages/admin/Multas"
import Noticias from "./pages/admin/Noticias"
import Dashboard from "./pages/admin/Dashboard"
import Pqrs from "./pages/residente/Pqrs"
import Recuperar from "./pages/Recuperar"
import Home from "./pages/Home"
import Perfil from "./pages/Perfil"
import Admin_Pqrs from "./pages/admin/Admin_Pqrs"
import ResidenteDashboard from "./pages/residente/ResidenteDashboard.jsx"
import AlquilerAdmin from "./pages/admin/Alquiler-admin.jsx"
import MultaResidente from "./pages/residente/Multa-Residente.jsx"
import NoticiasResi from "./pages/residente/Noticias_resi.jsx"
import { useAuth } from "./context/AuthContext"

function RutaPrivada({ children, rolesPermitidos = [] }) {
  const { user, loading } = useAuth()

  if (loading) {
    // While checking auth, treat as unauthenticated to avoid showing protected content
    return <Navigate to="/login" />
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (rolesPermitidos.length === 0) {
    return children
  }

  const userRole = user.rol?.toLowerCase() || ''
  const hasPermission = rolesPermitidos.some(role => role.toLowerCase() === userRole)

  if (!hasPermission) {
    if (userRole === 'administrador') {
      return <Navigate to="/dashboard" />
    } else {
      return <Navigate to="/residente-dashboard" />
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
      {/* Rutas públicas */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/recuperar" element={<Recuperar />} />
      <Route path="/perfil" element={<Perfil />} />

      {/* Rutas compartidas por rol - mismo path, componente distinto */}
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

      {/* Rutas exclusivas de residente (Propietario) */}
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

      {/* Rutas exclusivas de administrador */}
      <Route path="/dashboard" element={
        <RutaPrivada rolesPermitidos={['administrador']}>
          <Dashboard />
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
    </Routes>
  )
}

export default App