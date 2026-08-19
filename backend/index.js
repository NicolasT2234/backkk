require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const pqrsRoutes = require('./routes/pqrs');
const noticiasRoutes = require('./routes/noticias');
const alquileresRoutes = require('./routes/alquileres');
const multasRoutes = require('./routes/multas');
const apartamentosRoutes = require('./routes/apartamentos');
const salonComunalRoutes = require('./routes/salonComunal');
const sillasRoutes = require('./routes/sillas');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas bajo /api
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/pqrs', pqrsRoutes);
app.use('/api/noticias', noticiasRoutes);
app.use('/api/alquileres', alquileresRoutes);
app.use('/api/multas', multasRoutes);
app.use('/api/apartamentos', apartamentosRoutes);
app.use('/api/salon-comunal', salonComunalRoutes);
app.use('/api/sillas', sillasRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'Backend SICRCB funcionando' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});