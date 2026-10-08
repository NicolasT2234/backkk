// routes/__test__/tiposMultaRoutes.test.js
import 'dotenv/config';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import router from '../tiposMultaRoutes.js';
import { verificarRol } from '../../middlewares/auth.js';

// Simulamos el módulo de la base de datos
jest.mock('../../../sicrcb-backend/database/db.js', () => require('../../__mocks__/db.js'));
import pool from '../../../sicrcb-backend/database/db.js';

// Creamos una app de Express mínima solo para las pruebas
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/tipos-multa', router);
app.use((err, req, res, next) => res.status(err.statusCode || 500).json({ error: err.message }));

describe('Pruebas de Caja Blanca - Tipos de Multa', () => {
  const token = jwt.sign({ id: 1, rol: 'Administrador' }, process.env.JWT_SECRET || 'secreto');
  const auth = ['Cookie', `sicrcb_token=${token}`];

  afterEach(() => jest.clearAllMocks());

  // --- GET / ---
  test('GET / sin token debe retornar 401', async () => {
    const res = await request(app).get('/tipos-multa');
    expect(res.statusCode).toBe(401);
  });

  test('GET / con token debe retornar lista de tipos de multa', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, numero: 'TM-01', valor: 50000 }], []]);
    const res = await request(app).get('/tipos-multa').set(...auth);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  // --- GET /:id ---
  test('GET /:id debe retornar 404 si no existe', async () => {
    pool.query.mockResolvedValueOnce([[], []]);
    const res = await request(app).get('/tipos-multa/999').set(...auth);
    expect(res.statusCode).toBe(404);
  });

  test('GET /:id debe retornar el tipo de multa si existe', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, numero: 'TM-01', descripcion: 'Ruido' }], []]);
    const res = await request(app).get('/tipos-multa/1').set(...auth);
    expect(res.statusCode).toBe(200);
    expect(res.body.numero).toBe('TM-01');
  });

  // --- POST / ---
  test('POST / debe rechazar si faltan campos requeridos o valor no es positivo', async () => {
    const res = await request(app).post('/tipos-multa').set(...auth).send({ numero: 'TM-01' });
    expect(res.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('POST / debe crear tipo de multa con estado Activa', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 10 }, []]);
    const res = await request(app).post('/tipos-multa').set(...auth).send({
      numero: 'TM-01', descripcion: 'Ruido', valor: 50000, estado: 'Activo'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe(10);
  });

  test('POST / debe crear tipo de multa con estado Inactiva por defecto', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 11 }, []]);
    const res = await request(app).post('/tipos-multa').set(...auth).send({
      numero: 'TM-02', descripcion: 'Mascota', valor: '35000'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe(11);
  });

  // --- PUT /:id ---
  test('PUT /:id debe retornar 400 si no hay campos para actualizar', async () => {
    const res = await request(app).put('/tipos-multa/1').set(...auth).send({});
    expect(res.statusCode).toBe(400);
  });

  test('PUT /:id debe actualizar exitosamente todos los campos y estado Inactiva', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
    const res = await request(app).put('/tipos-multa/1').set(...auth).send({
      numero: 'TM-01-REV', descripcion: 'Ruido nocturno', valor: 60000, estado: 'inactiva'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Tipo de multa actualizado correctamente');
  });

  test('PUT /:id debe actualizar exitosamente con estado activa', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
    const res = await request(app).put('/tipos-multa/1').set(...auth).send({ estado: 'activa' });
    expect(res.statusCode).toBe(200);
  });

  // --- DELETE /:id ---
  test('DELETE /:id debe eliminar exitosamente', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
    const res = await request(app).delete('/tipos-multa/1').set(...auth);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Tipo de multa eliminado exitosamente');
  });

  // --- Seguridad y Roles ---
  test('GET / con token inválido debe responder 401', async () => {
    const res = await request(app).get('/tipos-multa').set('Cookie', 'sicrcb_token=invalido');
    expect(res.statusCode).toBe(401);
  });

  test('POST / con rol Residente debe responder 403', async () => {
    const tokenRes = jwt.sign({ id: 2, rol: 'Residente' }, process.env.JWT_SECRET || 'secreto');
    const res = await request(app).post('/tipos-multa').set('Cookie', `sicrcb_token=${tokenRes}`).send({ numero: 'X' });
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
      const res = await request(app).get('/tipos-multa').set(...auth);
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Fallo de conexión');
    });

    test('GET /:id debe capturar error de BD y retornar 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo'));
      const res = await request(app).get('/tipos-multa/1').set(...auth);
      expect(res.statusCode).toBe(500);
    });

    test('POST / debe capturar error de BD y retornar 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo'));
      const res = await request(app).post('/tipos-multa').set(...auth).send({
        numero: 'TM-01', descripcion: 'Fallo', valor: 50000
      });
      expect(res.statusCode).toBe(500);
    });

    test('PUT /:id debe capturar error de BD y retornar 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo'));
      const res = await request(app).put('/tipos-multa/1').set(...auth).send({ descripcion: 'Update Error' });
      expect(res.statusCode).toBe(500);
    });

    test('DELETE /:id debe capturar error de BD y retornar 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo'));
      const res = await request(app).delete('/tipos-multa/1').set(...auth);
      expect(res.statusCode).toBe(500);
    });
  });
});