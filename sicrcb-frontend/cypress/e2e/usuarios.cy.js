describe('Pruebas de Caja Negra - Gestión de Usuarios / Residentes (UI)', () => {

  beforeEach(() => {
    // Simulamos la respuesta de /api/usuarios/me para que AuthContext valide el rol Administrador
    cy.intercept('GET', '**/api/usuarios/me', {
      statusCode: 200,
      body: {
        id: 1,
        id_usuario: 1,
        email: 'admin@casablanca.com',
        rol: 'Administrador',
        nombres: 'Nicolas',
        apellidos: 'Tocora'
      }
    }).as('verificarSesion');

    // Visitamos la ruta real configurada en tu proyecto
    cy.visit('/admin/usuarios');
  });

  it('CP-UI-01: Debe cargar la página de gestión de usuarios/residentes', () => {
    cy.url().should('include', '/admin/usuarios');
  });

  it('CP-UI-02: Debe mostrar la sección de "Residentes" en la interfaz', () => {
    cy.contains('Residentes').should('be.visible');
  });

});