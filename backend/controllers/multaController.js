const pool = require('../db');

const getAllMultas = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM multa');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMultaById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM multa WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Multa no encontrada' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createMulta = async (req, res) => {
  try {
    const { numero, nombre, descripcion, estado, id_tipo_multa, id_apartamento, id_administrador, evidencia } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO multa (numero, nombre, descripcion, estado, id_tipo_multa, id_apartamento, id_administrador, evidencia) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [numero, nombre, descripcion, estado, id_tipo_multa, id_apartamento, id_administrador, evidencia]
    );
    
    res.status(201).json({ id: result.insertId, numero, nombre, descripcion, estado, id_tipo_multa, id_apartamento, id_administrador, evidencia });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateMulta = async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, nombre, descripcion, estado, id_tipo_multa, id_apartamento, id_administrador, evidencia } = req.body;
    
    const [result] = await pool.query(
      'UPDATE multa SET numero = ?, nombre = ?, descripcion = ?, estado = ?, id_tipo_multa = ?, id_apartamento = ?, id_administrador = ?, evidencia = ? WHERE id = ?',
      [numero, nombre, descripcion, estado, id_tipo_multa, id_apartamento, id_administrador, evidencia, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Multa no encontrada' });
    }
    
    res.json({ message: 'Multa actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteMulta = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM multa WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Multa no encontrada' });
    }
    
    res.json({ message: 'Multa eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllMultas,
  getMultaById,
  createMulta,
  updateMulta,
  deleteMulta
};
