const pool = require('../db');

const getAllRoles = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rol');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRolById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rol WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createRol = async (req, res) => {
  try {
    const { nombre } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO rol (nombre) VALUES (?)',
      [nombre]
    );
    
    res.status(201).json({ id: result.insertId, nombre });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    
    const [result] = await pool.query(
      'UPDATE rol SET nombre = ? WHERE id = ?',
      [nombre, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }
    
    res.json({ message: 'Rol actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteRol = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM rol WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }
    
    res.json({ message: 'Rol eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllRoles,
  getRolById,
  createRol,
  updateRol,
  deleteRol
};
