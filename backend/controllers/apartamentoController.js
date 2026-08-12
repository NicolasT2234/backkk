const pool = require('../db');

const getAllApartamentos = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM apartamento');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getApartamentoById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM apartamento WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Apartamento no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createApartamento = async (req, res) => {
  try {
    const { estado, numero, id_interior } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO apartamento (estado, numero, id_interior) VALUES (?, ?, ?)',
      [estado, numero, id_interior]
    );
    
    res.status(201).json({ id: result.insertId, estado, numero, id_interior });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateApartamento = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, numero, id_interior } = req.body;
    
    const [result] = await pool.query(
      'UPDATE apartamento SET estado = ?, numero = ?, id_interior = ? WHERE id = ?',
      [estado, numero, id_interior, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Apartamento no encontrado' });
    }
    
    res.json({ message: 'Apartamento actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteApartamento = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM apartamento WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Apartamento no encontrado' });
    }
    
    res.json({ message: 'Apartamento eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllApartamentos,
  getApartamentoById,
  createApartamento,
  updateApartamento,
  deleteApartamento
};
