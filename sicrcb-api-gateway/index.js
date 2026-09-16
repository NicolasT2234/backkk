require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// 1. CORS hacia React
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));


const CORE_URL = process.env.CORE_SERVICE_URL || 'http://localhost:5001';

// 2. Proxy para /api (concatenando /api al target para que no se pierda)
app.use('/api', createProxyMiddleware({
  target: `${CORE_URL}/api`,
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('[API GATEWAY] Error conectando con Backend Core:', err.code);
    res.status(503).json({
      error: 'Servicio no disponible',
      mensaje: 'El servidor de procesamiento se encuentra temporalmente inactivo.'
    });
  }
}));

// 3. Proxy para /uploads (archivos e imágenes)
app.use('/uploads', createProxyMiddleware({
  target: `${CORE_URL}/uploads`,
  changeOrigin: true
}));

app.get('/health', (req, res) => {
  res.json({ status: 'API Gateway en línea' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API Gateway escuchando en el puerto ${PORT}`);
});