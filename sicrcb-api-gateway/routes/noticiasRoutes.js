// sicrcb-api-gateway/routes/noticiasRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { verificarToken, verificarRol } = require('../middlewares/auth');

// ✅ Importa el controlador, NO la base de datos
const noticiasController = require('../controllers/noticiasController');

// Asegurar que exista la carpeta física para almacenar archivos subidos
const uploadDir = path.join(__dirname, '../uploads/noticias');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// 1. Ruta pública para las 3 noticias destacadas
router.get('/destacadas', noticiasController.listarDestacadas);

// 2. Rutas de Administrador
router.get('/', verificarToken, verificarRol('Administrador'), noticiasController.listarTodas);
router.get('/:id', verificarToken, verificarRol('Administrador'), noticiasController.obtenerPorId);
router.post('/', verificarToken, verificarRol('Administrador'), upload.single('archivo'), noticiasController.crear);
router.put('/:id', verificarToken, verificarRol('Administrador'), upload.single('archivo'), noticiasController.actualizar);
router.delete('/:id', verificarToken, verificarRol('Administrador'), noticiasController.eliminar);

module.exports = router;