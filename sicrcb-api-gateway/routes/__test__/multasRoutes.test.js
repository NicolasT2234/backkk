// routes/__test__/multasRoutes.test.js
import 'dotenv/config';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import router from '../multasRoutes.js';
import { verificarRol } from '../../middlewares/auth.js';

// Simulamos el módulo de la base de datos
jest.mock('../../../sicrcb-backend/database/db.js', () => require('../../__mocks__/db.js'));
import pool from '../../../sicrcb-backend/database/db.js';

// Creamos una app de Express mínima solo para las pruebas
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/multas', router);
app.use((err, req, res, next) => res.status(err.statusCode || 500).json({ error: err.message }));

describe('Pruebas de Caja Blanca - Multas', () => {
  const token = jwt.sign({ id: 1, rol: 'Administrador' }, process.env.JWT_SECRET || 'secreto');
  const auth = ['Cookie', `sicrcb_token=${token}`];

  afterEach(() => jest.clearAllMocks());

  // --- GET / ---
  test('GET / sin token debe retornar 401', async () => {
    const res = await request(app).get('/multas');
    expect(res.statusCode).toBe(401);
  });

  test('GET / con token debe retornar lista de multas', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, nombre: 'Ruido excesivo' }], []]);
    const res = await request(app).get('/multas').set(...auth);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  // --- GET /mis-multas ---
  test('GET /mis-multas debe retornar multas del usuario en sesión', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 2, nombre: 'Mascota' }], []]);
    const res = await request(app).get('/multas/mis-multas').set(...auth);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  // --- GET /:id ---
  test('GET /:id debe retornar 404 si no existe', async () => {
    pool.query.mockResolvedValueOnce([[], []]);
    const res = await request(app).get('/multas/999').set(...auth);
    expect(res.statusCode).toBe(404);
  });

  test('GET /:id debe retornar la multa si existe', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, nombre: 'Ruido' }], []]);
    const res = await request(app).get('/multas/1').set(...auth);
    expect(res.statusCode).toBe(200);
    expect(res.body.nombre).toBe('Ruido');
  });

  // --- POST / ---
  test('POST / debe rechazar si faltan campos requeridos', async () => {
    const res = await request(app).post('/multas').set(...auth).send({ nombre: 'Incompleto' });
    expect(res.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('POST / debe rechazar si no existe administrador en BD', async () => {
    pool.query
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([[], []]);

    const res = await request(app).post('/multas').set(...auth).send({
      nombre: 'Fachada', descripcion: 'Pintura', id_tipo_multa: 1, idApartamento: 101
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('No existe ningún administrador registrado en el sistema.');
  });

  test('POST / debe crear multa exitosamente', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 10 }], []]); // resolverIdAdministrador
    pool.query.mockResolvedValueOnce([{ insertId: 77 }, []]); // insert multa

    const res = await request(app).post('/multas').set(...auth).send({
      nombre: 'Música alta', descripcion: 'Decibeles altos', id_tipo_multa: 1, idApartamento: 102
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe(77);
    expect(res.body.message).toBe('Sanción registrada exitosamente');
  });

  // --- PUT /:id ---
  test('PUT /:id debe retornar 404 si no existe', async () => {
    pool.query.mockResolvedValueOnce([[], []]);
    const res = await request(app).put('/multas/999').set(...auth).send({ nombre: 'X' });
    expect(res.statusCode).toBe(404);
  });

  test('PUT /:id debe retornar 400 si no hay campos para actualizar', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1 }], []]);
    const res = await request(app).put('/multas/1').set(...auth).send({});
    expect(res.statusCode).toBe(400);
  });

  test('PUT /:id debe actualizar exitosamente', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1 }], []]);
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);

    const res = await request(app).put('/multas/1').set(...auth).send({
      nombre: 'Actualizado', estado: 'Resuelta', idApartamento: 102
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Información de la sanción actualizada exitosamente');
  });

  // --- DELETE /:id ---
  test('DELETE /:id debe retornar 404 si no existe', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 0 }, []]);
    const res = await request(app).delete('/multas/999').set(...auth);
    expect(res.statusCode).toBe(404);
  });

  test('DELETE /:id debe eliminar exitosamente', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
    const res = await request(app).delete('/multas/1').set(...auth);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Multa eliminada exitosamente');
  });

  // --- Seguridad y Roles ---
  test('GET / con token inválido debe responder 401', async () => {
    const res = await request(app).get('/multas').set('Cookie', 'sicrcb_token=invalido');
    expect(res.statusCode).toBe(401);
  });

  test('POST / con rol Residente debe responder 403', async () => {
    const tokenRes = jwt.sign({ id: 2, rol: 'Residente' }, process.env.JWT_SECRET || 'secreto');
    const res = await request(app).post('/multas').set('Cookie', `sicrcb_token=${tokenRes}`).send({ nombre: 'X' });
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
      const res = await request(app).get('/multas').set(...auth);
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Fallo de conexión');
    });

    test('GET /mis-multas debe capturar error de BD y retornar 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo'));
      const res = await request(app).get('/multas/mis-multas').set(...auth);
      expect(res.statusCode).toBe(500);
    });

    test('GET /:id debe capturar error de BD y retornar 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo'));
      const res = await request(app).get('/multas/1').set(...auth);
      expect(res.statusCode).toBe(500);
    });

    test('POST / debe capturar error de BD y retornar 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo'));
      const res = await request(app).post('/multas').set(...auth).send({
        nombre: 'Ruido', descripcion: 'Fallo', id_tipo_multa: 1, idApartamento: 101
      });
      expect(res.statusCode).toBe(500);
    });

    test('PUT /:id debe capturar error de BD y retornar 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo'));
      const res = await request(app).put('/multas/1').set(...auth).send({ nombre: 'X' });
      expect(res.statusCode).toBe(500);
    });

    test('DELETE /:id debe capturar error de BD y retornar 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo'));
      const res = await request(app).delete('/multas/1').set(...auth);
      expect(res.statusCode).toBe(500);
    });
  });
});