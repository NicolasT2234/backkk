const pool = require('../db');

const getAllInteriores = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM interior');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getInteriorById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM interior WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Interior no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createInterior = async (req, res) => {
  try {
    const { numero, id_bloque } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO interior (numero, id_bloque) VALUES (?, ?)',
      [numero, id_bloque]
    );
    
    res.status(201).json({ id: result.insertId, numero, id_bloque });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateInterior = async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, id_bloque } = req.body;
    
    const [result] = await pool.query(
      'UPDATE interior SET numero = ?, id_bloque = ? WHERE id = ?',
      [numero, id_bloque, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Interior no encontrado' });
    }
    
    res.json({ message: 'Interior actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteInterior = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM interior WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Interior no encontrado' });
    }
    
    res.json({ message: 'Interior eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllInteriores,
  getInteriorById,
  createInterior,
  updateInterior,
  deleteInterior
};
