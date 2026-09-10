const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// GET /multas (solo administradores)
router.get('/', verificarToken, verificarRol('Administrador'), async (req, res) => {
  try {
    const [multas] = await pool.query(
      `SELECT m.id, m.numero, m.nombre, m.descripcion, m.estado,
              b.nombre as bloque, ap.numero as numero_apartamento,
              ud.primer_nombre as nombre_propietario, ud.primer_apellido as apellido_propietario,
              tm.valor as monto,
              m.evidencia, m.id_apartamento, m.id_tipo_multa,
              tm.numero as numero_tipo_multa, tm.descripcion as descripcion_tipo_multa,
              uad.primer_nombre as nombre_administrador, uad.primer_apellido as apellido_administrador
       FROM multa m
       JOIN apartamento ap ON m.id_apartamento = ap.id
       JOIN interior i ON ap.id_interior = i.id
       JOIN bloque b ON i.id_bloque = b.id
       LEFT JOIN (
           SELECT pga.id_apartamento, pga.id_propietario
           FROM propietario_gestion_apartamento pga
           WHERE pga.estado = 'Activo'
           AND pga.fecha_registro = (
               SELECT MAX(pga2.fecha_registro)
               FROM propietario_gestion_apartamento pga2
               WHERE pga2.id_apartamento = pga.id_apartamento
               AND pga2.estado = 'Activo'
           )
       ) latest_pga ON latest_pga.id_apartamento = ap.id
       LEFT JOIN propietario p ON latest_pga.id_propietario = p.id
       LEFT JOIN user_data ud ON p.id_user_data = ud.id
       JOIN tipo_multa tm ON m.id_tipo_multa = tm.id
       JOIN administrador a ON m.id_administrador = a.id
       JOIN user_data uad ON a.id_user_data = uad.id
       ORDER BY m.estado ASC, m.id DESC`
    );
    res.json(multas);
  } catch (error) {
    console.error('Error al obtener multas:', error);
    next(error);
  }
});

