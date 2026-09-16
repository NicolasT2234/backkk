// sicrcb-api-gateway/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// 1. IMPORTAR EL ARCHIVO DE RUTAS:
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const multasRoutes = require('./routes/multasRoutes');
const pqrsRoutes = require('./routes/pqrsRoutes');
const alquileresRoutes = require('./routes/alquileresRoutes');
const noticiasRoutes = require('./routes/noticiasRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminUsuariosRoutes = require('./routes/adminUsuariosRoutes');
const apartamentosRoutes = require('./routes/apartamentosRoutes');
const tiposMultaRoutes = require('./routes/tiposMultaRoutes');
const reportesRoutes = require('./routes/reportesRoutes');



const app = express();

// Middlewares requeridos antes de las rutas
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 2. CONECTAR LAS RUTAS CON EL PREFIJO '/api/auth':
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/multas', multasRoutes);
app.use('/api/pqrs', pqrsRoutes);
app.use('/api/alquileres', alquileresRoutes);
app.use('/api/noticias', noticiasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin/usuarios', adminUsuariosRoutes);
app.use('/api/apartamentos', apartamentosRoutes);
app.use('/api/tipos_multa', tiposMultaRoutes);
app.use('/api/reportes', reportesRoutes);

// Puerto y arranque
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});