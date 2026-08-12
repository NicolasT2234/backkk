// Base controller with common CRUD operations
class BaseController {
  constructor(tableName, pool) {
    this.tableName = tableName;
    this.pool = pool;
  }

  async getAll(req, res) {
    try {
      const [rows] = await this.pool.query(`SELECT * FROM ${this.tableName}`);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const [rows] = await this.pool.query(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [req.params.id]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Registro no encontrado' });
      }
      
      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      const { id, ...data } = req.body; // Remove id if present (auto-increment)
      
      const columns = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);
      
      const [result] = await this.pool.query(
        `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`,
        values
      );
      
      res.status(201).json({ id: result.insertId, ...data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id, ...data } = req.body;
      
      if (!id || id !== parseInt(req.params.id)) {
        return res.status(400).json({ message: 'ID no válido' });
      }
      
      const setClause = Object.keys(data)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(data), id];
      
      const [result] = await this.pool.query(
        `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`,
        values
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Registro no encontrado' });
      }
      
      res.json({ message: 'Registro actualizado exitosamente' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const [result] = await this.pool.query(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [req.params.id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Registro no encontrado' });
      }
      
      res.json({ message: 'Registro eliminado exitosamente' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = BaseController;
