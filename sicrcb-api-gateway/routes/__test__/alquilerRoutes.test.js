// routes/__test__/alquilerRoutes.test.js
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

let router;
try { router = require('../alquilerRoutes.js'); } 
catch (e) { router = require('../alquileresRoutes.js'); }
if (router.default) router = router.default;

const { verificarRol } = require('../../middlewares/auth.js');

// Mock de base de datos y transacciones
jest.mock('../../../sicrcb-backend/database/db.js');
import pool from '../../../sicrcb-backend/database/db.js';

const mockConnection = {
  beginTransaction: jest.fn().mockResolvedValue(true),
  query: jest.fn(),
  commit: jest.fn().mockResolvedValue(true),
  rollback: jest.fn().mockResolvedValue(true),
  release: jest.fn().mockResolvedValue(true)
};
pool.getConnection = jest.fn().mockResolvedValue(mockConnection);

const JWT_SECRET = 'secreto_pruebas_sicrcb';
process.env.JWT_SECRET = JWT_SECRET;

const tokenAdmin = [`sicrcb_token=${jwt.sign({ id: 1, rol: 'Administrador' }, JWT_SECRET, { expiresIn: '1h' })}`];
const tokenResidente = [`sicrcb_token=${jwt.sign({ id: 2, rol: 'Residente' }, JWT_SECRET, { expiresIn: '1h' })}`];

// App Express mínima de prueba
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/alquileres', router);
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({ error: err.message });
});

beforeEach(() => {
  pool.query.mockReset();
  mockConnection.query.mockReset();
  mockConnection.beginTransaction.mockClear();
  mockConnection.commit.mockClear();
  mockConnection.rollback.mockClear();
  mockConnection.release.mockClear();
});

