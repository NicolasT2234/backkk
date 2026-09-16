/**
 * ==============================================================================
 * SICRCB - RUTAS DE ADMINISTRACIÓN DE USUARIOS Y RESIDENTES
 * Archivo: backend/routes/adminUsuarios.js
 * 
 * Correcciones y Reglas de Negocio Implementadas:
 *  1. Agrupación sin duplicados: Un residente con varios apartamentos solo
 *     aparece UNA vez en el listado, con todos sus apartamentos asociados.
 *  2. Control estricto de apartamentos al reactivar usuarios:
 *     - Si el Usuario A es desactivado, su apartamento queda libre/inactivo.
 *     - Si el Usuario B toma ese apartamento y queda activo, y luego el Usuario A
 *       es reactivado:
 *       -> El sistema detecta que el apartamento ya pertenece a otro residente activo.
 *       -> NO le restaura ese apartamento al Usuario A (permanece inactivo para él).
 *       -> Se le devuelven solo los apartamentos que sigan realmente libres.
 *       -> Envía detalles estructurados (apartamentosOcupados) para renderizar
 *          modales elegantes y detallados en el frontend.
 *  3. Validación estricta en POST / y PUT /:id para impedir asignar apartamentos ocupados.
 *  4. Filtro de catálogo dinámico en GET /catalogos.
 * ==============================================================================
 */

const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../middlewares/auth');

const router = express.Router();

const REGEX_SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
const REGEX_SOLO_NUMEROS = /^\d+$/;


// Blindaje de seguridad: Solo Administrador
router.use(verificarToken, verificarRol('Administrador'));

/**
 * 1. GET / - Listar usuarios agrupando apartamentos (Evita filas duplicadas)
 */
