describe('Pruebas de Caja Negra - Portal Institucional (UI)', () => {

  beforeEach(() => {
    cy.visit('/');
  });

  it('CP-UI-01: Debe cargar la página principal del portal institucional', () => {
    cy.url().should('include', 'localhost:5173');
  });

it('CP-UI-02: Debe mostrar el sello "CONJUNTO RESIDENCIAL CASA BLANCA"', () => {
  cy.contains('CONJUNTO RESIDENCIAL CASA BLANCA', { matchCase: false }).should('be.visible');
});

  it('CP-UI-03: Debe mostrar el título "Sistema Integral de Control y Registro Comunal"', () => {
    cy.contains('Sistema Integral de Control y Registro Comunal').should('be.visible');
  });

  it('CP-UI-04: Debe mostrar la descripción de la plataforma digital', () => {
    cy.contains('Plataforma digital para la gestión y convivencia').should('be.visible');
  });

  it('CP-UI-05: Debe mostrar el aviso de acceso exclusivo para residentes y administración', () => {
    cy.contains('Acceso exclusivo para residentes y administración').should('be.visible');
  });

  it('CP-UI-06: Debe mostrar el botón "Iniciar Sesión" y redirigir a /login al hacer clic', () => {
    cy.contains('Iniciar Sesión').should('be.visible').click();
    cy.url().should('include', '/login');
  });

});