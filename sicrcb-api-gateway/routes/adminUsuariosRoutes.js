// sicrcb-api-gateway/routes/adminUsuariosRoutes.js
const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/auth');
const adminUsuariosController = require('../controllers/adminUsuariosController');

// Blindaje de seguridad obligatorio para todas las rutas del panel
router.use(verificarToken, verificarRol('Administrador'));

router.get('/', adminUsuariosController.listarUsuarios);
router.get('/catalogos', adminUsuariosController.obtenerCatalogos);
router.post('/', adminUsuariosController.registrarResidente);
router.put('/:id', adminUsuariosController.actualizarResidente);
router.patch('/:id/estado', adminUsuariosController.cambiarEstado);

module.exports = router;