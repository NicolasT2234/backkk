const pool = require('../db');

const getAllPropietarios = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM propietario');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPropietarioById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM propietario WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Propietario no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createPropietario = async (req, res) => {
  try {
    const { id_user_data, estado } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO propietario (id_user_data, estado) VALUES (?, ?)',
      [id_user_data, estado]
    );
    
    res.status(201).json({ id: result.insertId, id_user_data, estado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePropietario = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_user_data, estado } = req.body;
    
    const [result] = await pool.query(
      'UPDATE propietario SET id_user_data = ?, estado = ? WHERE id = ?',
      [id_user_data, estado, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Propietario no encontrado' });
    }
    
    res.json({ message: 'Propietario actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deletePropietario = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM propietario WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Propietario no encontrado' });
    }
    
    res.json({ message: 'Propietario eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllPropietarios,
  getPropietarioById,
  createPropietario,
  updatePropietario,
  deletePropietario
};
