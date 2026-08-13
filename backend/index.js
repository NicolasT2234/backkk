import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './db.js';

// Import routes
import usuarioRoutes from './routes/usuarios.js';
import rolRoutes from './routes/roles.js';
import tipoDocumentoRoutes from './routes/tipoDocumentos.js';
import userDataRoutes from './routes/userData.js';
import administradorRoutes from './routes/administradores.js';
import propietarioRoutes from './routes/propietarios.js';
import bloqueRoutes from './routes/bloques.js';
import interiorRoutes from './routes/interiores.js';
import apartamentoRoutes from './routes/apartamentos.js';
import propietarioGestionApartamentoRoutes from './routes/propietarioGestionApartamento.js';
import quejaSugerenciaRoutes from './routes/quejaSugerencia.js';
import tipoMultaRoutes from './routes/tipoMulta.js';
import multaRoutes from './routes/multas.js';
import pqrEspecificaRoutes from './routes/pqrEspecifica.js';
import noticiaRoutes from './routes/noticias.js';
import salonComunalRoutes from './routes/salonComunal.js';
import sillaRoutes from './routes/sillas.js';
import alquilerRoutes from './routes/alquileres.js';
import alquilerSillaRoutes from './routes/alquilerSilla.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Backend del Sistema de Gestión de Comunidad está funcionando');
});

// API routes
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/tipo-documentos', tipoDocumentoRoutes);
app.use('/api/user-data', userDataRoutes);
app.use('/api/administradores', administradorRoutes);
app.use('/api/propietarios', propietarioRoutes);
app.use('/api/bloques', bloqueRoutes);
app.use('/api/interiores', interiorRoutes);
app.use('/api/apartamentos', apartamentoRoutes);
app.use('/api/propietario-gestion-apartamento', propietarioGestionApartamentoRoutes);
app.use('/api/quejas-sugerencias', quejaSugerenciaRoutes);
app.use('/api/tipo-multa', tipoMultaRoutes);
app.use('/api/multas', multaRoutes);
app.use('/api/pqr-especifica', pqrEspecificaRoutes);
app.use('/api/noticias', noticiaRoutes);
app.use('/api/salon-comunal', salonComunalRoutes);
app.use('/api/sillas', sillaRoutes);
app.use('/api/alquileres', alquilerRoutes);
app.use('/api/alquiler-silla', alquilerSillaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor del backend escuchando en http://localhost:${PORT}`);
});