describe('Pruebas de Caja Blanca - Alquileres', () => {

  // --- Seguridad y Roles ---
  test('Ruta rechaza si no hay cookie ni token (401)', async () => {
    const res = await request(app).get('/alquileres/configuracion');
    expect(res.statusCode).toBe(401);
  });

  test('Ruta rechaza si el token es inválido (401)', async () => {
    const res = await request(app).get('/alquileres/configuracion').set('Cookie', ['sicrcb_token=invalido']);
    expect(res.statusCode).toBe(401);
  });

  test('Header Authorization procesa split y rechaza token inválido (401)', async () => {
    const res = await request(app).get('/alquileres/configuracion').set('Authorization', 'Bearer token_invalido');
    expect(res.statusCode).toBe(401);
  });

  test('Ruta administrativa rechaza rol no Administrador (403)', async () => {
    const res = await request(app).get('/alquileres').set('Cookie', tokenResidente);
    expect(res.statusCode).toBe(403);
  });

  test('Rechaza si req.usuario no posee propiedad rol (403)', async () => {
    const tokenSinRol = [`sicrcb_token=${jwt.sign({ id: 99 }, JWT_SECRET)}`];
    const res = await request(app).get('/alquileres').set('Cookie', tokenSinRol);
    expect(res.statusCode).toBe(403);
  });

  test('verificarRol responde 401 si req.usuario no existe', () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    verificarRol('Administrador')({}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  // --- GET /configuracion y PUT /configuracion ---
  test('GET /configuracion debe retornar tarifas existentes', async () => {
    pool.query
      .mockResolvedValueOnce([[{ valor_hora: 50000 }]])
      .mockResolvedValueOnce([[{ cantidad: 120, valor_hora: 20000 }]]);
    const res = await request(app).get('/alquileres/configuracion').set('Cookie', tokenResidente);
    expect(res.statusCode).toBe(200);
    expect(res.body.valorHoraSalon).toBe(50000);
  });

  test('GET /configuracion usa valores por defecto si no hay registros', async () => {
    pool.query.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]]);
    const res = await request(app).get('/alquileres/configuracion').set('Cookie', tokenResidente);
    expect(res.statusCode).toBe(200);
    expect(res.body.totalSillas).toBe(120);
  });

  test('PUT /configuracion actualiza tarifas completas', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]).mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).put('/alquileres/configuracion').set('Cookie', tokenAdmin).send({ valorHoraSalon: 60000, valorHoraSillas: 25000, totalSillas: 150 });
    expect(res.statusCode).toBe(200);
  });

  test('PUT /configuracion actualiza solo salon o solo sillas', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res1 = await request(app).put('/alquileres/configuracion').set('Cookie', tokenAdmin).send({ valorHoraSalon: 70000 });
    expect(res1.statusCode).toBe(200);

    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res2 = await request(app).put('/alquileres/configuracion').set('Cookie', tokenAdmin).send({ totalSillas: 130 });
    expect(res2.statusCode).toBe(200);
  });

  // --- GET /ocupacion y GET /mis-alquileres ---
  test('GET /ocupacion debe rechazar si falta la fecha', async () => {
    const res = await request(app).get('/alquileres/ocupacion').set('Cookie', tokenResidente);
    expect(res.statusCode).toBe(400);
  });

  test('GET /ocupacion calcula franjas horarias con reservas y sillas', async () => {
    pool.query
      .mockResolvedValueOnce([[{ valor_hora: 50000 }]])
      .mockResolvedValueOnce([[{ cantidad: 120, valor_hora: 20000 }]])
      .mockResolvedValueOnce([[
        { id: 1, id_salon_comunal: 1, hora_inicio: '10:00', hora_fin: '12:00', cantidad_sillas: 30 },
        { id: 2, id_salon_comunal: null, hora_inicio: '14:00', hora_fin: '16:00', cantidad_sillas: null }
      ]]);
    const res = await request(app).get('/alquileres/ocupacion?fecha=2026-10-25').set('Cookie', tokenResidente);
    expect(res.statusCode).toBe(200);
    expect(res.body.franjas).toHaveLength(9);
    expect(res.body.franjas[0].salonOcupado).toBe(true);
  });

  test('GET /mis-alquileres lista reservas del residente en sesión', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 3, tipo_alquiler: 'salon' }]]);
    const res = await request(app).get('/alquileres/mis-alquileres').set('Cookie', tokenResidente);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  // --- GET / y GET /:id ---
  test('GET / lista todas las reservas para Administrador', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, tipo_alquiler: 'ambos' }]]);
    const res = await request(app).get('/alquileres').set('Cookie', tokenAdmin);
    expect(res.statusCode).toBe(200);
  });

  test('GET /:id debe retornar 404 si no existe', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    const res = await request(app).get('/alquileres/999').set('Cookie', tokenAdmin);
    expect(res.statusCode).toBe(404);
  });

  test('GET /:id debe retornar detalle si existe', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, descripcion: 'Bautizo' }]]);
    const res = await request(app).get('/alquileres/1').set('Cookie', tokenAdmin);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(1);
  });

  // --- POST / ---
  test('POST / debe rechazar si faltan campos o cadenas vacías con espacios', async () => {
    const res = await request(app).post('/alquileres').set('Cookie', tokenResidente).send({ descripcion: ' ', horaInicio: ' ', horaFin: ' ', tipoAlquiler: 'invalido' });
    expect(res.statusCode).toBe(400);
  });

  test('POST / debe rechazar si horaInicio >= horaFin', async () => {
    const res = await request(app).post('/alquileres').set('Cookie', tokenResidente).send({ descripcion: 'Test', horaInicio: '2026-10-25T14:00:00', horaFin: '2026-10-25T12:00:00', tipoAlquiler: 'salon' });
    expect(res.statusCode).toBe(400);
  });

  test('POST / debe rechazar si está fuera del horario 10:00 a 19:00', async () => {
    const res1 = await request(app).post('/alquileres').set('Cookie', tokenResidente).send({ descripcion: 'T1', horaInicio: '2026-10-25T08:00:00', horaFin: '2026-10-25T12:00:00', tipoAlquiler: 'salon' });
    const res2 = await request(app).post('/alquileres').set('Cookie', tokenResidente).send({ descripcion: 'T2', horaInicio: '2026-10-25T17:00:00', horaFin: '2026-10-25T20:00:00', tipoAlquiler: 'salon' });
    expect(res1.statusCode).toBe(400);
    expect(res2.statusCode).toBe(400);
  });

  test('POST / debe rechazar si usuario no tiene propietario asociado (403)', async () => {
    mockConnection.query.mockResolvedValueOnce([[]]);
    const res = await request(app).post('/alquileres').set('Cookie', tokenResidente).send({ descripcion: 'Test', horaInicio: '2026-10-25T11:00:00', horaFin: '2026-10-25T13:00:00', tipoAlquiler: 'salon' });
    expect(res.statusCode).toBe(403);
  });

  test('POST / debe rechazar si hay colisión en salón comunal (409)', async () => {
    mockConnection.query
      .mockResolvedValueOnce([[{ id: 10 }]])
      .mockResolvedValueOnce([[{ valor_hora: 50000 }]])
      .mockResolvedValueOnce([[{ valor_hora: 20000, cantidad: 120 }]])
      .mockResolvedValueOnce([[{ id: 1 }]])
      .mockResolvedValueOnce([[{ id: 99, inicio: '11:00', fin: '13:00' }]]);
    const res = await request(app).post('/alquileres').set('Cookie', tokenResidente).send({ descripcion: 'Ocupado', horaInicio: '2026-10-25T11:00:00', horaFin: '2026-10-25T13:00:00', tipoAlquiler: 'salon' });
    expect(res.statusCode).toBe(409);
  });

  test('POST / debe rechazar sillas con cantidad <= 0 o sin stock (409)', async () => {
    mockConnection.query.mockResolvedValueOnce([[{ id: 10 }]]).mockResolvedValueOnce([[{ valor_hora: 50000 }]]).mockResolvedValueOnce([[{ valor_hora: 20000, cantidad: 10 }]]);
    const res1 = await request(app).post('/alquileres').set('Cookie', tokenResidente).send({ descripcion: 'Cero', horaInicio: '2026-10-25T11:00:00', horaFin: '2026-10-25T13:00:00', tipoAlquiler: 'sillas', cantidadSillas: 0 });
    expect(res1.statusCode).toBe(400);

    mockConnection.query.mockResolvedValueOnce([[{ id: 10 }]]).mockResolvedValueOnce([[{ valor_hora: 50000 }]]).mockResolvedValueOnce([[{ valor_hora: 20000, cantidad: 10 }]]).mockResolvedValueOnce([[{ total_ocupadas: 10 }]]);
    const res2 = await request(app).post('/alquileres').set('Cookie', tokenResidente).send({ descripcion: 'Sin stock', horaInicio: '2026-10-25T11:00:00', horaFin: '2026-10-25T13:00:00', tipoAlquiler: 'sillas', cantidadSillas: 5 });
    expect(res2.statusCode).toBe(409);
  });

  test('POST / debe crear reserva de salón exitosamente (201)', async () => {
    mockConnection.query
      .mockResolvedValueOnce([[{ id: 10 }]])
      .mockResolvedValueOnce([[{ valor_hora: 50000 }]])
      .mockResolvedValueOnce([[{ valor_hora: 20000, cantidad: 120 }]])
      .mockResolvedValueOnce([[{ id: 1 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 5 }]);
    const res = await request(app).post('/alquileres').set('Cookie', tokenResidente).send({ descripcion: 'Salon OK', horaInicio: '2026-10-25T11:00:00', horaFin: '2026-10-25T13:00:00', tipoAlquiler: 'salon' });
    expect(res.statusCode).toBe(201);
  });

  test('POST / debe crear reserva con campos snake_case y tipo "sillas" (201)', async () => {
    mockConnection.query
      .mockResolvedValueOnce([[{ id: 10 }]])
      .mockResolvedValueOnce([[{ valor_hora: 50000 }]])
      .mockResolvedValueOnce([[{ valor_hora: 20000, cantidad: 120 }]])
      .mockResolvedValueOnce([[{ total_ocupadas: 0 }]])
      .mockResolvedValueOnce([{ insertId: 6 }])
      .mockResolvedValueOnce([[{ id: 1 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).post('/alquileres').set('Cookie', tokenResidente).send({ descripcion: 'Sillas OK', hora_inicio: '2026-10-25T11:00:00', hora_fin: '2026-10-25T13:00:00', tipo_alquiler: 'sillas', cantidad_sillas: 20 });
    expect(res.statusCode).toBe(201);
  });

  test('POST / debe crear tipo "ambos" con fallback en alquiler_silla (201)', async () => {
    mockConnection.query
      .mockResolvedValueOnce([[{ id: 10 }]])
      .mockResolvedValueOnce([[{ valor_hora: 50000 }]])
      .mockResolvedValueOnce([[{ valor_hora: 20000, cantidad: 120 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 7 }])
      .mockResolvedValueOnce([[]])
      .mockRejectedValueOnce(new Error('Fallo cantidad'))
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).post('/alquileres').set('Cookie', tokenResidente).send({ descripcion: 'Ambos', horaInicio: '2026-10-25T11:00:00', horaFin: '2026-10-25T13:00:00', tipoAlquiler: 'ambos', cantidadSillas: 10 });
    expect(res.statusCode).toBe(201);
  });

  // --- PUT /:id ---
  test('PUT /:id debe rechazar si no es admin (403)', async () => {
    const res = await request(app).put('/alquileres/1').set('Cookie', tokenResidente).send({ estado: 'Confirmado' });
    expect(res.statusCode).toBe(403);
  });

  test('PUT /:id debe actualizar exitosamente si es admin (200)', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).put('/alquileres/1').set('Cookie', tokenAdmin).send({ estado: 'Confirmado' });
    expect(res.statusCode).toBe(200);
  });

  // --- DELETE /:id ---
  test('DELETE /:id debe retornar 404 si no existe', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    const res = await request(app).delete('/alquileres/999').set('Cookie', tokenAdmin);
    expect(res.statusCode).toBe(404);
  });

  test('DELETE /:id debe rechazar reserva ajena (403) o < 24h (400)', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, id_usuario: 99, hora_inicio: '2026-12-01T12:00:00' }]]);
    const res1 = await request(app).delete('/alquileres/1').set('Cookie', tokenResidente);
    expect(res1.statusCode).toBe(403);

    const fechaCercana = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    pool.query.mockResolvedValueOnce([[{ id: 1, id_usuario: 2, hora_inicio: fechaCercana }]]);
    const res2 = await request(app).delete('/alquileres/1').set('Cookie', tokenResidente);
    expect(res2.statusCode).toBe(400);
  });

  test('DELETE /:id permite a residente cancelar propia reserva > 24h (200) y a admin (200)', async () => {
    const fechaLejana = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    pool.query.mockResolvedValueOnce([[{ id: 1, id_usuario: 2, hora_inicio: fechaLejana }]]);
    mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]).mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res1 = await request(app).delete('/alquileres/1').set('Cookie', tokenResidente);
    expect(res1.statusCode).toBe(200);

    pool.query.mockResolvedValueOnce([[{ id: 1, id_usuario: 88, hora_inicio: '2026-11-01T10:00:00' }]]);
    mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]).mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res2 = await request(app).delete('/alquileres/1').set('Cookie', tokenAdmin);
    expect(res2.statusCode).toBe(200);
  });

  // --- Manejo de Errores de Base de Datos (Catch) ---
  describe('Manejo de Errores de Base de Datos (Catch)', () => {

    test('GET /configuracion y PUT /configuracion capturan error 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo BD'));
      const res1 = await request(app).get('/alquileres/configuracion').set('Cookie', tokenResidente);
      expect(res1.statusCode).toBe(500);

      pool.query.mockRejectedValueOnce(new Error('Fallo BD'));
      const res2 = await request(app).put('/alquileres/configuracion').set('Cookie', tokenAdmin).send({ valorHoraSalon: 50000 });
      expect(res2.statusCode).toBe(500);
    });

    test('GET /ocupacion y GET /mis-alquileres capturan error 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo BD'));
      const res1 = await request(app).get('/alquileres/ocupacion?fecha=2026-10-25').set('Cookie', tokenResidente);
      expect(res1.statusCode).toBe(500);

      pool.query.mockRejectedValueOnce(new Error('Fallo BD'));
      const res2 = await request(app).get('/alquileres/mis-alquileres').set('Cookie', tokenResidente);
      expect(res2.statusCode).toBe(500);
    });

    test('GET /, GET /:id, PUT /:id capturan error 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo BD'));
      const res1 = await request(app).get('/alquileres').set('Cookie', tokenAdmin);
      expect(res1.statusCode).toBe(500);

      pool.query.mockRejectedValueOnce(new Error('Fallo BD'));
      const res2 = await request(app).get('/alquileres/1').set('Cookie', tokenAdmin);
      expect(res2.statusCode).toBe(500);

      pool.query.mockRejectedValueOnce(new Error('Fallo BD'));
      const res3 = await request(app).put('/alquileres/1').set('Cookie', tokenAdmin).send({ estado: 'Confirmado' });
      expect(res3.statusCode).toBe(500);
    });

    test('POST / y DELETE /:id capturan error y hacen rollback (500)', async () => {
      mockConnection.query.mockRejectedValueOnce(new Error('Fallo BD'));
      const res1 = await request(app).post('/alquileres').set('Cookie', tokenResidente).send({ descripcion: 'X', horaInicio: '2026-10-25T11:00:00', horaFin: '2026-10-25T13:00:00', tipoAlquiler: 'salon' });
      expect(res1.statusCode).toBe(500);

      pool.query.mockResolvedValueOnce([[{ id: 1, id_usuario: 1, hora_inicio: '2026-11-01T10:00:00' }]]);
      mockConnection.query.mockRejectedValueOnce(new Error('Fallo BD'));
      const res2 = await request(app).delete('/alquileres/1').set('Cookie', tokenAdmin);
      expect(res2.statusCode).toBe(500);
    });

  });

});