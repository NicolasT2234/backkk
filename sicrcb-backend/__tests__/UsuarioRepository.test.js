const UsuarioRepository = require('../repositories/UsuarioRepository');

// Mock the database connection pool
jest.mock('../database/db', () => ({
  query: jest.fn()
}));

const pool = require('../database/db');

describe('UsuarioRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('obtenerPorId', () => {
    it('should return user data when user exists', async () => {
      const mockUser = [{ id: 1, nombre: 'Test User', email: 'test@example.com' }];
      pool.query.mockResolvedValue([mockUser]);

      const result = await UsuarioRepository.obtenerPorId(1);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id, nombre, email, password, estado, rol FROM usuario WHERE id = ?',
        [1]
      );
      expect(result).toEqual(mockUser[0]);
    });

    it('should return null when user does not exist', async () => {
      pool.query.mockResolvedValue([[]]);

      const result = await UsuarioRepository.obtenerPorId(999);

      expect(result).toBeNull();
    });
  });

  describe('obtenerPorEmail', () => {
    it('should return user data when email exists', async () => {
      const mockUser = [{ id: 1, nombre: 'Test User', email: 'test@example.com' }];
      pool.query.mockResolvedValue([mockUser]);

      const result = await UsuarioRepository.obtenerPorEmail('test@example.com');

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id, nombre, email, password, estado, rol FROM usuario WHERE email = ?',
        ['test@example.com']
      );
      expect(result).toEqual(mockUser[0]);
    });

    it('should return null when email does not exist', async () => {
      pool.query.mockResolvedValue([[]]);

      const result = await UsuarioRepository.obtenerPorEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('crear', () => {
    it('should insert a new user and return the insert ID', async () => {
      const mockResult = { insertId: 123 };
      pool.query.mockResolvedValue([mockResult]);

      const usuarioData = {
        nombre: 'New User',
        email: 'new@example.com',
        password: 'hashedpassword123',
        estado: 'Activo',
        rol: 'residente'
      };

      const result = await UsuarioRepository.crear(usuarioData);

      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO usuario (nombre, email, password, estado, rol) VALUES (?, ?, ?, ?, ?)',
        ['New User', 'new@example.com', 'hashedpassword123', 'Activo', 'residente']
      );
      expect(result).toBe(123);
    });
  });

  describe('actualizar', () => {
    it('should update user and return affected rows count', async () => {
      const mockResult = { affectedRows: 1 };
      pool.query.mockResolvedValue([mockResult]);

      const result = await UsuarioRepository.actualizar(1, { nombre: 'Updated Name' });

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE usuario SET nombre = ? WHERE id = ?',
        ['Updated Name', 1]
      );
      expect(result).toBe(true);
    });

    it('should return false when no rows are affected', async () => {
      const mockResult = { affectedRows: 0 };
      pool.query.mockResolvedValue([mockResult]);

      const result = await UsuarioRepository.actualizar(999, { nombre: 'Nonexistent User' });

      expect(result).toBe(false);
    });
  });

  describe('eliminar', () => {
    it('should delete user and return affected rows count', async () => {
      const mockResult = { affectedRows: 1 };
      pool.query.mockResolvedValue([mockResult]);

      const result = await UsuarioRepository.eliminar(1);

      expect(pool.query).toHaveBeenCalledWith('DELETE FROM usuario WHERE id = ?', [1]);
      expect(result).toBe(true);
    });

    it('should return false when no rows are affected', async () => {
      const mockResult = { affectedRows: 0 };
      pool.query.mockResolvedValue([mockResult]);

      const result = await UsuarioRepository.eliminar(999);

      expect(result).toBe(false);
    });
  });

  describe('listarTodos', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { id: 1, nombre: 'User 1', email: 'user1@example.com' },
        { id: 2, nombre: 'User 2', email: 'user2@example.com' }
      ];
      pool.query.mockResolvedValue([mockUsers]);

      const result = await UsuarioRepository.listarTodos();

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id, nombre, email, password, estado, rol FROM usuario'
      );
      expect(result).toEqual(mockUsers);
    });
  });
});