const AdminUsuarioRepository = require('../repositories/AdminUsuarioRepository');

// Mock the database connection pool
jest.mock('../database/db', () => ({
  query: jest.fn()
}));

const pool = require('../database/db');

describe('AdminUsuarioRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('obtenerPorId', () => {
    it('should return admin user data when admin exists', async () => {
      const mockAdmin = [{ id: 1, nombre: 'Admin User', email: 'admin@example.com' }];
      pool.query.mockResolvedValue([mockAdmin]);

      const result = await AdminUsuarioRepository.obtenerPorId(1);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id, nombre, email, password, estado FROM administrador WHERE id = ?',
        [1]
      );
      expect(result).toEqual(mockAdmin[0]);
    });

    it('should return null when admin does not exist', async () => {
      pool.query.mockResolvedValue([[]]);

      const result = await AdminUsuarioRepository.obtenerPorId(999);

      expect(result).toBeNull();
    });
  });

  describe('obtenerPorEmail', () => {
    it('should return admin user data when email exists', async () => {
      const mockAdmin = [{ id: 1, nombre: 'Admin User', email: 'admin@example.com' }];
      pool.query.mockResolvedValue([mockAdmin]);

      const result = await AdminUsuarioRepository.obtenerPorEmail('admin@example.com');

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id, nombre, email, password, estado FROM administrador WHERE email = ?',
        ['admin@example.com']
      );
      expect(result).toEqual(mockAdmin[0]);
    });

    it('should return null when email does not exist', async () => {
      pool.query.mockResolvedValue([[]]);

      const result = await AdminUsuarioRepository.obtenerPorEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('crear', () => {
    it('should insert a new admin user and return the insert ID', async () => {
      const mockResult = { insertId: 123 };
      pool.query.mockResolvedValue([mockResult]);

      const adminData = {
        nombre: 'New Admin',
        email: 'newadmin@example.com',
        password: 'hashedpassword123',
        estado: 'Activo'
      };

      const result = await AdminUsuarioRepository.crear(adminData);

      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO administrador (nombre, email, password, estado) VALUES (?, ?, ?, ?)',
        ['New Admin', 'newadmin@example.com', 'hashedpassword123', 'Activo']
      );
      expect(result).toBe(123);
    });
  });

  describe('actualizar', () => {
    it('should update admin user and return affected rows count', async () => {
      const mockResult = { affectedRows: 1 };
      pool.query.mockResolvedValue([mockResult]);

      const result = await AdminUsuarioRepository.actualizar(1, { nombre: 'Updated Admin Name' });

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE administrador SET nombre = ? WHERE id = ?',
        ['Updated Admin Name', 1]
      );
      expect(result).toBe(true);
    });

    it('should return false when no rows are affected', async () => {
      const mockResult = { affectedRows: 0 };
      pool.query.mockResolvedValue([mockResult]);

      const result = await AdminUsuarioRepository.actualizar(999, { nombre: 'Nonexistent Admin' });

      expect(result).toBe(false);
    });
  });

  describe('eliminar', () => {
    it('should delete admin user and return affected rows count', async () => {
      const mockResult = { affectedRows: 1 };
      pool.query.mockResolvedValue([mockResult]);

      const result = await AdminUsuarioRepository.eliminar(1);

      expect(pool.query).toHaveBeenCalledWith('DELETE FROM administrador WHERE id = ?', [1]);
      expect(result).toBe(true);
    });

    it('should return false when no rows are affected', async () => {
      const mockResult = { affectedRows: 0 };
      pool.query.mockResolvedValue([mockResult]);

      const result = await AdminUsuarioRepository.eliminar(999);

      expect(result).toBe(false);
    });
  });

  describe('listarTodos', () => {
    it('should return all admin users', async () => {
      const mockAdmins = [
        { id: 1, nombre: 'Admin 1', email: 'admin1@example.com' },
        { id: 2, nombre: 'Admin 2', email: 'admin2@example.com' }
      ];
      pool.query.mockResolvedValue([mockAdmins]);

      const result = await AdminUsuarioRepository.listarTodos();

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id, nombre, email, password, estado FROM administrador'
      );
      expect(result).toEqual(mockAdmins);
    });
  });

  describe('cambiarEstado', () => {
    it('should update admin status and return affected rows count', async () => {
      const mockResult = { affectedRows: 1 };
      pool.query.mockResolvedValue([mockResult]);

      const result = await AdminUsuarioRepository.cambiarEstado(1, 'Inactivo');

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE administrador SET estado = ? WHERE id = ?',
        ['Inactivo', 1]
      );
      expect(result).toBe(true);
    });
  });
});