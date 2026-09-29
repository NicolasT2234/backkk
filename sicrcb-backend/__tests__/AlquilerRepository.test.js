const AlquilerRepository = require('../repositories/AlquilerRepository');

// Mock the database connection pool
jest.mock('../database/db', () => ({
  query: jest.fn()
}));

const pool = require('../database/db');

describe('AlquilerRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('obtenerConfiguracion', () => {
    it('should return configuration with default values when no data exists', async () => {
      pool.query
        .mockResolvedValueOnce([[]]) // salon_comunal query
        .mockResolvedValueOnce([[]]); // silla query

      const result = await AlquilerRepository.obtenerConfiguracion();

      expect(result).toEqual({
        valorHoraSalon: 50000,
        valorHoraSillas: 20000,
        totalSillas: 120
      });
    });

    it('should return configuration with actual values when data exists', async () => {
      pool.query
        .mockResolvedValueOnce([[{ valor_hora: 75000 }]]) // salon_comunal query
        .mockResolvedValueOnce([[{ cantidad: 150, valor_hora: 25000 }]]); // silla query

      const result = await AlquilerRepository.obtenerConfiguracion();

      expect(result).toEqual({
        valorHoraSalon: 75000,
        valorHoraSillas: 25000,
        totalSillas: 150
      });
    });
  });

  describe('actualizarConfiguracion', () => {
    it('should update salon configuration when provided', async () => {
      await AlquilerRepository.actualizarConfiguracion({ valorHoraSalon: 80000 });

      expect(pool.query).toHaveBeenCalledWith(
        `INSERT INTO salon_comunal (id, estado, valor_hora)
         VALUES (1, 'Disponible', ?)
         ON DUPLICATE KEY UPDATE valor_hora = VALUES(valor_hora)`,
        [80000]
      );
    });

    it('should update silla configuration when provided', async () => {
      await AlquilerRepository.actualizarConfiguracion({
        valorHoraSillas: 30000,
        totalSillas: 200
      });

      expect(pool.query).toHaveBeenCalledWith(
        `INSERT INTO silla (id, cantidad, estado, valor_hora)
         VALUES (1, ?, 'Disponible', ?)
         ON DUPLICATE KEY UPDATE cantidad = VALUES(cantidad), valor_hora = VALUES(valor_hora)`,
        [200, 30000]
      );
    });
  });

  describe('obtenerReservasPorFecha', () => {
    it('should return reservations for the given date', async () => {
      const mockReservas = [
        {
          id: 1,
          hora_inicio: '08:00:00',
          hora_fin: '10:00:00',
          descripcion: 'Evento 1',
          estado: 'Confirmado',
          cantidad_sillas: 10
        }
      ];
      pool.query.mockResolvedValue([mockReservas]);

      const result = await AlquilerRepository.obtenerReservasPorFecha('2026-09-29');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT a.id, a.id_salon_comunal'),
        ['2026-09-29']
      );
      expect(result).toEqual(mockReservas);
    });
  });

  describe('listarTodos', () => {
    it('should return all reservations with proprietario details', async () => {
      const mockReservas = [
        {
          id: 1,
          descripcion: 'Evento 1',
          hora_inicio: '08:00:00',
          hora_fin: '10:00:00',
          valor_hora: 50000,
          estado: 'Confirmado',
          id_propietario: 1,
          nombre_propietario: 'Juan',
          apellido_propietario: 'Perez',
          id_salon_comunal: 1,
          cantidad_sillas_alquiladas: 5,
          tipo_alquiler: 'ambos'
        }
      ];
      pool.query.mockResolvedValue([mockReservas]);

      const result = await AlquilerRepository.listarTodos();

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT a.id, a.descripcion, a.hora_inicio')
      );
      expect(result).toEqual(mockReservas);
    });
  });

  describe('listarPorUsuario', () => {
    it('should return reservations for the given user ID', async () => {
      const mockReservas = [
        {
          id: 1,
          descripcion: 'Evento 1',
          hora_inicio: '08:00:00',
          hora_fin: '10:00:00',
          valor_hora: 50000,
          estado: 'Confirmado',
          id_salon_comunal: 1,
          cantidad_sillas_alquiladas: 5,
          tipo_alquiler: 'ambos'
        }
      ];
      pool.query.mockResolvedValue([mockReservas]);

      const result = await AlquilerRepository.listarPorUsuario(1);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT a.id, a.descripcion, a.hora_inicio'),
        [1]
      );
      expect(result).toEqual(mockReservas);
    });
  });

  describe('obtenerPorId', () => {
    it('should return reservation details when reservation exists', async () => {
      const mockReserva = [{
        id: 1,
        descripcion: 'Evento 1',
        hora_inicio: '08:00:00',
        hora_fin: '10:00:00',
        valor_hora: 50000,
        estado: 'Confirmado',
        id_propietario: 1,
        id_usuario: 123,
        nombre_propietario: 'Juan',
        apellido_propietario: 'Perez',
        id_salon_comunal: 1
      }];
      pool.query.mockResolvedValue([mockReserva]);

      const result = await AlquilerRepository.obtenerPorId(1);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT a.id, a.descripcion, a.hora_inicio'),
        [1]
      );
      expect(result).toEqual(mockReserva[0]);
    });

    it('should return null when reservation does not exist', async () => {
      pool.query.mockResolvedValue([[]]);

      const result = await AlquilerRepository.obtenerPorId(999);

      expect(result).toBeNull();
    });
  });

  describe('crearReserva', () => {
    const mockConnection = {
      beginTransaction: jest.fn(),
      query: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };

    beforeEach(() => {
      jest.clearAllMocks();
      pool.getConnection.mockResolvedValue(mockConnection);
    });

    it('should create a reservation successfully', async () => {
      // Mock the queries for propietario lookup
      pool.getConnection.mockResolvedValueOnce(mockConnection);

      // Mock propietario query
      mockConnection.query.mockResolvedValueOnce([[{ id: 1 }]]); // propietario

      // Mock configuration queries
      mockConnection.query.mockResolvedValueOnce([[{ valor_hora: 50000 }]]); // salon_comunal
      mockConnection.query.mockResolvedValueOnce([[{ valor_hora: 20000, cantidad: 120 }]]); // silla

      // Mock validation queries (no conflicts)
      mockConnection.query.mockResolvedValueOnce([[{ id: 1 }]]); // salon_comunal (for ID)
      mockConnection.query.mockResolvedValueOnce([[]]); // no salon conflicts
      mockConnection.query.mockResolvedValueOnce([[{ total_ocupadas: 0 }]]); // no silla conflicts

      // Mock insert queries
      mockConnection.query.mockResolvedValueOnce([{ insertId: 123 }]); // insert alquiler
      mockConnection.query.mockResolvedValueOnce([[{ id: 1 }]]); // insert alquiler_silla (silla lookup)

      const result = await AlquilerRepository.crearReserva(123, {
        descripcion: 'Evento de prueba',
        horaInicio: '08:00:00',
        horaFin: '10:00:00',
        tipoAlquiler: 'ambos',
        cantidadSillas: 5
      });

      expect(result).toEqual({ id: 123, valorHora: 70000 }); // 50000 + 20000
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should throw error when no propietario is found', async () => {
      pool.getConnection.mockResolvedValueOnce(mockConnection);
      mockConnection.query.mockResolvedValueOnce([[]]); // no propietario found

      await expect(
        AlquilerRepository.crearReserva(999, {
          descripcion: 'Evento de prueba',
          horaInicio: '08:00:00',
          horaFin: '10:00:00',
          tipoAlquiler: 'salon',
          cantidadSillas: 0
        })
      ).rejects.toThrow('No se encontró un propietario asociado a este usuario.');

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('actualizarEstado', () => {
    it('should update reservation status', async () => {
      await AlquilerRepository.actualizarEstado(1, 'Finalizado');

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE alquiler SET estado = ? WHERE id = ?',
        ['Finalizado', 1]
      );
    });
  });

  describe('eliminarReserva', () => {
    const mockConnection = {
      beginTransaction: jest.fn(),
      query: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };

    beforeEach(() => {
      jest.clearAllMocks();
      pool.getConnection.mockResolvedValue(mockConnection);
    });

    it('should delete reservation successfully', async () => {
      await AlquilerRepository.eliminarReserva(1);

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith('DELETE FROM alquiler_silla WHERE id_alquiler = ?', [1]);
      expect(mockConnection.query).toHaveBeenCalledWith('DELETE FROM alquiler WHERE id = ?', [1]);
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      mockConnection.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(AlquilerRepository.eliminarReserva(1)).rejects.toThrow('Database error');

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });
});