router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT 
        u.id AS id_usuario,
        u.email,
        u.estado AS estado_usuario,
        ud.numero_documento,
        ud.id_tipo_documento,
        td.sigla AS tipo_documento,
        ud.primer_nombre,
        COALESCE(ud.segundo_nombre, '') AS segundo_nombre,
        ud.primer_apellido,
        COALESCE(ud.segundo_apellido, '') AS segundo_apellido,
        COALESCE(r.nombre, 'Propietario') AS rol,
        p.id AS id_propietario,
        a.id AS id_apartamento,
        a.numero AS numero_apartamento,
        i.numero AS numero_interior,
        b.nombre AS bloque,
        pga.estado AS estado_asignacion
      FROM usuario u
      INNER JOIN user_data ud ON u.id = ud.id_usuario
      INNER JOIN tipo_documento td ON ud.id_tipo_documento = td.id
      LEFT JOIN rol_usuario ru ON u.id = ru.id_user
      LEFT JOIN rol r ON ru.id_rol = r.id
      LEFT JOIN propietario p ON ud.id = p.id_user_data
      LEFT JOIN propietario_gestion_apartamento pga ON p.id = pga.id_propietario AND pga.estado = 'Activo'
      LEFT JOIN apartamento a ON pga.id_apartamento = a.id
      LEFT JOIN interior i ON a.id_interior = i.id
      LEFT JOIN bloque b ON i.id_bloque = b.id
    `;

    const params = [];

    if (search && search.trim() !== '') {
      const termino = `%${search.trim()}%`;
      query += `
        WHERE CAST(ud.numero_documento AS CHAR) LIKE ?
           OR CONCAT(ud.primer_nombre, ' ', ud.primer_apellido) LIKE ?
           OR CONCAT(ud.primer_nombre, ' ', COALESCE(ud.segundo_nombre, ''), ' ', ud.primer_apellido, ' ', COALESCE(ud.segundo_apellido, '')) LIKE ?
           OR u.email LIKE ?
      `;
      params.push(termino, termino, termino, termino);
    }

    query += ` ORDER BY u.id DESC`;

    const [rows] = await pool.query(query, params);

    // Agrupar en JavaScript para que cada usuario aparezca exactamente una vez
    const usuariosMap = new Map();

    for (const row of rows) {
      if (!usuariosMap.has(row.id_usuario)) {
        usuariosMap.set(row.id_usuario, {
          id_usuario: row.id_usuario,
          email: row.email,
          estado_usuario: row.estado_usuario,
          numero_documento: row.numero_documento,
          id_tipo_documento: row.id_tipo_documento,
          tipo_documento: row.tipo_documento,
          primer_nombre: row.primer_nombre,
          segundo_nombre: row.segundo_nombre,
          primer_apellido: row.primer_apellido,
          segundo_apellido: row.segundo_apellido,
          rol: row.rol || 'Propietario',
          id_propietario: row.id_propietario,
          id_apartamento: row.id_apartamento,
          numero_apartamento: row.numero_apartamento,
          numero_interior: row.numero_interior,
          nombre_bloque: row.bloque,
          apartamentos: []
        });
      }

      if (row.id_apartamento) {
        const usr = usuariosMap.get(row.id_usuario);
        if (!usr.apartamentos.some((ap) => ap.id === row.id_apartamento)) {
          usr.apartamentos.push({
            id: row.id_apartamento,
            numero: row.numero_apartamento,
            interior: row.numero_interior,
            bloque: row.bloque
          });
        }
      }
    }

    const usuarios = Array.from(usuariosMap.values());
    res.json({ usuarios });
  } catch (error) {
    console.error('Error al consultar usuarios:', error);
    next(error);
  }
});

/**
 * 2. GET /catalogos - Tipos de documento y apartamentos disponibles
 * Excluye apartamentos que ya pertenezcan a un residente ACTIVO.
 */
router.get('/catalogos', async (req, res, next) => {
  try {
    const { idUsuario } = req.query;

    const [tiposDocumento] = await pool.query(
      "SELECT id, sigla, nombre_documento FROM tipo_documento WHERE estado = 'Activo'"
    );

    let queryApartamentos = `
      SELECT 
        a.id, 
        a.numero AS numero_apto, 
        i.numero AS interior, 
        b.nombre AS bloque
      FROM apartamento a
      INNER JOIN interior i ON a.id_interior = i.id
      INNER JOIN bloque b ON i.id_bloque = b.id
      WHERE a.estado = 'Activo'
        AND a.id NOT IN (
          SELECT pga.id_apartamento 
          FROM propietario_gestion_apartamento pga
          INNER JOIN propietario p ON pga.id_propietario = p.id
          INNER JOIN user_data ud ON p.id_user_data = ud.id
          INNER JOIN usuario u ON ud.id_usuario = u.id
          WHERE pga.estado = 'Activo' 
            AND u.estado = 'Activo'
            ${idUsuario ? 'AND u.id != ?' : ''}
        )
      ORDER BY b.nombre, i.numero, a.numero
    `;

    const params = idUsuario ? [idUsuario] : [];
    const [apartamentos] = await pool.query(queryApartamentos, params);

    res.json({ tiposDocumento, apartamentos });
  } catch (error) {
    console.error('Error al obtener catálogos:', error);
    next(error);
  }
});

/**
 * 3. POST / - Registrar residente con 1 o MÁS apartamentos asignados
 */
router.post('/', async (req, res, next) => {
  const {
    email,
    primerNombre,
    segundoNombre,
    primerApellido,
    segundoApellido,
    idTipoDocumento,
    numeroDocumento,
    idApartamento,
    idApartamentos,
    rol = 'Propietario'
  } = req.body;

  let listaApartamentos = [];
  if (Array.isArray(idApartamentos) && idApartamentos.length > 0) {
    listaApartamentos = idApartamentos.map((id) => parseInt(id, 10)).filter((n) => !isNaN(n));
  } else if (idApartamento) {
    listaApartamentos = [parseInt(idApartamento, 10)];
  }

  if (!email || !primerNombre || !primerApellido || !idTipoDocumento || !numeroDocumento || listaApartamentos.length === 0) {
    return res.status(400).json({ error: 'Todos los campos obligatorios y al menos un apartamento deben ser completados.' });
  }


  if (!REGEX_SOLO_LETRAS.test(String(primerNombre).trim())) {
    return res.status(400).json({ error: 'El primer nombre solo puede contener letras y espacios.' });
  }
  if (segundoNombre && String(segundoNombre).trim() !== '' && !REGEX_SOLO_LETRAS.test(String(segundoNombre).trim())) {
    return res.status(400).json({ error: 'El segundo nombre solo puede contener letras y espacios.' });
  }
  if (!REGEX_SOLO_LETRAS.test(String(primerApellido).trim())) {
    return res.status(400).json({ error: 'El primer apellido solo puede contener letras y espacios.' });
  }
  if (segundoApellido && String(segundoApellido).trim() !== '' && !REGEX_SOLO_LETRAS.test(String(segundoApellido).trim())) {
    return res.status(400).json({ error: 'El segundo apellido solo puede contener letras y espacios.' });
  }
  if (!/^\d+$/.test(String(numeroDocumento).trim())) {
    return res.status(400).json({ error: 'El número de documento solo debe contener números.' });
  }


  if (!REGEX_SOLO_LETRAS.test(String(primerNombre).trim())) {
    return res.status(400).json({ error: 'El primer nombre solo puede contener letras y espacios.' });
  }
  if (segundoNombre && String(segundoNombre).trim() !== '' && !REGEX_SOLO_LETRAS.test(String(segundoNombre).trim())) {
    return res.status(400).json({ error: 'El segundo nombre solo puede contener letras y espacios.' });
  }
  if (!REGEX_SOLO_LETRAS.test(String(primerApellido).trim())) {
    return res.status(400).json({ error: 'El primer apellido solo puede contener letras y espacios.' });
  }
  if (segundoApellido && String(segundoApellido).trim() !== '' && !REGEX_SOLO_LETRAS.test(String(segundoApellido).trim())) {
    return res.status(400).json({ error: 'El segundo apellido solo puede contener letras y espacios.' });
  }
  if (!/^\d+$/.test(String(numeroDocumento).trim())) {
    return res.status(400).json({ error: 'El número de documento solo debe contener números.' });
  }

  const contrasenaProvisional = crypto.randomBytes(4).toString('hex');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Validar que no exista el email o número de documento
    const [existentes] = await connection.query(
      `SELECT u.id FROM usuario u 
       LEFT JOIN user_data ud ON u.id = ud.id_usuario 
       WHERE u.email = ? OR (ud.numero_documento = ? AND ud.id_tipo_documento = ?)`,
      [email, numeroDocumento, idTipoDocumento]
    );

    if (existentes.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'El email o el número de documento ya está registrado en el sistema.' });
    }

    // 2. VALIDACIÓN ESTRICTA: Ningún apartamento debe pertenecer a un residente ACTIVO
    const [ocupados] = await connection.query(
      `SELECT a.numero AS numero_apto, b.nombre AS bloque, i.numero AS interior,
              CONCAT(ud.primer_nombre, ' ', ud.primer_apellido) AS residente_activo
       FROM propietario_gestion_apartamento pga
       INNER JOIN apartamento a ON pga.id_apartamento = a.id
       INNER JOIN interior i ON a.id_interior = i.id
       INNER JOIN bloque b ON i.id_bloque = b.id
       INNER JOIN propietario p ON pga.id_propietario = p.id
       INNER JOIN user_data ud ON p.id_user_data = ud.id
       INNER JOIN usuario u ON ud.id_usuario = u.id
       WHERE pga.estado = 'Activo' 
         AND u.estado = 'Activo'
         AND a.id IN (?)`,
      [listaApartamentos]
    );

    if (ocupados.length > 0) {
      await connection.rollback();
      const detalles = ocupados.map(o => `Apto ${o.numero_apto} (${o.bloque}, Int ${o.interior} - de ${o.residente_activo})`).join(', ');
      return res.status(400).json({
        error: `No se puede asignar: los siguientes apartamentos ya pertenecen a un residente activo: ${detalles}. Solo se pueden asignar apartamentos libres o de residentes inactivos.`
      });
    }

    // 3. Insertar usuario
    const [usuarioRes] = await connection.query(
      "INSERT INTO usuario (email, contraseña, estado) VALUES (?, SHA2(?, 256), 'Activo')",
      [email, contrasenaProvisional]
    );
    const idUsuario = usuarioRes.insertId;

    // 4. Insertar user_data
    const [userDataRes] = await connection.query(
      `INSERT INTO user_data 
       (numero_documento, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, id_usuario, id_tipo_documento) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        numeroDocumento,
        primerNombre.trim(),
        segundoNombre ? segundoNombre.trim() : null,
        primerApellido.trim(),
        segundoApellido ? segundoApellido.trim() : null,
        idUsuario,
        idTipoDocumento
      ]
    );
    const idUserData = userDataRes.insertId;

    // 5. Asignar rol
    const [rolRes] = await connection.query('SELECT id FROM rol WHERE nombre = ? LIMIT 1', [rol]);
    const idRol = rolRes.length > 0 ? rolRes[0].id : 2;
    await connection.query('INSERT INTO rol_usuario (id_user, id_rol) VALUES (?, ?)', [idUsuario, idRol]);

    // 6. Crear propietario
    const [propRes] = await connection.query(
      "INSERT INTO propietario (id_user_data, estado) VALUES (?, 'Activo')",
      [idUserData]
    );
    const idPropietario = propRes.insertId;

    // 7. Asignar apartamentos seleccionados (inactivando cualquier vínculo inactivo residual de otro residente)
    for (const aptoId of listaApartamentos) {
      await connection.query(
        "UPDATE propietario_gestion_apartamento SET estado = 'Inactivo' WHERE id_apartamento = ? AND id_propietario != ?",
        [aptoId, idPropietario]
      );

      await connection.query(
        `INSERT INTO propietario_gestion_apartamento 
         (id_propietario, id_apartamento, fecha_registro, estado) 
         VALUES (?, ?, CURDATE(), 'Activo')
         ON DUPLICATE KEY UPDATE estado = 'Activo'`,
        [idPropietario, aptoId]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: 'Residente registrado y apartamentos asignados exitosamente.',
      credenciales: {
        email,
        contrasenaProvisional
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al registrar residente:', error);
    next(error);
  } finally {
    connection.release();
  }
});

