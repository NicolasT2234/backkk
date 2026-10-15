describe('Pruebas de Caja Negra - Login y Autenticación (UI)', () => {

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

  it('CP-UI-03: Debe mostrar el botón "Volver al inicio" y el logo institucional', () => {
    cy.contains('Volver al inicio').should('be.visible');
    cy.get('img[alt="Logo SICRCB"]').should('be.visible');
  });

  it('CP-UI-04: Debe permitir digitar el correo y la contraseña en el formulario', () => {
    cy.get('input[placeholder="ejemplo@correo.com"]')
      .type('admin@casablanca.com')
      .should('have.value', 'admin@casablanca.com');
    cy.get('input[placeholder="Digita tu contraseña"]')
      .type('Admin123*')
      .should('have.value', 'Admin123*');
  });

  it('CP-UI-05: Debe alternar la visibilidad de la contraseña al hacer clic en el ícono del ojo', () => {
    cy.get('input[placeholder="Digita tu contraseña"]').type('Admin123*');
    cy.get('.auth-password-toggle').click();
    cy.get('input[placeholder="Digita tu contraseña"]').should('have.attr', 'type', 'text');
    cy.get('.auth-password-toggle').click();
    cy.get('input[placeholder="Digita tu contraseña"]').should('have.attr', 'type', 'password');
  });

  it('CP-UI-06: Debe realizar el POST de login como Administrador y redirigir a /dashboard', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        message: 'Inicio de sesión exitoso',
        user: { id: 1, email: 'admin@casablanca.com', rol: 'Administrador', nombres: 'Nicolas' }
      }
    }).as('loginAdmin');
    cy.intercept('GET', '**/api/dashboard/estadisticas*', {
      statusCode: 200,
      body: { metricas: { alquileresActivos: 2, multasPendientes: 1, pqrsPendientes: 1, totalPropietarios: 10 } }
    });

    cy.get('input[placeholder="ejemplo@correo.com"]').type('admin@casablanca.com');
    cy.get('input[placeholder="Digita tu contraseña"]').type('Admin123*');
    cy.contains('Ingresar al Sistema').click();

    cy.wait('@loginAdmin');
    cy.url().should('include', '/dashboard');
  });

  it('CP-UI-07: Debe realizar el POST de login como Propietario y redirigir a /residente-dashboard', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        message: 'Inicio de sesión exitoso',
        user: { id: 2, email: 'residente@casablanca.com', rol: 'Propietario', nombres: 'Juan' }
      }
    }).as('loginResidente');
    cy.intercept('GET', '**/api/dashboard/residente*', {
      statusCode: 200,
      body: {
        propietario: { nombre: 'Juan', apartamento: 'Torre 1 - Apto 101', alDia: true },
        metricas: { multasPendientes: 0, multasResueltas: 1, reservasActivas: 0, noticiasActivas: 1, pqrsActivas: 0 }
      }
    });

    cy.get('input[placeholder="ejemplo@correo.com"]').type('residente@casablanca.com');
    cy.get('input[placeholder="Digita tu contraseña"]').type('Residente123*');
    cy.contains('Ingresar al Sistema').click();

    cy.wait('@loginResidente');
    cy.url().should('include', '/residente-dashboard');
  });

  it('CP-UI-08: Debe rechazar credenciales inválidas con POST (401) y mostrar la alerta de error', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 401,
      body: { error: 'Credenciales inválidas' }
    }).as('loginInvalido');

    cy.get('input[placeholder="ejemplo@correo.com"]').type('erroneo@casablanca.com');
    cy.get('input[placeholder="Digita tu contraseña"]').type('ClaveIncorrecta');
    cy.contains('Ingresar al Sistema').click();

    cy.wait('@loginInvalido');
    cy.contains('Credenciales inválidas').should('be.visible');
  });

  it('CP-UI-09: Debe bloquear el acceso con POST (403) cuando la cuenta está Inactiva', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 403,
      body: { error: 'Cuenta inactiva, contacte a la administración' }
    }).as('loginInactivo');

    cy.get('input[placeholder="ejemplo@correo.com"]').type('inactivo@casablanca.com');
    cy.get('input[placeholder="Digita tu contraseña"]').type('Clave123*');
    cy.contains('Ingresar al Sistema').click();

    cy.wait('@loginInactivo');
    cy.contains('Cuenta inactiva, contacte a la administración').should('be.visible');
  });

});