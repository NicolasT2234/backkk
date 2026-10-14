// 1. Pruebas para el rol Administrador
describe('Pruebas de Caja Negra - Dashboard Administrador (UI)', () => {

  beforeEach(() => {
    cy.intercept('GET', '**/api/usuarios/me', {
      statusCode: 200,
      body: {
        id: 1,
        id_usuario: 1,
        email: 'admin@casablanca.com',
        rol: 'Administrador',
        nombres: 'Admin',
        apellidos: 'Casa Blanca'
      }
    });

    // Simulamos los KPIs del dashboard de Administrador
    cy.intercept('GET', '**/api/dashboard/estadisticas', {
      statusCode: 200,
      body: {
        totalUsuarios: 10,
        totalApartamentos: 20,
        ocupacionPorcentaje: 50,
        pqrs: { pendientes: 1, enProceso: 0, resueltas: 5 },
        ingresosAlquileres: 100000,
        multas: { totalSanciones: 2, montoTotal: 50000, montoRecaudado: 25000, carteraPendiente: 25000 }
      }
    });

    cy.visit('/dashboard');
  });

  it('CP-UI-01: Debe cargar la página de dashboard del administrador', () => {
    cy.url().should('include', '/dashboard');
  });

  it('CP-UI-02: Debe mostrar el menú "Dashboard" y el rol "Admin"', () => {
    cy.contains('Dashboard').should('be.visible');
    cy.contains('Admin').should('be.visible');
  });

});

// 2. Pruebas para el rol Residente / Propietario
describe('Pruebas de Caja Negra - Dashboard Residente (UI)', () => {

  beforeEach(() => {
    cy.intercept('GET', '**/api/usuarios/me', {
      statusCode: 200,
      body: {
        id: 2,
        id_usuario: 2,
        email: 'residente@casablanca.com',
        rol: 'Propietario', // <-- Si en tu App.jsx el rol es 'Propietario' o 'Residente'
        nombres: 'Juan',
        apellidos: 'Perez'
      }
    });

    // Simulamos los datos que pide ResidenteDashboard.jsx al cargar
    cy.intercept('GET', '**/api/dashboard/residente', {
      statusCode: 200,
      body: {
        propietario: {
          nombre: 'Juan Perez',
          apartamento: 'Bloque 1 - Apto 101',
          alDia: true
        },
        metricas: {
          multasPendientes: 0,
          multasResueltas: 1,
          reservasActivas: 0,
          noticiasActivas: 2,
          pqrsActivas: 0
        },
        notificaciones: [],
        proximasReservas: [],
        ultimasNoticias: []
      }
    });

    cy.visit('/residente-dashboard');
  });

  it('CP-UI-03: Debe cargar la página de dashboard del residente', () => {
    cy.url().should('include', '/residente-dashboard');
  });

  it('CP-UI-04: Debe mostrar el menú "Dashboard" y el rol "Residente"', () => {
    cy.contains('Dashboard').should('be.visible');
    cy.contains('Residente').should('be.visible');
  });

});