/**
 * 4. PUT /:id - Actualizar datos del residente y sus apartamentos asignados
 */
router.put('/:id', async (req, res, next) => {
  const { id } = req.params;
  const {
    email,
    primerNombre,
    segundoNombre,
    primerApellido,
    segundoApellido,
    idTipoDocumento,
    numeroDocumento,
    idApartamentos
  } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Actualizar email
    if (email) {
      await connection.query('UPDATE usuario SET email = ? WHERE id = ?', [email.trim(), id]);
    }

    // 2. Actualizar user_data
    const [userData] = await connection.query('SELECT id FROM user_data WHERE id_usuario = ?', [id]);
    if (userData.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Datos del residente no encontrados.' });
    }
    const idUserData = userData[0].id;

    await connection.query(
      `UPDATE user_data 
       SET primer_nombre = ?, segundo_nombre = ?, primer_apellido = ?, segundo_apellido = ?,
           numero_documento = ?, id_tipo_documento = ?
       WHERE id = ?`,
      [
        primerNombre.trim(),
        segundoNombre ? segundoNombre.trim() : null,
        primerApellido.trim(),
        segundoApellido ? segundoApellido.trim() : null,
        numeroDocumento,
        idTipoDocumento,
        idUserData
      ]
    );

    // 3. Validar y actualizar apartamentos
    if (Array.isArray(idApartamentos) && idApartamentos.length > 0) {
      const [ocupadosPorOtros] = await connection.query(
        `SELECT a.numero AS numero_apto, b.nombre AS bloque, i.numero AS interior,
                CONCAT(ud.primer_nombre, ' ', ud.primer_apellido) AS residente_activo
         FROM propietario_gestion_apartamento pga
         INNER JOIN apartamento a ON pga.id_apartamento = a.id
         INNER JOIN interior i ON a.id_interior = i.id
         INNER JOIN bloque b ON i.id_bloque = b.id
         INNER JOIN propietario p ON pga.id_propietario = p.id
         INNER JOIN user_data ud ON p.id_user_data = ud.id
         INNER JOIN usuario u ON ud.id_usuario = u.id
         WHERE pga.estado = 'Activo' 
           AND u.estado = 'Activo'
           AND u.id != ?
           AND a.id IN (?)`,
        [id, idApartamentos]
      );

      if (ocupadosPorOtros.length > 0) {
        await connection.rollback();
        const detalles = ocupadosPorOtros.map(o => `Apto ${o.numero_apto} (${o.bloque}, Int ${o.interior} - de ${o.residente_activo})`).join(', ');
        return res.status(400).json({
          error: `No se puede actualizar: los siguientes apartamentos ya pertenecen a otro residente activo: ${detalles}. Solo se pueden asignar apartamentos libres o de residentes inactivos.`
        });
      }

      const [prop] = await connection.query('SELECT id FROM propietario WHERE id_user_data = ?', [idUserData]);
      if (prop.length > 0) {
        const idPropietario = prop[0].id;

        // Desactivar asignaciones anteriores de este residente
        await connection.query(
          "UPDATE propietario_gestion_apartamento SET estado = 'Inactivo' WHERE id_propietario = ?",
          [idPropietario]
        );

        // Asignar los nuevos apartamentos elegidos
        for (const aptoId of idApartamentos) {
          const aptoNum = parseInt(aptoId, 10);
          if (!isNaN(aptoNum)) {
            // Desactivar cualquier asignación residual inactiva de otro propietario en este apto
            await connection.query(
              "UPDATE propietario_gestion_apartamento SET estado = 'Inactivo' WHERE id_apartamento = ? AND id_propietario != ?",
              [aptoNum, idPropietario]
            );

            await connection.query(
              `INSERT INTO propietario_gestion_apartamento (id_propietario, id_apartamento, fecha_registro, estado)
               VALUES (?, ?, CURDATE(), 'Activo')
               ON DUPLICATE KEY UPDATE estado = 'Activo'`,
              [idPropietario, aptoNum]
            );
          }
        }
      }
    }

    await connection.commit();
    res.json({ message: 'Residente y apartamentos actualizados exitosamente.' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar residente:', error);
    next(error);
  } finally {
    connection.release();
  }
});

/**
 * 5. PATCH /:id/estado - Alternar estado Activo / Inactivo con BLINDAJE DE REACTIVACIÓN Y ESTRUCTURA DETALLADA
 */
router.patch('/:id/estado', async (req, res, next) => {
  const { id } = req.params;
  const { nuevoEstado } = req.body;

  if (!['Activo', 'Inactivo'].includes(nuevoEstado)) {
    return res.status(400).json({ error: "El estado debe ser 'Activo' o 'Inactivo'." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let advertencia = null;
    let apartamentosOcupados = [];

    if (nuevoEstado === 'Activo') {
      // 1. Activar cuenta de usuario
      await connection.query('UPDATE usuario SET estado = ? WHERE id = ?', ['Activo', id]);

      // 2. Activar propietario
      await connection.query(
        `UPDATE propietario p
         INNER JOIN user_data ud ON p.id_user_data = ud.id
         SET p.estado = 'Activo'
         WHERE ud.id_usuario = ?`,
        [id]
      );

      // 3. VALIDAR: ¿Alguno de los apartamentos anteriores de este usuario fue tomado por OTRO residente ACTIVO?
      const [ocupados] = await connection.query(
        `SELECT a.id, a.numero AS numero_apto, b.nombre AS bloque, i.numero AS interior,
                CONCAT(ud2.primer_nombre, ' ', ud2.primer_apellido) AS ocupante_actual
         FROM propietario_gestion_apartamento pga
         INNER JOIN propietario p ON pga.id_propietario = p.id
         INNER JOIN user_data ud ON p.id_user_data = ud.id
         INNER JOIN apartamento a ON pga.id_apartamento = a.id
         INNER JOIN interior i ON a.id_interior = i.id
         INNER JOIN bloque b ON i.id_bloque = b.id
         INNER JOIN propietario_gestion_apartamento pga2 ON a.id = pga2.id_apartamento AND pga2.estado = 'Activo'
         INNER JOIN propietario p2 ON pga2.id_propietario = p2.id
         INNER JOIN user_data ud2 ON p2.id_user_data = ud2.id
         INNER JOIN usuario u2 ON ud2.id_usuario = u2.id AND u2.estado = 'Activo'
         WHERE ud.id_usuario = ? AND u2.id != ?`,
        [id, id]
      );

      apartamentosOcupados = ocupados || [];
      const idsOcupados = ocupados.map((o) => o.id);

      if (idsOcupados.length > 0) {
        // Reactivar ÚNICAMENTE los apartamentos que NO estén ocupados por otro usuario activo
        await connection.query(
          `UPDATE propietario_gestion_apartamento pga
           INNER JOIN propietario p ON pga.id_propietario = p.id
           INNER JOIN user_data ud ON p.id_user_data = ud.id
           SET pga.estado = 'Activo'
           WHERE ud.id_usuario = ? AND pga.id_apartamento NOT IN (?)`,
          [id, idsOcupados]
        );

        // Asegurar que los ocupados sigan Inactivos para el usuario que se está reactivando
        await connection.query(
          `UPDATE propietario_gestion_apartamento pga
           INNER JOIN propietario p ON pga.id_propietario = p.id
           INNER JOIN user_data ud ON p.id_user_data = ud.id
           SET pga.estado = 'Inactivo'
           WHERE ud.id_usuario = ? AND pga.id_apartamento IN (?)`,
          [id, idsOcupados]
        );

        const detalleOcupados = ocupados
          .map((o) => `Apto ${o.numero_apto} (${o.bloque}, Int ${o.interior} - asignado a ${o.ocupante_actual})`)
          .join(', ');

        advertencia = `El usuario fue reactivado, pero los siguientes apartamentos ya pertenecen a otro residente activo y no fueron restaurados: ${detalleOcupados}.`;
      } else {
        // Ninguno está ocupado por otro residente activo: restaurar todas sus asignaciones
        await connection.query(
          `UPDATE propietario_gestion_apartamento pga
           INNER JOIN propietario p ON pga.id_propietario = p.id
           INNER JOIN user_data ud ON p.id_user_data = ud.id
           SET pga.estado = 'Activo'
           WHERE ud.id_usuario = ?`,
          [id]
        );
      }
    } else {
      // Desactivar usuario, propietario y sus asignaciones
      await connection.query('UPDATE usuario SET estado = ? WHERE id = ?', ['Inactivo', id]);

      await connection.query(
        `UPDATE propietario p
         INNER JOIN user_data ud ON p.id_user_data = ud.id
         SET p.estado = 'Inactivo'
         WHERE ud.id_usuario = ?`,
        [id]
      );

      await connection.query(
        `UPDATE propietario_gestion_apartamento pga
         INNER JOIN propietario p ON pga.id_propietario = p.id
         INNER JOIN user_data ud ON p.id_user_data = ud.id
         SET pga.estado = 'Inactivo'
         WHERE ud.id_usuario = ?`,
        [id]
      );
    }

    await connection.commit();
    res.json({
      message: `Estado del usuario actualizado a ${nuevoEstado}.`,
      advertencia,
      apartamentosOcupados
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar estado:', error);
    next(error);
  } finally {
    connection.release();
  }
});

module.exports = router;