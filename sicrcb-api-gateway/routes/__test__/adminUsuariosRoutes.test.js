// routes/__test__/adminUsuariosRoutes.test.js
import 'dotenv/config';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import router from '../adminUsuariosRoutes.js';
import { verificarRol } from '../../middlewares/auth.js';

// Simulamos el módulo de la base de datos
jest.mock('../../../sicrcb-backend/database/db.js', () => require('../../__mocks__/db.js'));
import pool from '../../../sicrcb-backend/database/db.js';

// Creamos una app de Express mínima solo para las pruebas
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/admin/usuarios', router);
app.use((err, req, res, next) => res.status(err.statusCode || 500).json({ error: err.message }));

describe('Pruebas de Caja Blanca - Admin Usuarios', () => {
  const token = jwt.sign({ id: 1, rol: 'Administrador' }, process.env.JWT_SECRET || 'secreto');
  const auth = ['Cookie', `sicrcb_token=${token}`];

  afterEach(() => jest.clearAllMocks());

  // --- GET / ---
  test('GET / sin token debe retornar 401', async () => {
    const res = await request(app).get('/admin/usuarios');
    expect(res.statusCode).toBe(401);
  });

  test('GET / debe listar los usuarios del sistema para Administrador', async () => {
    pool.query.mockResolvedValueOnce([[{ id_usuario: 1, email: 'admin@sicrcb.com', rol: 'Administrador' }], []]);
    const res = await request(app).get('/admin/usuarios').set(...auth);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('usuarios');
  });

  test('GET / con búsqueda debe consultar con filtro search', async () => {
    pool.query.mockResolvedValueOnce([[], []]);
    const res = await request(app).get('/admin/usuarios?search=Carlos').set(...auth);
    expect(res.statusCode).toBe(200);
    expect(res.body.usuarios).toBeDefined();
  });

  // --- GET /catalogos ---
  test('GET /catalogos debe retornar tipos de documento y apartamentos', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 1, sigla: 'CC' }], []])
      .mockResolvedValueOnce([[{ id: 1, numero_apto: '101' }], []]);
    const res = await request(app).get('/admin/usuarios/catalogos').set(...auth);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('tiposDocumento');
    expect(res.body).toHaveProperty('apartamentos');
  });

  // --- POST / ---
  test('POST / debe rechazar si faltan campos obligatorios', async () => {
    const res = await request(app).post('/admin/usuarios').set(...auth).send({ email: 'incompleto@correo.com' });
    expect(res.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('POST / debe registrar un nuevo residente exitosamente', async () => {
    const mockConn = await pool.getConnection();
    mockConn.query
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([{ insertId: 50 }, []])
      .mockResolvedValueOnce([{ insertId: 50 }, []])
      .mockResolvedValueOnce([{ insertId: 50 }, []])
      .mockResolvedValueOnce([{ insertId: 50 }, []]);

    const res = await request(app).post('/admin/usuarios').set(...auth).send({
      email: 'pedro.perez@gmail.com', primerNombre: 'Pedro', primerApellido: 'Pérez',
      idTipoDocumento: 1, numeroDocumento: '10203040', idApartamentos: [1]
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message');
  });

  // --- PUT /:id ---
  test('PUT /:id debe actualizar residente exitosamente', async () => {
    const mockConn = await pool.getConnection();
    mockConn.query
      .mockResolvedValueOnce([[{ id: 10 }], []])
      .mockResolvedValue([[], []]);

    const res = await request(app).put('/admin/usuarios/1').set(...auth).send({
      primerNombre: 'Pedro', primerApellido: 'Pérez', idTipoDocumento: 1, numeroDocumento: '10203040'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('actualizados exitosamente');
  });

  // --- PATCH /:id/estado ---
  test('PATCH /:id/estado debe rechazar estados no permitidos', async () => {
    const res = await request(app).patch('/admin/usuarios/1/estado').set(...auth).send({ nuevoEstado: 'Suspendido' });
    expect(res.statusCode).toBe(400);
  });

  test('PATCH /:id/estado debe actualizar estado exitosamente', async () => {
    const mockConn = await pool.getConnection();
    mockConn.query.mockResolvedValue([[], []]);
    const res = await request(app).patch('/admin/usuarios/1/estado').set(...auth).send({ nuevoEstado: 'Activo' });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('actualizado a Activo');
  });

  // --- Seguridad y Roles ---
  test('GET / con rol Residente debe responder 403', async () => {
    const tokenRes = jwt.sign({ id: 2, rol: 'Residente' }, process.env.JWT_SECRET || 'secreto');
    const res = await request(app).get('/admin/usuarios').set('Cookie', `sicrcb_token=${tokenRes}`);
    expect(res.statusCode).toBe(403);
  });

  test('GET / con token corrupto debe responder 401', async () => {
    const res = await request(app).get('/admin/usuarios').set('Cookie', 'sicrcb_token=corrupto');
    expect(res.statusCode).toBe(401);
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

  test('verificarRol con rol autorizado debe llamar a next()', () => {
    const next = jest.fn();
    verificarRol('Admin')({ usuario: { rol: 'Admin' } }, {}, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  // --- Manejo de Errores de Base de Datos (Catch) ---
  describe('Manejo de Errores de Base de Datos (Catch)', () => {
    test('GET / debe capturar error de BD y retornar 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo de conexión'));
      const res = await request(app).get('/admin/usuarios').set(...auth);
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Fallo de conexión');
    });

    test('GET /catalogos debe capturar error de BD y retornar 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo'));
      const res = await request(app).get('/admin/usuarios/catalogos').set(...auth);
      expect(res.statusCode).toBe(500);
    });

    test('POST / debe capturar error inesperado y retornar 500', async () => {
      pool.getConnection.mockRejectedValueOnce(new Error('Fallo transaccional'));
      const res = await request(app).post('/admin/usuarios').set(...auth).send({
        email: 'p@p.com', primerNombre: 'P', primerApellido: 'P', idTipoDocumento: 1, numeroDocumento: '123', idApartamentos: [1]
      });
      expect(res.statusCode).toBe(500);
    });

    test('PUT /:id debe capturar error inesperado y retornar 500', async () => {
      pool.getConnection.mockRejectedValueOnce(new Error('Fallo'));
      const res = await request(app).put('/admin/usuarios/1').set(...auth).send({
        primerNombre: 'P', primerApellido: 'P', idTipoDocumento: 1, numeroDocumento: '123'
      });
      expect(res.statusCode).toBe(500);
    });

    test('PATCH /:id/estado debe capturar error inesperado y retornar 500', async () => {
      pool.getConnection.mockRejectedValueOnce(new Error('Fallo'));
      const res = await request(app).patch('/admin/usuarios/1/estado').set(...auth).send({ nuevoEstado: 'Activo' });
      expect(res.statusCode).toBe(500);
    });
  });
});