// routes/__test__/dashboardRoutes.test.js
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import router from '../dashboardRoutes.js';
import { verificarRol } from '../../middlewares/auth.js';

// Simulamos el módulo de base de datos
jest.mock('../../../sicrcb-backend/database/db.js');
import pool from '../../../sicrcb-backend/database/db.js';

const JWT_SECRET = 'secreto_pruebas_sicrcb';
process.env.JWT_SECRET = JWT_SECRET;

const tokenAdmin = [`sicrcb_token=${jwt.sign({ id: 1, rol: 'Administrador' }, JWT_SECRET, { expiresIn: '1h' })}`];
const tokenResidente = [`sicrcb_token=${jwt.sign({ id: 2, rol: 'Residente' }, JWT_SECRET, { expiresIn: '1h' })}`];

// App Express mínima de prueba
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/dashboard', router);
app.use((err, req, res, next) => res.status(err.statusCode || 500).json({ error: err.message }));

beforeEach(() => pool.query.mockReset());

describe('Pruebas de Caja Blanca - Dashboard', () => {

  // --- Seguridad y Roles ---
  test('Ruta rechaza si no hay cookie de sesión (401)', async () => {
    const res = await request(app).get('/dashboard/estadisticas');
    expect(res.statusCode).toBe(401);
  });

  test('Ruta rechaza si el token es inválido (401)', async () => {
    const res = await request(app).get('/dashboard/estadisticas').set('Cookie', ['sicrcb_token=invalido']);
    expect(res.statusCode).toBe(401);
  });

  test('GET /estadisticas rechaza si el rol no es Administrador (403)', async () => {
    const res = await request(app).get('/dashboard/estadisticas').set('Cookie', tokenResidente);
    expect(res.statusCode).toBe(403);
  });

  test('Rechaza si req.usuario no tiene propiedad rol (403)', async () => {
    const tokenSinRol = [`sicrcb_token=${jwt.sign({ id: 99 }, JWT_SECRET)}`];
    const res = await request(app).get('/dashboard/estadisticas').set('Cookie', tokenSinRol);
    expect(res.statusCode).toBe(403);
  });

  test('verificarRol responde 401 si req.usuario no existe', () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    verificarRol('Administrador')({}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  // --- GET /estadisticas ---
  test('GET /estadisticas retorna métricas y actividad reciente (200)', async () => {
    pool.query
      .mockResolvedValueOnce([[{ total: 5 }]]).mockResolvedValueOnce([[{ total: 3 }]])
      .mockResolvedValueOnce([[{ total: 2 }]]).mockResolvedValueOnce([[{ total: 20 }]])
      .mockResolvedValueOnce([[{ id: 1, numero: 101, nombre: 'Ruido', bloque: '1', apto: '101', segundos_atras: 120, fecha_creacion: '2026-10-01' }]])
      .mockResolvedValueOnce([[{ id: 1, nombre: 'Gotera', bloque: '2', apto: '201', segundos_atras: 300, fecha_evento: '2026-10-01' }]])
      .mockResolvedValueOnce([[{ id: 1, nombre: 'Salon', segundos_atras: 600, primer_nombre: 'Juan', primer_apellido: 'Perez' }]])
      .mockResolvedValueOnce([[{ id: 1, nombre: 'Pedro Gomez', descripcion: 'Torre 1', fecha_evento: '2026-10-01' }]])
      .mockResolvedValueOnce([[{ id: 1, nombre: 'Aviso', segundos_atras: 900, fecha_evento: '2026-10-01' }]]);

    const res = await request(app).get('/dashboard/estadisticas').set('Cookie', tokenAdmin);
    expect(res.statusCode).toBe(200);
    expect(res.body.metricas.pqrsPendientes).toBe(5);
    expect(res.body.actividadReciente).toHaveLength(5);
    expect(res.body.sistema.apiOk).toBe(true);
  });

  test('GET /estadisticas maneja valores nulos y fallback de fecha (200)', async () => {
    pool.query
      .mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]])
      .mockRejectedValueOnce(new Error('Fallo query multas'))
      .mockResolvedValueOnce([[{ id: 2, numero: null, nombre: 'Sancion', bloque: 'B', apto: '102', descripcion: null }]])
      .mockResolvedValueOnce([[{ id: 2, nombre: 'PQR', bloque: 'A', apto: '101', segundos_atras: null, fecha_evento: null }]])
      .mockResolvedValueOnce([[{ id: 2, nombre: 'Reserva', segundos_atras: -5, fecha_evento: null, primer_nombre: null, primer_apellido: null }]])
      .mockResolvedValueOnce([[{ id: 2, nombre: 'Ana', descripcion: 'Propietaria', fecha_evento: '2026-10-01' }]])
      .mockResolvedValueOnce([[{ id: 2, nombre: null, segundos_atras: null, fecha_evento: null }]]);

    const res = await request(app).get('/dashboard/estadisticas').set('Cookie', tokenAdmin);
    expect(res.statusCode).toBe(200);
    expect(res.body.metricas.totalPropietarios).toBe(0);
  });

  // --- GET /residente ---
  test('GET /residente retorna datos completos con multas pendientes (200)', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id_propietario: 10, primer_nombre: 'Maria', primer_apellido: 'Lopez', id_apartamento: 101, apto: '101', bloque: 'Torre A', interior: 1 }]])
      .mockResolvedValueOnce([[{ id: 1, numero: 501, nombre: 'Mascota', estado: 'Pendiente', monto: 30000, segundos_atras: 60 }]])
      .mockResolvedValueOnce([[{ id: 1, descripcion: 'Salón', estado: 'Confirmado' }]])
      .mockResolvedValueOnce([[{ id: 1, titulo_pqr: 'Gotera', estado: 'Pendiente', segundos_atras: 180 }]])
      .mockResolvedValueOnce([[{ id: 1, descripcion: 'Comunicado oficial importante para la comunidad'.repeat(5), segundos_atras: 240, archivo_url: 'http://img' }]]);

    const res = await request(app).get('/dashboard/residente').set('Cookie', tokenResidente);
    expect(res.statusCode).toBe(200);
    expect(res.body.propietario.alDia).toBe(false);
    expect(res.body.metricas.multasPendientes).toBe(1);
    expect(res.body.notificaciones).toHaveLength(3);
  });

  test('GET /residente maneja usuario sin apartamento ni reservas (200)', async () => {
    pool.query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ id: 2, descripcion: 'Aviso corto', segundos_atras: null, fecha_publicacion: '2026-10-01' }]]);

    const res = await request(app).get('/dashboard/residente').set('Cookie', tokenResidente);
    expect(res.statusCode).toBe(200);
    expect(res.body.propietario.nombre).toBe('Residente');
    expect(res.body.propietario.alDia).toBe(true);
  });

  test('GET /residente clasifica multas resueltas y pqrs resueltas (200)', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id_propietario: 10, primer_nombre: 'Carlos', primer_apellido: 'Perez', id_apartamento: 102, apto: '102' }]])
      .mockResolvedValueOnce([[{ id: 2, estado: 'Resuelta', monto: 0 }, { id: 3, estado: 'Pagada', monto: 0 }]])
      .mockResolvedValueOnce([[{ id: 2, estado: 'Inactivo' }]])
      .mockResolvedValueOnce([[{ id: 2, estado: 'Resuelta', titulo_pqr: 'Luz resuelta', segundos_atras: 10 }]])
      .mockResolvedValueOnce([[]]);

    const res = await request(app).get('/dashboard/residente').set('Cookie', tokenResidente);
    expect(res.statusCode).toBe(200);
    expect(res.body.metricas.multasResueltas).toBe(2);
    expect(res.body.metricas.pqrsActivas).toBe(0);
  });

  test('GET /residente maneja fallback de error en multas del residente (200)', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id_apartamento: 105, id_propietario: 12 }]])
      .mockRejectedValueOnce(new Error('Fallo timestamp'))
      .mockResolvedValueOnce([[{ id: 4, estado: 'Pendiente', monto: 20000 }]])
      .mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]]);

    const res = await request(app).get('/dashboard/residente').set('Cookie', tokenResidente);
    expect(res.statusCode).toBe(200);
    expect(res.body.metricas.multasPendientes).toBe(1);
  });

  // --- Manejo de Errores de Base de Datos (Catch) ---
  describe('Manejo de Errores de Base de Datos (Catch)', () => {

    test('GET /estadisticas captura error de BD y retorna 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo conexión BD'));
      const res = await request(app).get('/dashboard/estadisticas').set('Cookie', tokenAdmin);
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Fallo conexión BD');
    });

    test('GET /residente captura error de BD y retorna 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('Fallo conexión BD'));
      const res = await request(app).get('/dashboard/residente').set('Cookie', tokenResidente);
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Fallo conexión BD');
    });

  });

});