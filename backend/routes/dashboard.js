const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');

// Dashboard routes - protected with token verification

// GET administrator statistics
router.get('/admin/stats', verificarToken, verificarRol(['Administrador']), async (req, res) => {
  try {
    // Get counts for various entities
    const [usuariosCount] = await pool.query('SELECT COUNT(*) as total FROM usuarios');
    const [propietariosCount] = await pool.query('SELECT COUNT(*) as total FROM propietario');
    const [apartamentosCount] = await pool.query('SELECT COUNT(*) as total FROM apartamento');
    const [multasCount] = await pool.query('SELECT COUNT(*) as total FROM multa');
    const [alquileresCount] = await pool.query('SELECT COUNT(*) as total FROM alquiler');
    const [pqrsCount] = await pool.query('SELECT COUNT(*) as total FROM queja_sugerencia');

    res.json({
      usuarios: usuariosCount[0].total,
      propietarios: propietariosCount[0].total,
      apartamentos: apartamentosCount[0].total,
      multas: multasCount[0].total,
      alquileres: alquileresCount[0].total,
      pqrs: pqrsCount[0].total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET resident dashboard data
router.get('/resident/dashboard', verificarToken, async (req, res) => {
  try {
    // Assuming we have the user ID from the token
    const userId = req.user.id;

    // Get user's apartments
    const [apartamentos] = await pool.query(`
      SELECT a.* FROM apartamento a
      JOIN propietario_gestion_apartamento pga ON a.id = pga.id_apartamento
      WHERE pga.id_propietario = ?
    `, [userId]);

    // Get user's pending PQRS
    const [pqrsPendientes] = await pool.query(`
      SELECT qs.* FROM queja_sugerencia qs
      JOIN pqr_especifica pe ON qs.id = pe.id_queja_sugerencia
      JOIN propietario_gestion_apartamento pga ON pe.id_apartamento = pga.id_apartamento
      WHERE pga.id_propietario = ? AND qs.estado = 'Pendiente'
    `, [userId]);

    // Get user's active multas
    const [multasActivas] = await pool.query(`
      SELECT m.* FROM multa m
      JOIN propietario_gestion_apartamento pga ON m.id_apartamento = pga.id_apartamento
      WHERE pga.id_propietario = ? AND m.estado = 'Activo'
    `, [userId]);

    // Get user's active alquileres
    const [alquileresActivos] = await pool.query(`
      SELECT a.* FROM alquiler a
      JOIN propietario_gestion_apartamento pga ON a.id_propietario = pga.id_propietario
      WHERE pga.id_propietario = ? AND a.estado = 'Activo'
    `, [userId]);

    res.json({
      apartamentos: apartamentos,
      pqrsPendientes: pqrsPendientes,
      multasActivas: multasActivas,
      alquileresActivos: alquileresActivos
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET mis-pqrs (user's PQRS)
router.get('/mis-pqrs', verificarToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [pqrs] = await pool.query(`
      SELECT qs.*, pe.id_apartamento, a.numero as apartamento_numero
      FROM queja_sugerencia qs
      JOIN pqr_especifica pe ON qs.id = pe.id_queja_sugerencia
      JOIN propietario_gestion_apartamento pga ON pe.id_apartamento = pga.id_apartamento
      JOIN apartamento a ON pe.id_apartamento = a.id
      WHERE pga.id_propietario = ?
      ORDER BY qs.fecha_creacion DESC
    `, [userId]);

    res.json(pqrs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET mis-multas (user's multas)
router.get('/mis-multas', verificarToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [multas] = await pool.query(`
      SELECT m.*, a.numero as apartamento_numero, tm.nombre as tipo_multa
      FROM multa m
      JOIN propietario_gestion_apartamento pga ON m.id_apartamento = pga.id_apartamento
      JOIN apartamento a ON pga.id_apartamento = a.id
      JOIN tipo_multa tm ON m.id_tipo_multa = tm.id
      WHERE pga.id_propietario = ?
      ORDER BY m.fecha_creacion DESC
    `, [userId]);

    res.json(multas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET mis-alquileres (user's alquileres)
router.get('/mis-alquileres', verificarToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [alquileres] = await pool.query(`
      SELECT a.*, sc.nombre as salon_comunal, p.nombre as propietario_nombre
      FROM alquiler a
      JOIN propietario_gestion_apartamento pga ON a.id_propietario = pga.id_propietario
      JOIN apartamento ap ON pga.id_apartamento = ap.id
      JOIN salon_comunal sc ON a.id_salon_comunal = sc.id
      JOIN propietario p ON pga.id_propietario = p.id
      WHERE pga.id_propietario = ?
      ORDER BY a.fecha_creacion DESC
    `, [userId]);

    res.json(alquileres);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;