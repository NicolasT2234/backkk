// sicrcb-api-gateway/routes/__tests__/authRoutes.test.js
import 'dotenv/config';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import router from '../authRoutes.js';

// Simulamos el módulo de la base de datos
jest.mock('../../../sicrcb-backend/database/db.js', () => require('../../__mocks__/db.js'));
import pool from '../../../sicrcb-backend/database/db.js';

// Creamos una app de Express mínima solo para las pruebas
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', router);

describe('Pruebas de Caja Blanca - Auth', () => {
  const secret = process.env.JWT_SECRET || 'secreto';
  const signToken = (payload, opts) => jwt.sign(payload, secret, opts);
  const adminUser = [{ id: 1, email: 'admin@conjuntoresidencial1.com', estado: 'Activo', rol: 'Administrador', nombre: 'Admin', apellido: 'P' }];

  afterEach(() => jest.clearAllMocks());

  // --- POST /login ---
  test('POST /login debe rechazar si faltan campos requeridos', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'incompleto' });
    expect(res.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('POST /login debe autenticar y emitir cookie con credenciales válidas', async () => {
    pool.query.mockResolvedValueOnce([adminUser, []]);
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@conjuntoresidencial1.com', contraseña: 'admin123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('admin@conjuntoresidencial1.com');
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  test('POST /login debe retornar 401 si las credenciales no coinciden', async () => {
    pool.query.mockResolvedValueOnce([[], []]);
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@conjuntoresidencial1.com', contraseña: 'clave_incorrecta' });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Credenciales inválidas');
  });

  test('POST /login debe retornar error si el usuario no está Activo', async () => {
    const usuarioInactivo = [{ id: 1, email: 'inactivo@correo.com', estado: 'Suspendido', rol: 'Residente', contraseña: 'admin123' }];
    pool.query.mockResolvedValueOnce([usuarioInactivo, []]);
    const res = await request(app).post('/api/auth/login').send({ email: 'inactivo@correo.com', contraseña: 'admin123' });
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBeDefined();
  });

  // --- POST /logout ---
  test('POST /logout debe responder 200 y cerrar sesión', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Sesión cerrada exitosamente');
  });

  // --- POST /solicitar-recuperacion ---
  test('POST /solicitar-recuperacion debe responder 200 si el correo existe', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 2, email: 'laura.sanchez@gmail.com' }], []]);
    const res = await request(app).post('/api/auth/solicitar-recuperacion').send({ email: 'laura.sanchez@gmail.com' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  }, 10000);

  test('POST /solicitar-recuperacion debe retornar 404 si el correo no existe en BD', async () => {
    pool.query.mockResolvedValueOnce([[], []]);
    const res = await request(app).post('/api/auth/solicitar-recuperacion').send({ email: 'noexiste@correo.com' });
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toContain('No existe ninguna cuenta');
  });

  // --- POST /restablecer-password ---
  test('POST /restablecer-password debe rechazar si la contraseña tiene menos de 6 caracteres', async () => {
    const res = await request(app).post('/api/auth/restablecer-password').send({ token: 'abc', nuevaPassword: '123' });
    expect(res.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('POST /restablecer-password con token válido actualiza contraseña (200)', async () => {
    const token = signToken({ id: 2, proposito: 'recuperacion' });
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
    const res = await request(app).post('/api/auth/restablecer-password').send({ token, nuevaPassword: 'nuevaClaveSegura123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('Contraseña restablecida exitosamente');
  });

  test('POST /restablecer-password debe responder 400 si el token expiró', async () => {
    const token = signToken({ id: 2, proposito: 'recuperacion', exp: Math.floor(Date.now() / 1000) - 3600 });
    const res = await request(app).post('/api/auth/restablecer-password').send({ token, nuevaPassword: 'nuevaClaveSegura123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('ha expirado');
  });

  test('POST /restablecer-password debe responder 400 si el token es inválido', async () => {
    const res = await request(app).post('/api/auth/restablecer-password').send({ token: 'token_invalido', nuevaPassword: 'nuevaClaveSegura123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('inválido');
  });

  test('POST /restablecer-password debe responder 400 si el token no es de recuperación', async () => {
    const token = signToken({ id: 2, proposito: 'sesion' });
    const res = await request(app).post('/api/auth/restablecer-password').send({ token, nuevaPassword: 'nuevaClaveSegura123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Token no autorizado');
  });

  // --- Manejo de Errores de Base de Datos (Catch / 500) ---
  describe('Manejo de Errores de Base de Datos (Catch)', () => {

    test('POST /login debe responder 500 ante error inesperado de base de datos', async () => {
      pool.query.mockRejectedValueOnce(new Error('Error de conexión MySQL'));
      const res = await request(app).post('/api/auth/login').send({ email: 'admin@conjuntoresidencial1.com', contraseña: 'admin123' });
      expect(res.statusCode).toBe(500);
    });

    test('POST /solicitar-recuperacion debe responder 500 ante error inesperado', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo crítico'));
      const res = await request(app).post('/api/auth/solicitar-recuperacion').send({ email: 'usuario@correo.com' });
      expect(res.statusCode).toBe(500);
    });

    test('POST /restablecer-password debe responder 500 ante fallo en base de datos', async () => {
      const token = signToken({ id: 2, proposito: 'recuperacion' });
      pool.query.mockRejectedValueOnce(new Error('Fallo en tabla usuario'));
      const res = await request(app).post('/api/auth/restablecer-password').send({ token, nuevaPassword: 'nuevaClaveSegura123' });
      expect(res.statusCode).toBe(500);
    });
  });
});