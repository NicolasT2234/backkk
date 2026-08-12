const pool = require('../db');

const getAllUserData = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM user_data');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserDataById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM user_data WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Datos de usuario no encontrados' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createUserData = async (req, res) => {
  try {
    const { numero_documento, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, id_usuario, id_tipo_documento } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO user_data (numero_documento, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, id_usuario, id_tipo_documento) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [numero_documento, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, id_usuario, id_tipo_documento]
    );
    
    res.status(201).json({ id: result.insertId, numero_documento, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, id_usuario, id_tipo_documento });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUserData = async (req, res) => {
  try {
    const { id } = req.params;
    const { numero_documento, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, id_usuario, id_tipo_documento } = req.body;
    
    const [result] = await pool.query(
      'UPDATE user_data SET numero_documento = ?, primer_nombre = ?, segundo_nombre = ?, primer_apellido = ?, segundo_apellido = ?, id_usuario = ?, id_tipo_documento = ? WHERE id = ?',
      [numero_documento, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, id_usuario, id_tipo_documento, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Datos de usuario no encontrados' });
    }
    
    res.json({ message: 'Datos de usuario actualizados exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteUserData = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM user_data WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Datos de usuario no encontrados' });
    }
    
    res.json({ message: 'Datos de usuario eliminados exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllUserData,
  getUserDataById,
  createUserData,
  updateUserData,
  deleteUserData
};
