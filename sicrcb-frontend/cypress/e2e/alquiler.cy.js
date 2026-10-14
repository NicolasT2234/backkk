// 1. Vista Administrador
describe('Pruebas de Caja Negra - Alquiler Administrador (UI)', () => {

  beforeEach(() => {
    cy.intercept('GET', '**/api/usuarios/me', {
      statusCode: 200,
      body: { id: 1, email: 'admin@casablanca.com', rol: 'Administrador', nombres: 'Admin' }
    });
    cy.visit('/admin/alquiler');
  });

  it('CP-UI-01: Debe cargar la página de gestión de alquileres (Admin)', () => {
    cy.url().should('include', '/admin/alquiler');
  });

  it('CP-UI-02: Debe mostrar la sección "Alquiler"', () => {
    cy.contains('Alquiler').should('be.visible');
  });

});

// 2. Vista Residente
describe('Pruebas de Caja Negra - Alquiler Residente (UI)', () => {

  beforeEach(() => {
    cy.intercept('GET', '**/api/usuarios/me', {
      statusCode: 200,
      body: {
        id: 2,
        email: 'residente@casablanca.com',
        rol: 'Propietario', // <-- DEBE SER 'Propietario' SEGÚN TU App.jsx
        nombres: 'Juan'
      }
    });
    cy.visit('/alquiler');
  });

  it('CP-UI-03: Debe cargar la página de reservas de alquiler (Residente)', () => {
    cy.url().should('include', '/alquiler');
  });

  it('CP-UI-04: Debe mostrar la sección "Alquiler" para el residente', () => {
    cy.contains('Alquiler').should('be.visible');
  });

});