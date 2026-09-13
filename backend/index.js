require('dotenv').config();  
const express = require('express');  
const cors = require('cors');  
const cookieParser = require('cookie-parser');  
const path = require('path');  

// Importación de rutas
const authRoutes = require('./routes/auth');  
const usuariosRoutes = require('./routes/usuarios');  
const pqrsRoutes = require('./routes/pqrs');  
const noticiasRoutes = require('./routes/noticias');  
const alquileresRoutes = require('./routes/alquileres');  
const multasRoutes = require('./routes/multas');  
const tiposMultaRoutes = require('./routes/tipos_multa');  
const apartamentosRoutes = require('./routes/apartamentos');  
const salonComunalRoutes = require('./routes/salonComunal');  
const sillasRoutes = require('./routes/sillas');  
const dashboardRoutes = require('./routes/dashboard');  
const adminUsuariosRoutes = require('./routes/adminUsuarios'); // <-- Ruta de Administración de Usuarios

const app = express();  

// Centralized error handling middleware  
const errorHandler = (err, req, res, next) => {  
  console.error('Error:', err);  
  
  if (res.headersSent) {  
    return next(err);  
  }  
  
  res.status(500).json({ error: 'Error interno del servidor' });  
};  

// Middlewares globales
const corsOptions = {  
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',  
  credentials: true  
};  
app.use(cors(corsOptions));  
app.use(express.json());  
app.use(cookieParser());  

// Request logging middleware  
app.use((req, res, next) => {  
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);  
  next();  
});  

// Servir archivos estáticos  
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));  

// Rutas bajo /api  
app.use('/api/auth', authRoutes);  
app.use('/api/usuarios', usuariosRoutes);  
app.use('/api/pqrs', pqrsRoutes);  
app.use('/api/noticias', noticiasRoutes);  
app.use('/api/alquileres', alquileresRoutes);  
app.use('/api/multas', multasRoutes);  
app.use('/api/tipos_multa', tiposMultaRoutes);  
app.use('/api/apartamentos', apartamentosRoutes);  
app.use('/api/salon-comunal', salonComunalRoutes);  
app.use('/api/sillas', sillasRoutes);  
app.use('/api/dashboard', dashboardRoutes);  
app.use('/api/admin/usuarios', adminUsuariosRoutes); // <-- Montada bajo /api/admin/usuarios

// Error handling middleware  
app.use(errorHandler);  

// Ruta de prueba  
app.get('/', (req, res) => {  
  res.json({ message: 'Backend SICRCB funcionando' });  
});  

const PORT = process.env.PORT || 5000;  
app.listen(PORT, () => {  
  console.log(`Servidor ejecutándose en puerto ${PORT}`);  
});