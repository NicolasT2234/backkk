// routes/__test__/noticiasRoutes.test.js
import 'dotenv/config';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import router from '../noticiasRoutes.js';
import { verificarRol } from '../../middlewares/auth.js';

// Simulamos el módulo de la base de datos
jest.mock('../../../sicrcb-backend/database/db.js', () => require('../../__mocks__/db.js'));
import pool from '../../../sicrcb-backend/database/db.js';

// Creamos una app de Express mínima solo para las pruebas
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/noticias', router);
app.use((err, req, res, next) => res.status(err.statusCode || 500).json({ error: err.message }));

describe('Pruebas de Caja Blanca - Noticias', () => {
  const token = jwt.sign({ id: 1, rol: 'Administrador' }, process.env.JWT_SECRET || 'secreto');
  const auth = ['Cookie', `sicrcb_token=${token}`];

  afterEach(() => jest.clearAllMocks());

  // --- Configuración de Almacenamiento (Multer) ---
  test('debe cubrir la creación del directorio de subidas si no existe', () => {
    const uploadDir = path.join(__dirname, '../../uploads/noticias');
    if (fs.existsSync(uploadDir)) fs.rmSync(uploadDir, { recursive: true, force: true });
    jest.isolateModules(() => require('../noticiasRoutes.js'));
    expect(fs.existsSync(uploadDir)).toBe(true);
  });

  // --- GET /destacadas (Pública) ---
  test('GET /destacadas debe retornar las últimas 3 noticias sin token', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, descripcion: 'N1' }, { id: 2, descripcion: 'N2' }], []]);
    const res = await request(app).get('/noticias/destacadas');
    expect(res.statusCode).toBe(200);
    expect(res.body[0].titulo).toBe('N1');
  });

  // --- GET / ---
  test('GET / sin token debe retornar 401', async () => {
    const res = await request(app).get('/noticias');
    expect(res.statusCode).toBe(401);
  });

  test('GET / con token debe retornar lista completa formateada', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, descripcion: 'Asamblea', archivo_url: '/doc.pdf' }], []]);
    const res = await request(app).get('/noticias').set(...auth);
    expect(res.statusCode).toBe(200);
    expect(res.body[0].contenido).toBe('Asamblea');
  });

  // --- GET /:id ---
  test('GET /:id debe retornar 404 si no existe', async () => {
    pool.query.mockResolvedValueOnce([[], []]);
    const res = await request(app).get('/noticias/999').set(...auth);
    expect(res.statusCode).toBe(404);
  });

  test('GET /:id debe retornar la noticia si existe', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, descripcion: 'Comunicado' }], []]);
    const res = await request(app).get('/noticias/1').set(...auth);
    expect(res.statusCode).toBe(200);
    expect(res.body.titulo).toBe('Comunicado');
  });

  // --- POST / ---
  test('POST / debe rechazar si la descripción está vacía', async () => {
    const res = await request(app).post('/noticias').set(...auth).send({ descripcion: '   ' });
    expect(res.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('POST / debe crear noticia exitosamente con fecha ISO', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 50 }, []]);
    const res = await request(app).post('/noticias').set(...auth).send({
      descripcion: 'Corte', fechaPublicacion: '2026-10-15T09:30:00.000Z'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe(50);
  });

  test('POST / debe crear noticia exitosamente con fecha por defecto', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 51 }, []]);
    const res = await request(app).post('/noticias').set(...auth).send({ descripcion: 'Jardines' });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe(51);
  });

  test('POST / debe crear noticia exitosamente con archivo adjunto', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 52 }, []]);
    const res = await request(app).post('/noticias').set(...auth)
      .field('descripcion', 'Con adjunto').field('fechaPublicacion', '2026-10-15T09:30:00.000Z')
      .attach('archivo', Buffer.from('test'), 'soporte.png');
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe(52);
  });

  // --- PUT /:id ---
  test('PUT /:id debe retornar 400 si falta descripción', async () => {
    const res = await request(app).put('/noticias/1').set(...auth).send({});
    expect(res.statusCode).toBe(400);
  });

  test('PUT /:id debe actualizar exitosamente sin archivo', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
    const res = await request(app).put('/noticias/1').set(...auth).send({
      descripcion: 'Actualizada', fechaPublicacion: '2026-10-20T10:00:00.000Z'
    });
    expect(res.statusCode).toBe(200);
  });

  test('PUT /:id debe actualizar exitosamente con fecha por defecto', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
    const res = await request(app).put('/noticias/1').set(...auth).send({ descripcion: 'Nueva fecha' });
    expect(res.statusCode).toBe(200);
  });

  test('PUT /:id debe actualizar exitosamente con archivo adjunto', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
    const res = await request(app).put('/noticias/1').set(...auth)
      .field('descripcion', 'Con nuevo archivo').attach('archivo', Buffer.from('test2'), 'doc.pdf');
    expect(res.statusCode).toBe(200);
  });

  // --- DELETE /:id ---
  test('DELETE /:id debe retornar 404 si no existe', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 0 }, []]);
    const res = await request(app).delete('/noticias/999').set(...auth);
    expect(res.statusCode).toBe(404);
  });

  test('DELETE /:id debe eliminar exitosamente', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
    const res = await request(app).delete('/noticias/1').set(...auth);
    expect(res.statusCode).toBe(200);
  });

  // --- Seguridad y Roles ---
  test('GET / con token inválido debe responder 401', async () => {
    const res = await request(app).get('/noticias').set('Cookie', 'sicrcb_token=invalido');
    expect(res.statusCode).toBe(401);
  });

  test('POST / con rol Residente debe responder 403', async () => {
    const tokenRes = jwt.sign({ id: 2, rol: 'Residente' }, process.env.JWT_SECRET || 'secreto');
    const res = await request(app).post('/noticias').set('Cookie', `sicrcb_token=${tokenRes}`).send({ descripcion: 'X' });
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
    test('GET /destacadas debe capturar error de BD y retornar 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo de conexión'));
      const res = await request(app).get('/noticias/destacadas');
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Fallo de conexión');
    });

    test('GET / debe capturar error de BD y retornar 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo'));
      const res = await request(app).get('/noticias').set(...auth);
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Fallo');
    });

    test('GET /:id debe capturar error de BD y retornar 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo'));
      const res = await request(app).get('/noticias/1').set(...auth);
      expect(res.statusCode).toBe(500);
    });

    test('POST / debe capturar error de BD y retornar 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo'));
      const res = await request(app).post('/noticias').set(...auth).send({ descripcion: 'Error' });
      expect(res.statusCode).toBe(500);
    });

    test('PUT /:id debe capturar error de BD y retornar 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo'));
      const res = await request(app).put('/noticias/1').set(...auth).send({ descripcion: 'Error' });
      expect(res.statusCode).toBe(500);
    });

    test('DELETE /:id debe capturar error de BD y retornar 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo'));
      const res = await request(app).delete('/noticias/1').set(...auth);
      expect(res.statusCode).toBe(500);
    });
  });
});