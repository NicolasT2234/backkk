const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// GET /multas (Directorio completo para Administrador)
router.get('/', verificarToken, verificarRol('Administrador'), async (req, res, next) => {
  try {
    const [multas] = await pool.query(
      `SELECT m.id, m.numero, m.nombre, m.descripcion, m.estado,
              b.nombre as bloque, i.numero as interior, ap.numero as numero_apartamento,
              tm.valor as monto,
              m.evidencia, m.id_apartamento, m.id_tipo_multa,
              tm.numero as numero_tipo_multa, tm.descripcion as descripcion_tipo_multa
       FROM multa m
       JOIN apartamento ap ON m.id_apartamento = ap.id
       JOIN interior i ON ap.id_interior = i.id
       JOIN bloque b ON i.id_bloque = b.id
       JOIN tipo_multa tm ON m.id_tipo_multa = tm.id
       ORDER BY m.estado ASC, m.id DESC`
    );
    res.json(multas);
  } catch (error) {
    console.error('Error al obtener multas:', error);
    next(error);
  }
});

// GET /multas/mis-multas (Para la vista de Residentes)
router.get('/mis-multas', verificarToken, async (req, res) => {
  try {
    const idUsuario = req.usuario.id;
    const [multas] = await pool.query(
      `SELECT m.id, m.numero, m.nombre, m.descripcion, m.estado, m.evidencia,
              b.nombre as bloque, i.numero as interior, ap.numero as numero_apartamento,
              tm.id as id_tipo_multa, tm.numero as numero_tipo_multa,
              tm.descripcion as descripcion_tipo_multa,
              tm.valor as monto
       FROM multa m
       JOIN apartamento ap ON m.id_apartamento = ap.id
       JOIN interior i ON ap.id_interior = i.id
       JOIN bloque b ON i.id_bloque = b.id
       JOIN tipo_multa tm ON m.id_tipo_multa = tm.id
       WHERE ap.id IN (
         SELECT pga.id_apartamento
         FROM propietario_gestion_apartamento pga
         JOIN propietario pt ON pga.id_propietario = pt.id
         JOIN user_data ud ON pt.id_user_data = ud.id
         WHERE ud.id_usuario = ? AND pga.estado = 'Activo'
       )
       ORDER BY m.id DESC`,
      [idUsuario]
    );
    res.json(multas);
  } catch (error) {
    console.error('Error al obtener mis multas:', error);
    res.status(500).json({ error: 'Error interno del servidor al consultar multas' });
  }
});

// GET /multas/:id (Detalle individual)
router.get('/:id', verificarToken, verificarRol('Administrador'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const [multas] = await pool.query(
      `SELECT m.id, m.numero, m.nombre, m.descripcion, m.estado,
              b.nombre as bloque, i.numero as interior, ap.numero as numero_apartamento,
              tm.valor as monto,
              m.evidencia, m.id_apartamento, m.id_tipo_multa,
              tm.numero as numero_tipo_multa, tm.descripcion as descripcion_tipo_multa
       FROM multa m
       JOIN apartamento ap ON m.id_apartamento = ap.id
       JOIN interior i ON ap.id_interior = i.id
       JOIN bloque b ON i.id_bloque = b.id
       JOIN tipo_multa tm ON m.id_tipo_multa = tm.id
       WHERE m.id = ?`,
      [id]
    );

    if (multas.length === 0) {
      return res.status(404).json({ error: 'Multa no encontrada' });
    }

    res.json(multas[0]);
  } catch (error) {
    console.error('Error al obtener multa:', error);
    next(error);
  }
});

// POST /multas (Crear sanción)
router.post(
  '/',
  [
    body('nombre').trim().notEmpty().withMessage('Título o motivo requerido'),
    body('descripcion').trim().notEmpty().withMessage('Descripción requerida'),
    body('id_tipo_multa').isInt({ gt: 0 }).withMessage('Tipo de multa requerido'),
    body('idApartamento').isInt({ gt: 0 }).withMessage('Apartamento requerido')
  ],
  verificarToken,
  verificarRol('Administrador'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { nombre, descripcion, id_tipo_multa, evidencia, idApartamento, estado } = req.body;
    const nombreTrim = nombre.trim();
    const descripcionTrim = descripcion.trim();
    const evidenciaValor = evidencia ? evidencia.trim() : 'Sin evidencia adjunta';
    const idTipoMulta = parseInt(id_tipo_multa, 10);
    const idApartamentoNum = parseInt(idApartamento, 10);
    const estadoValor = estado ? estado.trim() : 'Pendiente';

    // 1. Resolver administrador (soporta admin sin user_data)
    let idAdministrador = null;
    try {
      const [adminRows] = await pool.query(
        `SELECT a.id 
         FROM administrador a
         JOIN user_data ud ON a.id_user_data = ud.id
         WHERE ud.id_usuario = ?
         LIMIT 1`,
        [req.usuario.id]
      );

      if (adminRows.length > 0) {
        idAdministrador = adminRows[0].id;
      } else {
        const [fallback] = await pool.query(
          "SELECT id FROM administrador WHERE estado = 'Activo' ORDER BY id ASC LIMIT 1"
        );
        if (fallback.length > 0) {
          idAdministrador = fallback[0].id;
        } else {
          const [anyAdmin] = await pool.query("SELECT id FROM administrador ORDER BY id ASC LIMIT 1");
          if (anyAdmin.length > 0) {
            idAdministrador = anyAdmin[0].id;
          } else {
            return res.status(400).json({ error: 'No existe ningún administrador registrado en el sistema.' });
          }
        }
      }
    } catch (err) {
      console.error('Error al resolver administrador:', err);
      return res.status(500).json({ error: 'Error al verificar credenciales de administrador' });
    }

    // 2. Consecutivo numérico dentro del rango de MySQL INT
    const numeroSancion = Math.floor(100000 + Math.random() * 900000);

    try {
      const [result] = await pool.query(
        `INSERT INTO multa 
          (numero, nombre, descripcion, id_tipo_multa, id_administrador, evidencia, estado, id_apartamento) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          numeroSancion,
          nombreTrim,
          descripcionTrim,
          idTipoMulta,
          idAdministrador,
          evidenciaValor,
          estadoValor,
          idApartamentoNum
        ]
      );

      res.status(201).json({
        message: 'Sanción registrada exitosamente',
        id: result.insertId,
        numero: numeroSancion
      });
    } catch (error) {
      console.error('Error al insertar multa:', error);
      res.status(500).json({ error: error.sqlMessage || 'Error al guardar la multa en la base de datos' });
    }
  }
);

// PUT /multas/:id (Actualizar estado)
router.put(
  '/:id',
  [
    body('estado').optional().isIn(['Pendiente', 'En proceso', 'Resuelta'])
  ],
  verificarToken,
  verificarRol('Administrador'),
  async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({ error: 'Debe especificar el nuevo estado' });
    }

    try {
      await pool.query('UPDATE multa SET estado = ? WHERE id = ?', [estado.trim(), id]);
      res.json({ message: 'Estado actualizado exitosamente' });
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      res.status(500).json({ error: 'Error al actualizar estado en la base de datos' });
    }
  }
);

// DELETE /multas/:id (Eliminar multa)
router.delete('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM multa WHERE id = ?', [id]);
    res.json({ message: 'Multa eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar multa:', error);
    res.status(500).json({ error: 'Error al eliminar la multa' });
  }
});

module.exports = router;