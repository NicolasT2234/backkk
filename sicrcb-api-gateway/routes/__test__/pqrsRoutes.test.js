// routes/__test__/pqrsRoutes.test.js
import 'dotenv/config';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import router from '../pqrsRoutes.js';
import { verificarRol } from '../../middlewares/auth.js';

// Simulamos el módulo de la base de datos
jest.mock('../../../sicrcb-backend/database/db.js', () => require('../../__mocks__/db.js'));
import pool from '../../../sicrcb-backend/database/db.js';

// Conexión simulada para métodos transaccionales (radicarPqr y eliminar)
const mockConn = {
  beginTransaction: jest.fn().mockResolvedValue(),
  query: jest.fn(),
  commit: jest.fn().mockResolvedValue(),
  rollback: jest.fn().mockResolvedValue(),
  release: jest.fn()
};
pool.getConnection = jest.fn().mockResolvedValue(mockConn);

// App de Express mínima para pruebas
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/pqrs', router);
app.use((err, req, res, next) => res.status(err.statusCode || 500).json({ error: err.message }));

describe('Pruebas de Caja Blanca - PQRS', () => {
  const tokenAdmin = jwt.sign({ id: 1, rol: 'Administrador' }, process.env.JWT_SECRET || 'secreto');
  const tokenResidente = jwt.sign({ id: 2, rol: 'Residente' }, process.env.JWT_SECRET || 'secreto');
  const authAdmin = ['Cookie', `sicrcb_token=${tokenAdmin}`];
  const authResidente = ['Cookie', `sicrcb_token=${tokenResidente}`];

  afterEach(() => {
    jest.clearAllMocks();
    pool.getConnection = jest.fn().mockResolvedValue(mockConn);
  });

  // --- GET / ---
  test('GET / sin token debe retornar 401', async () => {
    const res = await request(app).get('/pqrs');
    expect(res.statusCode).toBe(401);
  });

  test('GET / con token debe retornar lista de todas las PQRs', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, descripcion: 'Fuga', tipo: 'Petición' }], []]);
    const res = await request(app).get('/pqrs').set(...authAdmin);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  // --- GET /mi-apartamento ---
  test('GET /mi-apartamento debe retornar el apartamento activo del residente', async () => {
    pool.query.mockResolvedValueOnce([[{ idApartamento: 101, numeroApartamento: '101' }], []]);
    const res = await request(app).get('/pqrs/mi-apartamento').set(...authResidente);
    expect(res.statusCode).toBe(200);
    expect(res.body.apartamento.idApartamento).toBe(101);
  });

  // --- GET /mis-pqrs ---
  test('GET /mis-pqrs debe retornar las PQRs del residente en sesión', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 10, descripcion: 'Mía', tipo: 'Queja' }], []]);
    const res = await request(app).get('/pqrs/mis-pqrs').set(...authResidente);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  // --- GET /:id ---
  test('GET /:id debe retornar 404 si la PQR no existe', async () => {
    pool.query.mockResolvedValueOnce([[], []]);
    const res = await request(app).get('/pqrs/999').set(...authAdmin);
    expect(res.statusCode).toBe(404);
  });

  test('GET /:id debe retornar la PQR si existe', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, descripcion: 'Detalle PQR' }], []]);
    const res = await request(app).get('/pqrs/1').set(...authAdmin);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(1);
  });

  // --- POST / ---
  test('POST / debe rechazar si faltan campos obligatorios (400)', async () => {
    const res = await request(app).post('/pqrs').set(...authResidente).send({ descripcion: 'Incompleto' });
    expect(res.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('POST / debe crear PQR exitosamente resolviendo apartamento automáticamente', async () => {
    mockConn.query
      .mockResolvedValueOnce([[{ id: 10 }]]) // user_data
      .mockResolvedValueOnce([[{ id: 20 }]]) // propietario
      .mockResolvedValueOnce([[{ id_apartamento: 101 }]]) // gestion activa
      .mockResolvedValueOnce([[{ id: 1 }]]) // administrador
      .mockResolvedValueOnce([{ insertId: 77 }]) // queja_sugerencia
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // pqr_especifica

    const res = await request(app).post('/pqrs').set(...authResidente).send({
      descripcion: 'Luz fundida pasillo', tipo: 'Queja'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe(77);
  });

  // --- PUT /:id ---
  test('PUT /:id debe retornar 400 si el cuerpo no tiene campos para actualizar', async () => {
    const res = await request(app).put('/pqrs/1').set(...authAdmin).send({});
    expect(res.statusCode).toBe(400);
  });

  test('PUT /:id como Administrador debe actualizar descripción, tipo y estado exitosamente', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
    const res = await request(app).put('/pqrs/1').set(...authAdmin).send({
      descripcion: 'Actualizada admin', tipo: 'Sugerencia', estado: 'En proceso'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('PQR actualizada exitosamente');
  });

  test('PUT /:id como Residente debe rechazar si no es propietario de la PQR (403)', async () => {
    pool.query.mockResolvedValueOnce([[], []]); // verificarPropietarioPqr retorna vacío
    const res = await request(app).put('/pqrs/1').set(...authResidente).send({ descripcion: 'Intento ajeno' });
    expect(res.statusCode).toBe(403);
  });

  test('PUT /:id como Residente debe rechazar si la PQR no está en estado Pendiente (400)', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, estado: 'En proceso' }], []]);
    const res = await request(app).put('/pqrs/1').set(...authResidente).send({ descripcion: 'Ya procesada' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Pendiente');
  });

  test('PUT /:id como Residente debe actualizar exitosamente su PQR en estado Pendiente', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, estado: 'Pendiente' }], []]); // propietario verificado
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]); // update
    const res = await request(app).put('/pqrs/1').set(...authResidente).send({
      descripcion: 'Descripción corregida', tipo: 'Petición'
    });
    expect(res.statusCode).toBe(200);
  });

  // --- DELETE /:id ---
  test('DELETE /:id debe eliminar exitosamente transaccionalmente', async () => {
    mockConn.query.mockResolvedValue([{ affectedRows: 1 }]);
    const res = await request(app).delete('/pqrs/1').set(...authAdmin);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('PQR eliminada exitosamente');
  });

  // --- Seguridad y Roles ---
  test('GET / con token inválido debe responder 401', async () => {
    const res = await request(app).get('/pqrs').set('Cookie', 'sicrcb_token=invalido');
    expect(res.statusCode).toBe(401);
  });

  test('DELETE /:id con rol Residente debe responder 403', async () => {
    const res = await request(app).delete('/pqrs/1').set(...authResidente);
    expect(res.statusCode).toBe(403);
  });

  test('verificarRol sin usuario debe responder 401', () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    verificarRol('Admin')({}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('verificarRol sin propiedad rol debe responder 403', () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    verificarRol('Admin')({ usuario: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  // --- Manejo de Errores de Base de Datos (Catch) ---
  describe('Manejo de Errores de Base de Datos (Catch)', () => {
    test('GET / debe capturar error de BD y retornar 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo de conexión'));
      const res = await request(app).get('/pqrs').set(...authAdmin);
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Fallo de conexión');
    });

    test('GET /mi-apartamento debe capturar error y retornar 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo apto'));
      const res = await request(app).get('/pqrs/mi-apartamento').set(...authResidente);
      expect(res.statusCode).toBe(500);
    });

    test('GET /mis-pqrs debe capturar error y retornar 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo mis pqrs'));
      const res = await request(app).get('/pqrs/mis-pqrs').set(...authResidente);
      expect(res.statusCode).toBe(500);
    });

    test('GET /:id debe capturar error de BD y retornar 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo'));
      const res = await request(app).get('/pqrs/1').set(...authAdmin);
      expect(res.statusCode).toBe(500);
    });

    test('POST / debe capturar error y retornar 500', async () => {
      mockConn.query.mockRejectedValueOnce(new Error('Fallo al radicar'));
      const res = await request(app).post('/pqrs').set(...authResidente).send({
        descripcion: 'Fallo', tipo: 'Queja'
      });
      expect(res.statusCode).toBe(500);
    });

    test('PUT /:id debe capturar error y retornar 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo update'));
      const res = await request(app).put('/pqrs/1').set(...authAdmin).send({ descripcion: 'Update Error' });
      expect(res.statusCode).toBe(500);
    });

    test('DELETE /:id debe capturar error y retornar 500', async () => {
      mockConn.query.mockRejectedValueOnce(new Error('Fallo al eliminar transaccional'));
      const res = await request(app).delete('/pqrs/1').set(...authAdmin);
      expect(res.statusCode).toBe(500);
    });
  });
});