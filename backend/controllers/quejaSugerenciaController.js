const pool = require('../db');

const getAllQuejasSugerencias = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM queja_sugerencia');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getQuejaSugerenciaById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM queja_sugerencia WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Queja/sugerencia no encontrada' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createQuejaSugerencia = async (req, res) => {
  try {
    const { id_propietario, id_administrador, descripcion_pqr, titulo_pqr, estado, fecha, evidencias } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO queja_sugerencia (id_propietario, id_administrador, descripcion_pqr, titulo_pqr, estado, fecha, evidencias) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id_propietario, id_administrador, descripcion_pqr, titulo_pqr, estado, fecha, evidencias]
    );
    
    res.status(201).json({ id: result.insertId, id_propietario, id_administrador, descripcion_pqr, titulo_pqr, estado, fecha, evidencias });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateQuejaSugerencia = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_propietario, id_administrador, descripcion_pqr, titulo_pqr, estado, fecha, evidencias } = req.body;
    
    const [result] = await pool.query(
      'UPDATE queja_sugerencia SET id_propietario = ?, id_administrador = ?, descripcion_pqr = ?, titulo_pqr = ?, estado = ?, fecha = ?, evidencias = ? WHERE id = ?',
      [id_propietario, id_administrador, descripcion_pqr, titulo_pqr, estado, fecha, evidencias, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Queja/sugerencia no encontrada' });
    }
    
    res.json({ message: 'Queja/sugerencia actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteQuejaSugerencia = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM queja_sugerencia WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Queja/sugerencia no encontrada' });
    }
    
    res.json({ message: 'Queja/sugerencia eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllQuejasSugerencias,
  getQuejaSugerenciaById,
  createQuejaSugerencia,
  updateQuejaSugerencia,
  deleteQuejaSugerencia
};
