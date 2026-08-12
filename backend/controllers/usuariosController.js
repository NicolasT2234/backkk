const pool = require('../db');

const getAllUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, email, estado, image_url FROM usuario');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUsuarioById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, estado, image_url FROM usuario WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createUsuario = async (req, res) => {
  try {
    const { email, contraseña, estado, image_url } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO usuario (email, contraseña, estado, image_url) VALUES (?, ?, ?, ?)',
      [email, contraseña, estado, image_url]
    );
    
    res.status(201).json({ 
      id: result.insertId, 
      email, 
      estado, 
      image_url 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, contraseña, estado, image_url } = req.body;
    
    const [result] = await pool.query(
      'UPDATE usuario SET email = ?, contraseña = ?, estado = ?, image_url = ? WHERE id = ?',
      [email, contraseña, estado, image_url, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteUsuario = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM usuario WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario
};
