const pool = require('../db');

const getAllTipoMulta = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tipo_multa');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTipoMultaById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tipo_multa WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Tipo de multa no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createTipoMulta = async (req, res) => {
  try {
    const { numero, descripcion, valor, estado } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO tipo_multa (numero, descripcion, valor, estado) VALUES (?, ?, ?, ?)',
      [numero, descripcion, valor, estado]
    );
    
    res.status(201).json({ id: result.insertId, numero, descripcion, valor, estado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateTipoMulta = async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, descripcion, valor, estado } = req.body;
    
    const [result] = await pool.query(
      'UPDATE tipo_multa SET numero = ?, descripcion = ?, valor = ?, estado = ? WHERE id = ?',
      [numero, descripcion, valor, estado, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Tipo de multa no encontrado' });
    }
    
    res.json({ message: 'Tipo de multa actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteTipoMulta = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM tipo_multa WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Tipo de multa no encontrado' });
    }
    
    res.json({ message: 'Tipo de multa eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllTipoMulta,
  getTipoMultaById,
  createTipoMulta,
  updateTipoMulta,
  deleteTipoMulta
};
