describe('Pruebas de Caja Negra - Login (UI)', () => {

  beforeEach(() => {
    cy.visit('/login');
  });

  it('CP-UI-01: Debe cargar la página de login', () => {
    cy.url().should('include', '/login');
  });

  it('CP-UI-02: Debe mostrar el título "Iniciar Sesión" y "Conjunto Residencial Casa Blanca"', () => {
    cy.contains('Iniciar Sesión').should('be.visible');
    cy.contains('Conjunto Residencial Casa Blanca').should('be.visible');
  });

  it('CP-UI-03: Debe mostrar los campos de correo, contraseña y el botón "Ingresar al Sistema"', () => {
    cy.get('input[placeholder="ejemplo@correo.com"]').should('be.visible');
    cy.get('input[placeholder="Digita tu contraseña"]').should('be.visible');
    cy.contains('button', 'Ingresar al Sistema').should('be.visible');
  });

  it('CP-UI-04: Debe permitir iniciar sesión como Administrador y redirigir a /dashboard', () => {
    // Simulamos la respuesta del backend para un Administrador
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        user: {
          id: 1,
          email: 'admin@casablanca.com',
          rol: 'Administrador',
          nombres: 'Nicolas'
        }
      }
    }).as('loginAdmin');

    cy.get('input[placeholder="ejemplo@correo.com"]').type('admin@casablanca.com');
    cy.get('input[placeholder="Digita tu contraseña"]').type('Admin123*');
    cy.contains('button', 'Ingresar al Sistema').click();

    cy.wait('@loginAdmin');
    cy.url().should('include', '/dashboard');
  });

  it('CP-UI-05: Debe permitir iniciar sesión como Residente y redirigir a /residente-dashboard', () => {
    // Simulamos la respuesta del backend para un Residente
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        user: {
          id: 2,
          email: 'residente@casablanca.com',
          rol: 'Residente',
          nombres: 'Juan'
        }
      }
    }).as('loginResidente');

    cy.get('input[placeholder="ejemplo@correo.com"]').type('residente@casablanca.com');
    cy.get('input[placeholder="Digita tu contraseña"]').type('Residente123*');
    cy.contains('button', 'Ingresar al Sistema').click();

    cy.wait('@loginResidente');
    cy.url().should('include', '/residente-dashboard');
  });

  it('CP-UI-06: Debe mostrar mensaje de error cuando las credenciales son incorrectas', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 401,
      body: {
        error: 'Credenciales inválidas'
      }
    }).as('loginFallido');

    cy.get('input[placeholder="ejemplo@correo.com"]').type('correo@falso.com');
    cy.get('input[placeholder="Digita tu contraseña"]').type('claveErronea');
    cy.contains('button', 'Ingresar al Sistema').click();

    cy.wait('@loginFallido');
    cy.contains('Credenciales inválidas').should('be.visible');
  });

});