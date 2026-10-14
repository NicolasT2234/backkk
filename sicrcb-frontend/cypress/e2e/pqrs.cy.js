// 1. Vista Administrador
describe('Pruebas de Caja Negra - PQRS Administrador (UI)', () => {

  beforeEach(() => {
    cy.intercept('GET', '**/api/usuarios/me', {
      statusCode: 200,
      body: { id: 1, email: 'admin@casablanca.com', rol: 'Administrador', nombres: 'Admin' }
    });
    cy.visit('/admin/pqrs');
  });

  it('CP-UI-01: Debe cargar la página de administración de PQRS', () => {
    cy.url().should('include', '/admin/pqrs');
  });

  it('CP-UI-02: Debe mostrar el título "PQRS"', () => {
    cy.contains('PQRS').should('be.visible');
  });

});

// 2. Vista Residente
describe('Pruebas de Caja Negra - PQRS Residente (UI)', () => {

  beforeEach(() => {
    cy.intercept('GET', '**/api/usuarios/me', {
      statusCode: 200,
      body: {
        id: 2,
        email: 'residente@casablanca.com',
        rol: 'Propietario', // <-- Cambiado de 'Residente' a 'Propietario'
        nombres: 'Juan'
      }
    });
    cy.visit('/pqrs');
  });

  it('CP-UI-03: Debe cargar la página de PQRS del residente', () => {
    cy.url().should('include', '/pqrs');
  });

  it('CP-UI-04: Debe mostrar el título "PQRS" para el residente', () => {
    cy.contains('PQRS').should('be.visible');
  });

});