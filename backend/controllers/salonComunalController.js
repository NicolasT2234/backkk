const pool = require('../db');

const getAllSalonComunal = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM salon_comunal');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSalonComunalById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM salon_comunal WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Salón comunal no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createSalonComunal = async (req, res) => {
  try {
    const { estado } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO salon_comunal (estado) VALUES (?)',
      [estado]
    );
    
    res.status(201).json({ id: result.insertId, estado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateSalonComunal = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    const [result] = await pool.query(
      'UPDATE salon_comunal SET estado = ? WHERE id = ?',
      [estado, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Salón comunal no encontrado' });
    }
    
    res.json({ message: 'Salón comunal actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteSalonComunal = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM salon_comunal WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Salón comunal no encontrado' });
    }
    
    res.json({ message: 'Salón comunal eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllSalonComunal,
  getSalonComunalById,
  createSalonComunal,
  updateSalonComunal,
  deleteSalonComunal
};
