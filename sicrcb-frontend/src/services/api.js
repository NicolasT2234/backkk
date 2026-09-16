import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Si el Core está caído y el Gateway devuelve 503
      if (error.response.status === 503) {
        alert(error.response.data?.mensaje || "El sistema central se encuentra en mantenimiento temporal.");
      }

      // Manejo de expiración de sesión (401)
      const url = error.response.config?.url || "";
      const isAuthCheck = url.includes("/usuarios/me") || url.includes("/auth/login");

      if (error.response.status === 401 && !isAuthCheck) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;