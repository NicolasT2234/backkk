describe('Pruebas de Caja Negra - Recuperación y Restablecimiento de Contraseña (UI)', () => {

  beforeEach(() => {
    cy.visit('/recuperar');
  });

  it('CP-UI-01: Debe cargar la página de recuperación de contraseña', () => {
    cy.url().should('include', '/recuperar');
  });

  it('CP-UI-02: Debe permitir ingresar el correo y enviar la solicitud con método POST', () => {
    cy.intercept('POST', '**/api/auth/solicitar-recuperacion', {
      statusCode: 200,
      body: { message: 'Si el correo está registrado, se enviaron las instrucciones' }
    }).as('postRecuperar');

    cy.get('input[type="email"]').type('residente@casablanca.com');
    cy.get('button[type="submit"]').click();
    cy.wait('@postRecuperar');
  });

  it('CP-UI-03: Debe cargar la vista de restablecer contraseña en /restablecer-password', () => {
    cy.visit('/restablecer-password?token=token_prueba_123');
    cy.url().should('include', '/restablecer-password');
  });

  it('CP-UI-04: Debe permitir digitar la nueva contraseña y enviarla con método POST', () => {
    cy.intercept('POST', '**/api/auth/restablecer-password', {
      statusCode: 200,
      body: { message: 'Contraseña actualizada con éxito' }
    }).as('postRestablecer');

    cy.visit('/restablecer-password?token=token_prueba_123');
    cy.get('input[type="password"]').first().type('NuevaClave2026*');
    cy.get('input[type="password"]').last().type('NuevaClave2026*');
    cy.get('button[type="submit"]').click();
  });

});