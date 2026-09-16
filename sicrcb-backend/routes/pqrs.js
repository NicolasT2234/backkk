const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// GET /pqrs (solo administradores)
router.get('/', verificarToken, verificarRol('Administrador'), async (req, res, next) => {
  try {
    const [pqrs] = await pool.query(
      `SELECT qs.id, qs.descripcion_pqr as descripcion, qs.fecha as fecha_creacion,
              qs.estado, qs.titulo_pqr as tipo,
              ud.primer_nombre as nombre_usuario, ud.primer_apellido as apellido_usuario,
              b.nombre as bloque, ap.numero, i.numero as interior
       FROM queja_sugerencia qs
       JOIN propietario p ON qs.id_propietario = p.id
       JOIN user_data ud ON p.id_user_data = ud.id
       JOIN pqr_especifica pe ON qs.id = pe.id_queja_sugerencia
       JOIN apartamento ap ON pe.id_apartamento = ap.id
       JOIN interior i ON ap.id_interior = i.id
       JOIN bloque b ON i.id_bloque = b.id
       ORDER BY qs.fecha DESC`
    );
    res.json(pqrs);
  } catch (error) {
    console.error('Error al obtener PQRs:', error);
    next(error);
  }
});

// GET /mi-apartamento (obtiene los datos del apartamento asignado al residente actual)
router.get('/mi-apartamento', verificarToken, async (req, res) => {
  try {
    const idUsuario = req.usuario.id;

    const [rows] = await pool.query(
      `SELECT ap.id as idApartamento, ap.numero as numeroApartamento,
              i.numero as interior, b.nombre as bloque
       FROM propietario_gestion_apartamento pga
       JOIN propietario p ON pga.id_propietario = p.id
       JOIN user_data ud ON p.id_user_data = ud.id
       JOIN apartamento ap ON pga.id_apartamento = ap.id
       JOIN interior i ON ap.id_interior = i.id
       JOIN bloque b ON i.id_bloque = b.id
       WHERE ud.id_usuario = ? AND pga.estado = 'Activo'
       ORDER BY pga.fecha_registro DESC
       LIMIT 1`,
      [idUsuario]
    );

    if (rows.length === 0) {
      return res.json({ apartamento: null });
    }

    res.json({ apartamento: rows[0] });
  } catch (error) {
    console.error('Error al obtener apartamento del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /mis-pqrs
router.get('/mis-pqrs', verificarToken, async (req, res) => {
  try {
    const idUsuario = req.usuario.id;

    const [pqrs] = await pool.query(
      `SELECT qs.id, qs.descripcion_pqr as descripcion, qs.fecha as fecha_creacion,
              qs.estado, qs.titulo_pqr as tipo,
              b.nombre as bloque, ap.numero, i.numero as interior
       FROM queja_sugerencia qs
       JOIN propietario p ON qs.id_propietario = p.id
       JOIN user_data ud ON p.id_user_data = ud.id
       JOIN pqr_especifica pe ON qs.id = pe.id_queja_sugerencia
       JOIN apartamento ap ON pe.id_apartamento = ap.id
       JOIN interior i ON ap.id_interior = i.id
       JOIN bloque b ON i.id_bloque = b.id
       WHERE ud.id_usuario = ?
       ORDER BY qs.fecha DESC`,
      [idUsuario]
    );

    res.json(pqrs);
  } catch (error) {
    console.error('Error al obtener mis PQRs:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /pqrs/:id (solo administradores)
router.get('/:id', verificarToken, verificarRol('Administrador'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const [pqrs] = await pool.query(
      `SELECT qs.id, qs.descripcion_pqr as descripcion, qs.fecha as fecha_creacion,
              qs.estado, qs.titulo_pqr as tipo,
              ud.primer_nombre as nombre_usuario, ud.primer_apellido as apellido_usuario,
              b.nombre as bloque, ap.numero, i.numero as interior
       FROM queja_sugerencia qs
       JOIN propietario p ON qs.id_propietario = p.id
       JOIN user_data ud ON p.id_user_data = ud.id
       JOIN pqr_especifica pe ON qs.id = pe.id_queja_sugerencia
       JOIN apartamento ap ON pe.id_apartamento = ap.id
       JOIN interior i ON ap.id_interior = i.id
       JOIN bloque b ON i.id_bloque = b.id
       WHERE qs.id = ?`,
      [id]
    );

    if (pqrs.length === 0) {
      return res.status(404).json({ error: 'PQR no encontrada' });
    }

    res.json(pqrs[0]);
  } catch (error) {
    console.error('Error al obtener PQR:', error);
    next(error);
  }
});

// POST /pqrs (el apartamento se asigna automáticamente a partir del usuario en sesión)
router.post('/',
  [
    body('descripcion').trim().notEmpty().withMessage('Descripción requerida'),
    body('tipo').trim().notEmpty().withMessage('Tipo requerido'),
    body('idApartamento').optional().isInt({ gt: 0 }).withMessage('ID de apartamento inválido')
  ],
  verificarToken, async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let { descripcion, tipo, idApartamento } = req.body;
    const idUsuario = req.usuario.id;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Resolver propietario a partir del usuario autenticado
      const [userDataRows] = await connection.query(
        'SELECT id FROM user_data WHERE id_usuario = ?',
        [idUsuario]
      );
      if (userDataRows.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Información de perfil no encontrada' });
      }

      const [propietarioRows] = await connection.query(
        'SELECT id FROM propietario WHERE id_user_data = ?',
        [userDataRows[0].id]
      );
      if (propietarioRows.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'No se encontró un perfil de propietario asociado' });
      }
      const idPropietario = propietarioRows[0].id;

      // 2. Si no viene idApartamento, se obtiene automáticamente de la base de datos
      if (!idApartamento) {
        const [gestionRows] = await connection.query(
          `SELECT id_apartamento FROM propietario_gestion_apartamento
           WHERE id_propietario = ? AND estado = 'Activo'
           ORDER BY fecha_registro DESC LIMIT 1`,
          [idPropietario]
        );

        if (gestionRows.length === 0) {
          await connection.rollback();
          return res.status(400).json({ error: 'No tienes un apartamento activo asignado para radicar la PQR' });
        }
        idApartamento = gestionRows[0].id_apartamento;
      } else {
        // Si fue enviado, validar que pertenezca activamente al usuario
        const [gestion] = await connection.query(
          `SELECT id FROM propietario_gestion_apartamento
           WHERE id_propietario = ? AND id_apartamento = ? AND estado = 'Activo'`,
          [idPropietario, idApartamento]
        );
        if (gestion.length === 0) {
          await connection.rollback();
          return res.status(403).json({ error: 'No tienes permiso para crear una PQR para este apartamento' });
        }
      }

      // 3. Asignar un administrador activo
      const [adminRows] = await connection.query(
        `SELECT id FROM administrador WHERE estado = 'Activo' LIMIT 1`
      );
      if (adminRows.length === 0) {
        await connection.rollback();
        return res.status(500).json({ error: 'No hay administradores activos disponibles en el sistema' });
      }
      const idAdministrador = adminRows[0].id;

      // 4. Insertar en queja_sugerencia
      const [qsResult] = await connection.query(
        `INSERT INTO queja_sugerencia
          (id_propietario, id_administrador, descripcion_pqr, titulo_pqr, estado, fecha)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [idPropietario, idAdministrador, descripcion.trim(), tipo.trim(), 'Pendiente']
      );
      const idQuejaSugerencia = qsResult.insertId;

      // 5. Vincular apartamento en pqr_especifica
      await connection.query(
        'INSERT INTO pqr_especifica (id_queja_sugerencia, id_apartamento) VALUES (?, ?)',
        [idQuejaSugerencia, idApartamento]
      );

      await connection.commit();
      res.status(201).json({ message: 'PQR creada exitosamente', id: idQuejaSugerencia });
    } catch (error) {
      await connection.rollback();
      console.error('Error al crear PQR:', error);
      next(error);
    } finally {
      connection.release();
    }
  }
);

// PUT /pqrs/:id (Administrador O Residente dueño de la PQR en estado Pendiente)
router.put('/:id',
  [
    body('descripcion').optional().trim().notEmpty().withMessage('Descripción no puede estar vacía'),
    body('estado').optional().trim().notEmpty().withMessage('Estado no puede estar vacío'),
    body('tipo').optional().trim().notEmpty().withMessage('Tipo no puede estar vacío')
  ],
  verificarToken, async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { descripcion, estado, tipo } = req.body;
    const { id } = req.params;
    const idUsuario = req.usuario.id;
    const esAdmin = req.usuario.rol?.toLowerCase() === 'administrador';

    if (!descripcion && !estado && !tipo) {
      return res.status(400).json({ error: 'Al menos un campo debe proporcionarse' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Si es residente, validar que la PQR le pertenezca y siga en estado Pendiente
      if (!esAdmin) {
        const [rows] = await connection.query(
          `SELECT qs.id, qs.estado 
           FROM queja_sugerencia qs
           JOIN propietario p ON qs.id_propietario = p.id
           JOIN user_data ud ON p.id_user_data = ud.id
           WHERE qs.id = ? AND ud.id_usuario = ?`,
          [id, idUsuario]
        );

        if (rows.length === 0) {
          await connection.rollback();
          return res.status(403).json({ error: 'No tienes permiso para actualizar esta PQR' });
        }

        if (rows[0].estado.toLowerCase() !== 'pendiente') {
          await connection.rollback();
          return res.status(400).json({
            error: 'Solo puedes actualizar tu PQR mientras su estado se encuentre en "Pendiente".'
          });
        }
      }

      const updates = [];
      const values = [];

      if (descripcion !== undefined) {
        updates.push('descripcion_pqr = ?');
        values.push(descripcion.trim());
      }
      if (tipo !== undefined) {
        updates.push('titulo_pqr = ?');
        values.push(tipo.trim());
      }
      // Solo administradores pueden alterar el estado
      if (estado !== undefined && esAdmin) {
        updates.push('estado = ?');
        values.push(estado.trim());
      }

      if (updates.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'No hay campos para actualizar' });
      }

      values.push(id);
      await connection.query(
        `UPDATE queja_sugerencia SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      await connection.commit();
      res.json({ message: 'PQR actualizada exitosamente' });
    } catch (error) {
      await connection.rollback();
      console.error('Error al actualizar PQR:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
      connection.release();
    }
  }
);

// DELETE /pqrs/:id (solo administradores)
router.delete('/:id', verificarToken, verificarRol('Administrador'), async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query('DELETE FROM pqr_especifica WHERE id_queja_sugerencia = ?', [id]);
    await connection.query('DELETE FROM queja_sugerencia WHERE id = ?', [id]);

    await connection.commit();
    res.json({ message: 'PQR eliminada exitosamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al eliminar PQR:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

module.exports = router;