const pool = require('../db');

const getAllPropietarioGestionApartamento = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM propietario_gestion_apartamento');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPropietarioGestionApartamentoById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM propietario_gestion_apartamento WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Registro de propietario-gestión-apartamento no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createPropietarioGestionApartamento = async (req, res) => {
  try {
    const { id_propietario, id_apartamento, fecha_registro, estado } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO propietario_gestion_apartamento (id_propietario, id_apartamento, fecha_registro, estado) VALUES (?, ?, ?, ?)',
      [id_propietario, id_apartamento, fecha_registro, estado]
    );
    
    res.status(201).json({ id: result.insertId, id_propietario, id_apartamento, fecha_registro, estado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePropietarioGestionApartamento = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_propietario, id_apartamento, fecha_registro, estado } = req.body;
    
    const [result] = await pool.query(
      'UPDATE propietario_gestion_apartamento SET id_propietario = ?, id_apartamento = ?, fecha_registro = ?, estado = ? WHERE id = ?',
      [id_propietario, id_apartamento, fecha_registro, estado, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Registro de propietario-gestión-apartamento no encontrado' });
    }
    
    res.json({ message: 'Registro de propietario-gestión-apartamento actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deletePropietarioGestionApartamento = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM propietario_gestion_apartamento WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Registro de propietario-gestión-apartamento no encontrado' });
    }
    
    res.json({ message: 'Registro de propietario-gestión-apartamento eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllPropietarioGestionApartamento,
  getPropietarioGestionApartamentoById,
  createPropietarioGestionApartamento,
  updatePropietarioGestionApartamento,
  deletePropietarioGestionApartamento
};
