// 1. Vista de Noticias como Administrador
describe('Pruebas de Caja Negra - Noticias Administrador (UI)', () => {

  beforeEach(() => {
    cy.intercept('GET', '**/api/usuarios/me', {
      statusCode: 200,
      body: { id: 1, id_usuario: 1, email: 'admin@casablanca.com', rol: 'Administrador', nombres: 'Nicolas' }
    });
    cy.intercept('GET', '**/api/noticias*', { statusCode: 200, body: [] });

    cy.visit('/noticias');
  });

  it('CP-UI-01: Debe cargar la página de noticias para el Administrador', () => {
    cy.url().should('include', '/noticias');
  });

  it('CP-UI-02: Debe mostrar la sección "Noticias" y el rol "Admin"', () => {
    cy.contains('Noticias').should('be.visible');
    cy.contains('Admin').should('be.visible');
  });

});

// 2. Vista de Noticias como Residente (rol: Propietario)
describe('Pruebas de Caja Negra - Noticias Residente (UI)', () => {

  beforeEach(() => {
    cy.intercept('GET', '**/api/usuarios/me', {
      statusCode: 200,
      body: { id: 2, id_usuario: 2, email: 'residente@casablanca.com', rol: 'Propietario', nombres: 'Juan' }
    });
    cy.intercept('GET', '**/api/noticias*', { statusCode: 200, body: [] });

    cy.visit('/noticias');
  });

  it('CP-UI-03: Debe cargar la página de noticias para el Residente', () => {
    cy.url().should('include', '/noticias');
  });

  it('CP-UI-04: Debe mostrar la sección "Noticias" y el rol "Residente"', () => {
    cy.contains('Noticias').should('be.visible');
    cy.contains('Residente').should('be.visible');
  });

});