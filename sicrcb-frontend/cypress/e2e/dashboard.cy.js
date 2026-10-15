describe('Pruebas de Caja Negra - Dashboard Administrador (UI)', () => {

  beforeEach(() => {
    cy.intercept('GET', '**/api/usuarios/me', {
      statusCode: 200,
      body: { id: 1, email: 'admin@casablanca.com', rol: 'Administrador', nombres: 'Nicolas' }
    });
    cy.intercept('GET', '**/api/dashboard/estadisticas*', {
      statusCode: 200,
      body: {
        metricas: { alquileresActivos: 4, multasPendientes: 2, pqrsPendientes: 3, totalPropietarios: 30 },
        actividadReciente: [
          { id: 1, tipo: 'multa', descripcion: 'Sanción registrada en Torre 1 - Apto 101', fecha: '2026-10-14T12:00:00Z' }
        ],
        sistema: { apiOk: true, dbOk: true, dbLatencyMs: 11 }
      }
    }).as('getEstadisticas');
    cy.visit('/dashboard');
  });

  it('CP-UI-01: Debe cargar el dashboard del administrador y consultar métricas con GET', () => {
    cy.wait('@getEstadisticas');
    cy.url().should('include', '/dashboard');
    cy.contains('SICRCB Dashboard').should('be.visible');
  });

  it('CP-UI-02: Debe mostrar todos los módulos en la barra de navegación del Administrador', () => {
    cy.contains('Dashboard').should('be.visible');
    cy.contains('Residentes').should('be.visible');
    cy.contains('Multas').should('be.visible');
    cy.contains('Noticias').should('be.visible');
    cy.contains('Alquiler').should('be.visible');
    cy.contains('PQRS').should('be.visible');
  });

  it('CP-UI-03: Debe permitir descargar el Informe Ejecutivo PDF con GET /api/reportes/admin/resumen-ejecutivo-pdf', () => {
    cy.intercept('GET', '**/api/reportes/admin/resumen-ejecutivo-pdf*', {
      statusCode: 200,
      headers: { 'content-type': 'application/pdf' },
      body: 'PDF-BINARY'
    }).as('getReporteEjecutivo');

    cy.contains('Generar Informe Ejecutivo (PDF)').should('be.visible').click();
    cy.wait('@getReporteEjecutivo');
  });

  it('CP-UI-04: Debe cerrar sesión con POST /api/auth/logout al hacer clic en "Salir"', () => {
    cy.intercept('POST', '**/api/auth/logout', {
      statusCode: 200,
      body: { message: 'Sesión cerrada correctamente' }
    }).as('postLogout');

    cy.get('.sicrcb-logout-btn').click();
    cy.wait('@postLogout');
    cy.url().should('eq', 'http://localhost:5173/');
  });

});

describe('Pruebas de Caja Negra - Dashboard Residente (UI)', () => {

  beforeEach(() => {
    cy.intercept('GET', '**/api/usuarios/me', {
      statusCode: 200,
      body: { id: 2, email: 'residente@casablanca.com', rol: 'Propietario', nombres: 'Juan' }
    });
    cy.intercept('GET', '**/api/dashboard/residente*', {
      statusCode: 200,
      body: {
        propietario: { nombre: 'Juan Perez', apartamento: 'Torre 1 - Apto 101', alDia: true },
        metricas: { multasPendientes: 0, multasResueltas: 2, reservasActivas: 1, noticiasActivas: 3, pqrsActivas: 1 },
        notificaciones: [],
        proximasReservas: [],
        ultimasNoticias: []
      }
    }).as('getDashboardResidente');
    cy.visit('/residente-dashboard');
  });

  it('CP-UI-05: Debe cargar el dashboard del residente y consultar sus datos con GET', () => {
    cy.wait('@getDashboardResidente');
    cy.url().should('include', '/residente-dashboard');
    cy.contains('¡Hola, Juan!').should('be.visible');
  });

  it('CP-UI-06: Debe mostrar el apartamento asignado y el estado "Apartamento al día"', () => {
    cy.contains('Torre 1 - Apto 101').should('be.visible');
    cy.contains('Apartamento al día').should('be.visible');
  });

  it('CP-UI-07: Debe sincronizar las métricas en tiempo real al hacer clic en "Sincronizar"', () => {
    cy.contains('Sincronizar').should('be.visible').click();
    cy.wait('@getDashboardResidente');
  });

  it('CP-UI-08: Debe mostrar las tarjetas KPI y redirigir a /multas al hacer clic en "Multas Pendientes"', () => {
    cy.contains('Multas Pendientes').should('be.visible').click();
    cy.url().should('include', '/multas');
  });

});