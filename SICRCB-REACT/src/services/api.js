import axios from "axios"

const api = axios.create({
  baseURL: "/api",
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // 401: token expirado o inválido
      if (error.response.status === 401) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        // Redirigir a login
        window.location.href = "/login"
      }
      // 403: permisos insuficientes - dejar que el componente lo maneje
      // No hacemos nada aquí, dejamos que el error llegue al componente
    }
    return Promise.reject(error)
  }
)

export default api