const pool = require('../db');

const getAllBloques = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM bloque');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getBloqueById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM bloque WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Bloque no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createBloque = async (req, res) => {
  try {
    const { nombre } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO bloque (nombre) VALUES (?)',
      [nombre]
    );
    
    res.status(201).json({ id: result.insertId, nombre });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateBloque = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    
    const [result] = await pool.query(
      'UPDATE bloque SET nombre = ? WHERE id = ?',
      [nombre, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Bloque no encontrado' });
    }
    
    res.json({ message: 'Bloque actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteBloque = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM bloque WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Bloque no encontrado' });
    }
    
    res.json({ message: 'Bloque eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllBloques,
  getBloqueById,
  createBloque,
  updateBloque,
  deleteBloque
};
