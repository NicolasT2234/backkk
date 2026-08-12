import axios from "axios"

// json-server-auth corre en el puerto 3001 (ver server.js)
const api = axios.create({
  baseURL: "http://localhost:3001",
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
