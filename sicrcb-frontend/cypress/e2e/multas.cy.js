// 1. Vista de Multas como Administrador
describe('Pruebas de Caja Negra - Multas Administrador (UI)', () => {

  beforeEach(() => {
    cy.intercept('GET', '**/api/usuarios/me', {
      statusCode: 200,
      body: { id: 1, id_usuario: 1, email: 'admin@casablanca.com', rol: 'Administrador', nombres: 'Nicolas' }
    });
    cy.intercept('GET', '**/api/multas*', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/api/tipos_multa*', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/api/apartamentos*', { statusCode: 200, body: [] });

    cy.visit('/multas');
  });

  it('CP-UI-01: Debe cargar la página de multas para el Administrador', () => {
    cy.url().should('include', '/multas');
  });

  it('CP-UI-02: Debe mostrar la sección "Multas" y el rol "Admin"', () => {
    cy.contains('Multas').should('be.visible');
    cy.contains('Admin').should('be.visible');
  });

});

// 2. Vista de Multas como Residente (rol: Propietario)
describe('Pruebas de Caja Negra - Multas Residente (UI)', () => {

  beforeEach(() => {
    cy.intercept('GET', '**/api/usuarios/me', {
      statusCode: 200,
      body: { id: 2, id_usuario: 2, email: 'residente@casablanca.com', rol: 'Propietario', nombres: 'Juan' }
    });
    cy.intercept('GET', '**/api/multas/mis-multas*', { statusCode: 200, body: [] });

    cy.visit('/multas');
  });

  it('CP-UI-03: Debe cargar la página de multas para el Residente', () => {
    cy.url().should('include', '/multas');
  });

  it('CP-UI-04: Debe mostrar la sección "Multas" y el rol "Residente"', () => {
    cy.contains('Multas').should('be.visible');
    cy.contains('Residente').should('be.visible');
  });

});