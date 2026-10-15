describe('Pruebas de Caja Negra - Módulo de Perfil de Usuario (SICRCB)', () => {
  const usuarioMock = {
    id: 1,
    nombres: 'Nicolas',
    nombre: 'Nicolas',
    apellidos: 'Tocora',
    apellido: 'Tocora',
    email: 'admin@casablanca.com',
    rol: 'Administrador',
    estado: 'Activo',
    tipoDocumento: 'CC',
    numeroDocumento: '1000123456',
    bloque: 'Administración Central',
    interior: 'Oficina 1',
    apartamento: 'Sede Administrativa'
  };

  beforeEach(() => {
    cy.viewport(1280, 720);

    cy.window().then((win) => {
      win.localStorage.setItem('usuario', JSON.stringify(usuarioMock));
      win.localStorage.setItem('user', JSON.stringify(usuarioMock));
    });

    cy.intercept('GET', '**/api/usuarios/me', {
      statusCode: 200,
      body: usuarioMock
    }).as('getPerfil');

    cy.intercept('GET', '**/api/apartamentos', {
      statusCode: 200,
      body: []
    }).as('getApartamentos');

    cy.intercept('PUT', '**/api/usuarios/me', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          ...usuarioMock,
          nombres: req.body.nombres || usuarioMock.nombres,
          apellidos: req.body.apellidos || usuarioMock.apellidos
        }
      });
    }).as('updatePerfil');

    cy.intercept('POST', '**/api/auth/logout', {
      statusCode: 200,
      body: { message: 'Sesión cerrada exitosamente' }
    }).as('postLogout');

    cy.visit('/perfil');
  });

  it('CP-UI-01: Debe cargar y mostrar la información del perfil del usuario', () => {
    cy.wait('@getPerfil');
    cy.contains('Perfil de Usuario').should('be.visible');
    cy.contains('Nicolas Tocora').should('be.visible');
    cy.contains('admin@casablanca.com').should('be.visible');
    cy.contains('1000123456').should('be.visible');
  });

  it('CP-UI-02: Debe permitir activar el modo edición y actualizar los datos del perfil', () => {
    cy.wait('@getPerfil');

    // 1. Activar modo edición
    cy.contains('button', 'Editar Perfil').click();

    // 2. Verificar que el input ya no tenga el atributo readonly
    cy.get('input[name="nombres"]').should('not.have.attr', 'readonly');

    // 3. Consultar nuevamente el elemento del DOM para limpiar y escribir
    cy.get('input[name="nombres"]').clear().type('Nicolas Steven');

    // 4. Guardar cambios y verificar respuesta
    cy.get('.btn-save, button[type="submit"]').first().click();

    cy.wait('@updatePerfil').its('response.statusCode').should('eq', 200);
    cy.contains('¡Perfil actualizado con éxito!').should('be.visible');
  });

  it('CP-UI-03: Debe cerrar la sesión con método POST al hacer clic en "Salir" y redirigir al inicio', () => {
    cy.wait('@getPerfil');

    cy.get('.sicrcb-logout-btn').should('be.visible').click();

    cy.wait('@postLogout').its('request.method').should('eq', 'POST');
    cy.location('pathname').should('be.oneOf', ['/', '/login']);
  });
});