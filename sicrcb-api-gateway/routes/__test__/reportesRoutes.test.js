// routes/__test__/reportesRoutes.test.js
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import router from '../reportesRoutes.js';
import * as authMiddleware from '../../middlewares/auth.js';

const verificarRol = authMiddleware.verificarRol || authMiddleware.default?.verificarRol;

jest.mock('../../../sicrcb-backend/services/ReporteService.js', () => ({
  generarMultasPdf: jest.fn(),
  generarAlquileresPdf: jest.fn(),
  generarPqrsPdf: jest.fn(),
  generarCensoApartamentosPdf: jest.fn(),
  generarPazYSalvoPdf: jest.fn(),
  generarComprobanteReservaPdf: jest.fn()
}));
import ReporteService from '../../../sicrcb-backend/services/ReporteService.js';

const JWT_SECRET = 'secreto_pruebas_sicrcb';
process.env.JWT_SECRET = JWT_SECRET;

const auth = (u) => ['Cookie', [`sicrcb_token=${jwt.sign(u, JWT_SECRET)}`]];
const admin = auth({ id: 1, rol: 'Administrador' });
const residente = auth({ id: 2, rol: 'Residente' });
const sinRol = auth({ id: 3 });

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/reportes', router);

describe('Pruebas de Caja Blanca - Módulo Reportes (100% Cobertura)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ReporteService.generarMultasPdf.mockImplementation(async (res) => res.status(200).send('PDF_MULTAS'));
    ReporteService.generarAlquileresPdf.mockImplementation(async (res) => res.status(200).send('PDF_ALQUILERES'));
    ReporteService.generarPqrsPdf.mockImplementation(async (res) => res.status(200).send('PDF_PQRS'));
    ReporteService.generarCensoApartamentosPdf.mockImplementation(async (res) => res.status(200).send('PDF_CENSO'));
    ReporteService.generarPazYSalvoPdf.mockImplementation(async (id, res) => res.status(200).send('PDF_PAZYSALVO'));
    ReporteService.generarComprobanteReservaPdf.mockImplementation(async (id, uid, esAdmin, res) => res.status(200).send('PDF_COMPROBANTE'));
  });

  // --- Seguridad y Middlewares (auth.js: Líneas 21, 32, 35 y Ramas) ---
  test('Seguridad auth.js: token ausente (401), inválido (401) y header Authorization (401)', async () => {
    expect((await request(app).get('/reportes/admin/multas-pdf')).statusCode).toBe(401);
    expect((await request(app).get('/reportes/admin/multas-pdf').set('Cookie', ['sicrcb_token=invalido'])).statusCode).toBe(401);
    expect((await request(app).get('/reportes/admin/multas-pdf').set('Authorization', 'Bearer token_header')).statusCode).toBe(401);
  });

  test('Seguridad Roles: rol no permitido (403), sin rol (403) y verificarRol sin req.usuario (401)', async () => {
    expect((await request(app).get('/reportes/admin/multas-pdf').set(...residente)).statusCode).toBe(403);
    expect((await request(app).get('/reportes/admin/multas-pdf').set(...sinRol)).statusCode).toBe(403);

    // Línea 32 auth.js: verificarRol sin req.usuario
    const resMock = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    verificarRol('Administrador')({}, resMock, jest.fn());
    expect(resMock.status).toHaveBeenCalledWith(401);
  });

  // --- Reportes Administrativos ---
  test('GET /admin/* genera reportes correctamente (200)', async () => {
    expect((await request(app).get('/reportes/admin/multas-pdf').set(...admin)).statusCode).toBe(200);
    expect(ReporteService.generarMultasPdf).toHaveBeenCalled();

    expect((await request(app).get('/reportes/admin/alquileres-pdf').set(...admin)).statusCode).toBe(200);
    expect(ReporteService.generarAlquileresPdf).toHaveBeenCalled();

    expect((await request(app).get('/reportes/admin/pqrs-pdf').set(...admin)).statusCode).toBe(200);
    expect(ReporteService.generarPqrsPdf).toHaveBeenCalled();

    expect((await request(app).get('/reportes/admin/censo-apartamentos-pdf').set(...admin)).statusCode).toBe(200);
    expect(ReporteService.generarCensoApartamentosPdf).toHaveBeenCalled();
  });

  // --- Reportes Residentes ---
  test('GET /residente/* genera reportes para residente y administrador (200)', async () => {
    expect((await request(app).get('/reportes/residente/paz-y-salvo-pdf').set(...residente)).statusCode).toBe(200);
    expect(ReporteService.generarPazYSalvoPdf).toHaveBeenCalledWith(2, expect.anything());

    expect((await request(app).get('/reportes/residente/comprobante-reserva-pdf/10').set(...residente)).statusCode).toBe(200);
    expect(ReporteService.generarComprobanteReservaPdf).toHaveBeenCalledWith('10', 2, false, expect.anything());

    expect((await request(app).get('/reportes/residente/comprobante-reserva-pdf/10').set(...admin)).statusCode).toBe(200);
    expect(ReporteService.generarComprobanteReservaPdf).toHaveBeenCalledWith('10', 1, true, expect.anything());
  });

  // --- Manejo de Excepciones de Negocio (400 y 403) ---
  test('Control de errores: propaga statusCode de negocio (400 y 403)', async () => {
    const errMultas = new Error('Tiene multas pendientes');
    errMultas.statusCode = 400;
    ReporteService.generarPazYSalvoPdf.mockRejectedValueOnce(errMultas);
    const resPaz = await request(app).get('/reportes/residente/paz-y-salvo-pdf').set(...residente);
    expect(resPaz.statusCode).toBe(400);
    expect(resPaz.body.toString()).toContain('Tiene multas pendientes');

    const errReserva = new Error('No autorizado');
    errReserva.statusCode = 403;
    ReporteService.generarComprobanteReservaPdf.mockRejectedValueOnce(errReserva);
    const resComp = await request(app).get('/reportes/residente/comprobante-reserva-pdf/10').set(...residente);
    expect(resComp.statusCode).toBe(403);
    expect(resComp.body.toString()).toContain('No autorizado');
  });

  // --- Catch 500 (Ramas sin statusCode) ---
  test('Catch 500: responde 500 ante error interno sin statusCode en todos los reportes', async () => {
    ReporteService.generarMultasPdf.mockRejectedValueOnce(new Error('Fallo motor'));
    expect((await request(app).get('/reportes/admin/multas-pdf').set(...admin)).statusCode).toBe(500);

    ReporteService.generarAlquileresPdf.mockRejectedValueOnce(new Error('Fallo motor'));
    expect((await request(app).get('/reportes/admin/alquileres-pdf').set(...admin)).statusCode).toBe(500);

    ReporteService.generarPqrsPdf.mockRejectedValueOnce(new Error('Fallo motor'));
    expect((await request(app).get('/reportes/admin/pqrs-pdf').set(...admin)).statusCode).toBe(500);

    ReporteService.generarCensoApartamentosPdf.mockRejectedValueOnce(new Error('Fallo motor'));
    expect((await request(app).get('/reportes/admin/censo-apartamentos-pdf').set(...admin)).statusCode).toBe(500);

    ReporteService.generarPazYSalvoPdf.mockRejectedValueOnce(new Error('Fallo motor'));
    expect((await request(app).get('/reportes/residente/paz-y-salvo-pdf').set(...residente)).statusCode).toBe(500);

    ReporteService.generarComprobanteReservaPdf.mockRejectedValueOnce(new Error('Fallo motor'));
    expect((await request(app).get('/reportes/residente/comprobante-reserva-pdf/10').set(...residente)).statusCode).toBe(500);
  });

  // --- Ramas headersSent (Líneas 10-61 en reportesController.js) ---
  test('Ramas headersSent: no intenta responder si los encabezados ya fueron enviados (100% Branches)', async () => {
    const fnStream = async (...args) => {
      const res = args[args.length - 1];
      Object.defineProperty(res, 'headersSent', { value: true, configurable: true });
      res.end();
      throw new Error('Stream error');
    };

    ReporteService.generarMultasPdf.mockImplementationOnce(fnStream);
    await request(app).get('/reportes/admin/multas-pdf').set(...admin);

    ReporteService.generarAlquileresPdf.mockImplementationOnce(fnStream);
    await request(app).get('/reportes/admin/alquileres-pdf').set(...admin);

    ReporteService.generarPqrsPdf.mockImplementationOnce(fnStream);
    await request(app).get('/reportes/admin/pqrs-pdf').set(...admin);

    ReporteService.generarCensoApartamentosPdf.mockImplementationOnce(fnStream);
    await request(app).get('/reportes/admin/censo-apartamentos-pdf').set(...admin);

    ReporteService.generarPazYSalvoPdf.mockImplementationOnce(fnStream);
    await request(app).get('/reportes/residente/paz-y-salvo-pdf').set(...residente);

    ReporteService.generarComprobanteReservaPdf.mockImplementationOnce(fnStream);
    await request(app).get('/reportes/residente/comprobante-reserva-pdf/10').set(...residente);
  });
});