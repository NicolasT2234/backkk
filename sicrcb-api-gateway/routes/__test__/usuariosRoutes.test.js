// routes/__test__/usuariosRoutes.test.js
import 'dotenv/config';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import router from '../usuariosRoutes.js';
import { verificarRol } from '../../middlewares/auth.js';

// Simulamos el módulo de la base de datos
jest.mock('../../../sicrcb-backend/database/db.js', () => require('../../__mocks__/db.js'));
import pool from '../../../sicrcb-backend/database/db.js';

// Creamos una app de Express mínima solo para las pruebas
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/usuarios', router);

describe('Pruebas de Caja Blanca - Usuarios', () => {
  const token = jwt.sign({ id: 1, rol: 'Residente' }, process.env.JWT_SECRET || 'secreto');
  const auth = ['Cookie', `sicrcb_token=${token}`];
  const mockPerfil = { id: 1, email: 'carlos@gmail.com', nombres: 'Carlos', apellidos: 'Ramírez' };

  afterEach(() => jest.clearAllMocks());

  // --- GET /me ---
  test('GET /me sin token debe retornar 401', async () => {
    const res = await request(app).get('/api/usuarios/me');
    expect(res.statusCode).toBe(401);
  });

  test('GET /me debe retornar 404 si el usuario no existe en BD', async () => {
    pool.query.mockResolvedValueOnce([[], []]);
    const res = await request(app).get('/api/usuarios/me').set(...auth);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toContain('Usuario no encontrado');
  });

  test('GET /me con token debe retornar el perfil del usuario', async () => {
    pool.query.mockResolvedValueOnce([[mockPerfil], []]);
    const res = await request(app).get('/api/usuarios/me').set(...auth);
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe('carlos@gmail.com');
  });

  // --- PUT /me ---
  test('PUT /me debe rechazar si el nombre contiene números o caracteres inválidos', async () => {
    const res = await request(app).put('/api/usuarios/me').set(...auth).send({ nombres: 'Carlos123' });
    expect(res.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('PUT /me debe rechazar si la contraseña tiene menos de 6 caracteres', async () => {
    const res = await request(app).put('/api/usuarios/me').set(...auth).send({ contraseña: '123' });
    expect(res.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('PUT /me debe actualizar el perfil del usuario exitosamente', async () => {
    const mockConn = await pool.getConnection();
    mockConn.query
      .mockResolvedValueOnce([[{ id: 10 }], []])
      .mockResolvedValue([[], []]);
    pool.query.mockResolvedValueOnce([[mockPerfil], []]);

    const res = await request(app).put('/api/usuarios/me').set(...auth).send({
      nombres: 'Carlos Andrés', apellidos: 'Ramírez Pérez', contraseña: 'nuevaClaveSegura123'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email');
  });

  // --- Seguridad y Roles ---
  test('GET /me con token corrupto o inválido debe responder 401', async () => {
    const res = await request(app).get('/api/usuarios/me').set('Cookie', 'sicrcb_token=corrupto');
    expect(res.statusCode).toBe(401);
  });

  test('verificarRol con rol no autorizado debe responder 403', () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    verificarRol('Admin')({ usuario: { rol: 'Residente' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
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
    verificarRol('Residente')({ usuario: { rol: 'Residente' } }, {}, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  // --- Manejo de Errores de Base de Datos (Catch) ---
  describe('Manejo de Errores de Base de Datos (Catch)', () => {

    test('GET /me debe capturar error de BD y retornar 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo MySQL'));
      const res = await request(app).get('/api/usuarios/me').set(...auth);
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Fallo MySQL');
    });

    test('PUT /me debe capturar error de BD y retornar 500', async () => {
      pool.getConnection.mockRejectedValueOnce(new Error('Fallo conexión'));
      const res = await request(app).put('/api/usuarios/me').set(...auth).send({ nombres: 'Carlos' });
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Fallo conexión');
    });
  });
});