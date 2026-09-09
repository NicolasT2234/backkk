import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.PROD
    ? (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
    : '/api',
  withCredentials: true
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const url = error.response.config?.url || ""
      const isAuthCheck = url.includes("/usuarios/me") || url.includes("/auth/login")

      if (error.response.status === 401 && !isAuthCheck) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

export default api