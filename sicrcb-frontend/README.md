# Proyecto Comunidad (React + Vite) — SICRCB

Conversión a React del proyecto HTML original (login, registro, multas, noticias, alquiler),
conectado a tu API real con json-server + json-server-auth.

## Estructura

```
backend/
  db.json          -> tu base de datos (users, multas, noticias, reservas)
  server.js         -> tu servidor json-server-auth (puerto 3001)
  package.json
src/
  assets/css/      -> estilos originales (alquiler.css, multas.css, noticias.css, styles.css)
  assets/img/      -> Logo_SICRCB.png
  components/      -> NavbarApp.jsx, ConfirmModal.jsx (compartidos por las 3 vistas internas)
  pages/           -> Login, Registro, Multas, Noticias, Alquiler
  services/        -> api.js (instancia de axios, baseURL http://localhost:3001)
  App.jsx          -> rutas con react-router-dom
  main.jsx         -> punto de entrada
public/
  uploads/         -> carpeta para imágenes/archivos referenciados (rutas tipo /uploads/...)
```

## Cómo correr todo

**1. Backend (API real):**
```bash
cd backend
npm install
node server.js
```
Esto levanta tu API en `http://localhost:3001` con los endpoints `/login`, `/register`,
`/multas`, `/noticias`, `/reservas`.

**2. Frontend (React):**
```bash
npm install
npm run dev
```

## Usuarios de prueba (de tu db.json)

| Rol  | Email                     | Password   |
|------|---------------------------|------------|
| ADMIN | admin@sicrcb.com         | admin123   |
| USER  | propietario@sicrcb.com   | user123    |

## Notas de la conversión (actualizadas a tu API real)

- `services/api.js` apunta a `http://localhost:3001` (puerto real de `server.js`).
- La vista "Alquiler" usa el endpoint **`/reservas`** (no `/alquiler`), con los campos
  `nombre_solicitante`, `tipo_alquiler`, `cantidad_sillas`, `fecha_inicio`, `fecha_fin`,
  `usuario_id`, tal como están en tu `db.json`.
- "Multas" usa `factura`, `fecha_publicacion`, `estado`, `usuario_id`.
- "Noticias" usa `archivo`, `fecha_publicacion` (no tiene `usuario_id` en tu esquema).
- Como json-server-auth no procesa archivos reales (solo JSON), los campos que antes eran
  `<input type="file">` (factura, archivo) ahora son campos de texto donde escribes la ruta
  (ej: `/uploads/multa_004.pdf`). Si más adelante quieres subir archivos de verdad, hace falta
  un endpoint propio en Express con `multer` que guarde en `public/uploads` — el backend de
  json-server-auth no lo soporta de forma nativa.
- El login guarda el usuario completo (`id`, `rol`, `nombre`, `avatar`, etc.) que devuelve
  json-server-auth en `localStorage.user`, y el `accessToken` en `localStorage.token`.
- Las rutas internas (`/multas`, `/noticias`, `/alquiler`) están protegidas con `RutaPrivada`
  en `App.jsx`: si no hay token, redirige a `/login`.

