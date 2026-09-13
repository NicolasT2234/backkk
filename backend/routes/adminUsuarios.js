const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../auth');

const router = express.Router();

// Blindaje de seguridad: Solo Administrador
router.use(verificarToken, verificarRol('Administrador'));

// GET / - Listar y consultar usuarios
router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT 
        u.id AS id_usuario,
        u.email,
        u.estado AS estado_usuario,
        ud.numero_documento,
        td.sigla AS tipo_documento,
        ud.primer_nombre,
        COALESCE(ud.segundo_nombre, '') AS segundo_nombre,
        ud.primer_apellido,
        COALESCE(ud.segundo_apellido, '') AS segundo_apellido,
        r.nombre AS rol,
        p.id AS id_propietario,
        a.id AS id_apartamento,
        a.numero AS numero_apartamento,
        i.numero AS numero_interior,
        b.nombre AS nombre_bloque,
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

    const [usuarios] = await pool.query(query, params);
    res.json({ usuarios });
  } catch (error) {
    console.error('Error al consultar usuarios:', error);
    next(error);
  }
});

// GET /catalogos - Tipos de documento y apartamentos disponibles
router.get('/catalogos', async (req, res, next) => {
  try {
    const [tiposDocumento] = await pool.query(
      "SELECT id, sigla, nombre_documento FROM tipo_documento WHERE estado = 'Activo'"
    );

    const [apartamentos] = await pool.query(`
      SELECT 
        a.id, 
        a.numero AS numero_apto, 
        i.numero AS interior, 
        b.nombre AS bloque 
      FROM apartamento a
      INNER JOIN interior i ON a.id_interior = i.id
      INNER JOIN bloque b ON i.id_bloque = b.id
      WHERE a.estado = 'Activo'
      ORDER BY b.nombre, i.numero, a.numero
    `);

    res.json({ tiposDocumento, apartamentos });
  } catch (error) {
    console.error('Error al obtener catálogos:', error);
    next(error);
  }
});

// POST / - Registrar residente y asignar apartamento (Transaccional)
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
    rol = 'Propietario'
  } = req.body;

  if (!email || !primerNombre || !primerApellido || !idTipoDocumento || !numeroDocumento || !idApartamento) {
    return res.status(400).json({ error: 'Todos los campos obligatorios deben ser completados.' });
  }

  const contrasenaProvisional = crypto.randomBytes(4).toString('hex');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

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

    // 1. Insertar usuario
    const [usuarioRes] = await connection.query(
      "INSERT INTO usuario (email, contraseña, estado) VALUES (?, SHA2(?, 256), 'Activo')",
      [email, contrasenaProvisional]
    );
    const idUsuario = usuarioRes.insertId;

    // 2. Insertar user_data
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

    // 3. Asignar rol
    const [rolRes] = await connection.query('SELECT id FROM rol WHERE nombre = ? LIMIT 1', [rol]);
    if (rolRes.length === 0) {
      throw new Error(`El rol ${rol} no existe.`);
    }
    await connection.query('INSERT INTO rol_usuario (id_user, id_rol) VALUES (?, ?)', [idUsuario, rolRes[0].id]);

    // 4. Crear propietario
    const [propRes] = await connection.query(
      "INSERT INTO propietario (id_user_data, estado) VALUES (?, 'Activo')",
      [idUserData]
    );
    const idPropietario = propRes.insertId;

    // 5. Asignar apartamento
    await connection.query(
      `INSERT INTO propietario_gestion_apartamento 
       (id_propietario, id_apartamento, fecha_registro, estado) 
       VALUES (?, ?, CURDATE(), 'Activo')`,
      [idPropietario, idApartamento]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Residente registrado y apartamento asignado exitosamente.',
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

// PATCH /:id/estado - Alternar estado Activo / Inactivo
router.patch('/:id/estado', async (req, res, next) => {
  const { id } = req.params;
  const { nuevoEstado } = req.body;

  if (!['Activo', 'Inactivo'].includes(nuevoEstado)) {
    return res.status(400).json({ error: "El estado debe ser 'Activo' o 'Inactivo'." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query('UPDATE usuario SET estado = ? WHERE id = ?', [nuevoEstado, id]);

    await connection.query(
      `UPDATE propietario p
       INNER JOIN user_data ud ON p.id_user_data = ud.id
       SET p.estado = ?
       WHERE ud.id_usuario = ?`,
      [nuevoEstado, id]
    );

    await connection.query(
      `UPDATE propietario_gestion_apartamento pga
       INNER JOIN propietario p ON pga.id_propietario = p.id
       INNER JOIN user_data ud ON p.id_user_data = ud.id
       SET pga.estado = ?
       WHERE ud.id_usuario = ?`,
      [nuevoEstado, id]
    );

    await connection.commit();
    res.json({ message: `Estado del usuario actualizado a ${nuevoEstado}.` });
  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar estado:', error);
    next(error);
  } finally {
    connection.release();
  }
});

module.exports = router;