// GET /mis-multas
// IMPORTANTE: esta ruta debe ir ANTES de "/:id" porque si no, Express interpreta
// "mis-multas" como si fuera un valor de :id y nunca llega hasta aquí.
router.get('/mis-multas', verificarToken, async (req, res) => {
  try {
    const idUsuario = req.usuario.id;

    const [multas] = await pool.query(
      `SELECT m.id, m.numero, m.nombre, m.descripcion, m.estado,
              b.nombre as bloque, ap.numero,
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
       AND m.estado = ?
       ORDER BY m.id DESC`,
      [idUsuario, 'Pendiente']
    );

    res.json(multas);
  } catch (error) {
    console.error('Error al obtener mis multas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /multas/:id (solo administradores)
router.get('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  try {
    const { id } = req.params;
    const [multas] = await pool.query(
      `SELECT m.id, m.numero, m.nombre, m.descripcion, m.estado,
              b.nombre as bloque, ap.numero as numero_apartamento,
              ud.primer_nombre as nombre_propietario, ud.primer_apellido as apellido_propietario,
              tm.valor as monto,
              m.evidencia, m.id_apartamento, m.id_tipo_multa,
              tm.numero as numero_tipo_multa, tm.descripcion as descripcion_tipo_multa,
              uad.primer_nombre as nombre_administrador, uad.primer_apellido as apellido_administrador
       FROM multa m
       JOIN apartamento ap ON m.id_apartamento = ap.id
       JOIN interior i ON ap.id_interior = i.id
       JOIN bloque b ON i.id_bloque = b.id
       LEFT JOIN (
           SELECT pga.id_apartamento, pga.id_propietario
           FROM propietario_gestion_apartamento pga
           WHERE pga.estado = 'Activo'
           AND pga.fecha_registro = (
               SELECT MAX(pga2.fecha_registro)
               FROM propietario_gestion_apartamento pga2
               WHERE pga2.id_apartamento = pga.id_apartamento
               AND pga2.estado = 'Activo'
           )
       ) latest_pga ON latest_pga.id_apartamento = ap.id
       LEFT JOIN propietario p ON latest_pga.id_propietario = p.id
       LEFT JOIN user_data ud ON p.id_user_data = ud.id
       JOIN tipo_multa tm ON m.id_tipo_multa = tm.id
       JOIN administrador a ON m.id_administrador = a.id
       JOIN user_data uad ON a.id_user_data = uad.id
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

// POST /multas (solo administradores)
router.post('/',
  [
    body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
    body('descripcion').trim().notEmpty().withMessage('Descripción requerida'),
    body('id_tipo_multa').isInt({ gt: 0 }).withMessage('ID de tipo de multa válido requerido'),
    body('evidencia').trim().notEmpty().withMessage('Evidencia requerida'),
    body('idApartamento').isInt({ gt: 0 }).withMessage('ID de apartamento válido requerido'),
    body('estado').optional().isIn(['Pendiente','En proceso','Resuelta']).withMessage('Estado debe ser Pendiente, En proceso o Resuelta')
  ],
  verificarToken, verificarRol('Administrador'), async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, descripcion, id_tipo_multa, evidencia, idApartamento } = req.body;
    const nombreTrim = nombre.trim();
    const descripcionTrim = descripcion.trim();
    const evidenciaTrim = evidencia.trim();
    const idTipoMulta = parseInt(id_tipo_multa, 10);
    const idApartamentoNum = parseInt(idApartamento, 10);
    let estadoValor = 'Pendiente';
    if (req.body.estado !== undefined) {
      estadoValor = req.body.estado.trim();
    }

    // Resolver id_administrador desde el usuario logueado
    // req.usuario.id is the usuario.id from JWT
    // Need to find the administrador id that corresponds to this usuario
    let idAdministrador;
    try {
      const [userDataRows] = await pool.query(
        'SELECT id FROM user_data WHERE id_usuario = ?',
        [req.usuario.id]
      );

      if (userDataRows.length === 0) {
        return res.status(400).json({ error: 'Usuario data no encontrada' });
      }

      const userDataId = userDataRows[0].id;

      const [adminRows] = await pool.query(
        'SELECT id FROM administrador WHERE id_user_data = ?',
        [userDataId]
      );

      if (adminRows.length === 0) {
        return res.status(400).json({ error: 'Administrador no encontrado para este usuario' });
      }

      idAdministrador = adminRows[0].id;
    } catch (error) {
      console.error('Error al obtener administrador:', error);
      return next(error);
    }

    try {
      const [result] = await pool.query(
        'INSERT INTO multa (numero, nombre, descripcion, id_tipo_multa, id_administrador, evidencia, estado, id_apartamento) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [Date.now(), nombreTrim, descripcionTrim, idTipoMulta, idAdministrador, evidenciaTrim, estadoValor, idApartamentoNum]
      );
      res.status(201).json({ message: 'Multa creada exitosamente', id: result.insertId });
    } catch (error) {
      console.error('Error al crear multa:', error);
      next(error);
    }
  }
);

// PUT /multas/:id (solo administradores)
router.put('/:id',
  [
    body('nombre').optional().trim().notEmpty().withMessage('Nombre no puede estar vacío si se proporciona'),
    body('descripcion').optional().trim().notEmpty().withMessage('Descripción no puede estar vacía si se proporciona'),
    body('id_tipo_multa').optional().isInt({ gt: 0 }).withMessage('ID de tipo de multa debe ser un entero positivo si se proporciona'),
    body('id_administrador').optional().isInt({ gt: 0 }).withMessage('ID de administrador debe ser un entero positivo si se proporciona'),
    body('evidencia').optional().trim().notEmpty().withMessage('Evidencia no puede estar vacía si se proporciona'),
    body('estado').optional().isIn(['Pendiente','En proceso','Resuelta']).withMessage('Estado debe ser Pendiente, En proceso o Resuelta si se proporciona'),
    body('idApartamento').optional().isInt({ gt: 0 }).withMessage('ID de apartamento debe ser un entero positivo si se proporciona')
  ],
  verificarToken, verificarRol('Administrador'), async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, descripcion, id_tipo_multa, id_administrador, evidencia, estado, idApartamento } = req.body;
    const { id } = req.params;

    // Check that at least one field is provided
    if (!nombre && !descripcion && !id_tipo_multa && !id_administrador && !evidencia && !estado && !idApartamento) {
      return res.status(400).json({ error: 'Al menos un campo debe proporcionarse' });
    }

    // Trim string fields and parse integers
    const nombreTrim = nombre !== undefined ? nombre.trim() : undefined;
    const descripcionTrim = descripcion !== undefined ? descripcion.trim() : undefined;
    const evidenciaTrim = evidencia !== undefined ? evidencia.trim() : undefined;
    const idTipoMulta = id_tipo_multa !== undefined ? parseInt(id_tipo_multa, 10) : undefined;
    const idAdministradorNum = id_administrador !== undefined ? parseInt(id_administrador, 10) : undefined;
    const idApartamentoNum = idApartamento !== undefined ? parseInt(idApartamento, 10) : undefined;
    const estadoValor = estado !== undefined ? estado.trim() : undefined;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const updates = [];
      const values = [];

      if (nombreTrim !== undefined) {
        updates.push('nombre = ?');
        values.push(nombreTrim);
      }
      if (descripcionTrim !== undefined) {
        updates.push('descripcion = ?');
        values.push(descripcionTrim);
      }
      if (idTipoMulta !== undefined) {
        updates.push('id_tipo_multa = ?');
        values.push(idTipoMulta);
      }
      if (idAdministradorNum !== undefined) {
        updates.push('id_administrador = ?');
        values.push(idAdministradorNum);
      }
      if (evidenciaTrim !== undefined) {
        updates.push('evidencia = ?');
        values.push(evidenciaTrim);
      }
      if (idApartamentoNum !== undefined) {
        updates.push('id_apartamento = ?');
        values.push(idApartamentoNum);
      }
      if (estadoValor !== undefined) {
        updates.push('estado = ?');
        values.push(estadoValor);
      }

      if (updates.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'No hay campos para actualizar' });
      }

      values.push(id);
      await connection.query(
        `UPDATE multa SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      await connection.commit();
      res.json({ message: 'Multa actualizada exitosamente' });
    } catch (error) {
      await connection.rollback();
      console.error('Error al actualizar multa:', error);
      next(error);
    } finally {
      connection.release();
    }
  }
);

// DELETE /multas/:id (solo administradores)
router.delete('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM multa WHERE id = ?', [id]);
    res.json({ message: 'Multa eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar multa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;