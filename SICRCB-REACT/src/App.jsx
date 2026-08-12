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

function RutaPrivada({ children }) {
  const token = localStorage.getItem("token")
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/alquiler" element={<Alquiler />} />
      <Route path="/multas" element={<Multas />} />
      <Route path="/noticias" element={<Noticias />} />
      <Route path="/pqrs" element={<Pqrs />} />
      <Route path="/admin_pqrs" element={<Admin_Pqrs />} />
      <Route path="/recuperar" element={<Recuperar />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/residente-dashboard" element={<ResidenteDashboard />} />
    </Routes>
  )
}

export default App