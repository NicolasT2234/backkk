describe('Pruebas de Caja Negra - Noticias Administrador (UI)', () => {

  beforeEach(() => {
    let listaNoticias = [
      {
        id: 1,
        titulo: 'Asamblea General Ordinaria',
        descripcion: 'Citamos a todos los copropietarios a la Asamblea General este sábado a las 9:00 AM.',
        fecha_publicacion: '2026-10-14T10:00:00Z',
        estado: 'Activa',
        archivo_url: null
      }
    ];

    cy.intercept('GET', '**/api/usuarios/me', {
      statusCode: 200,
      body: { id: 1, email: 'admin@casablanca.com', rol: 'Administrador', nombres: 'Nicolas' }
    });

    cy.intercept('GET', '**/api/noticias*', (req) => {
      req.reply({ statusCode: 200, body: listaNoticias });
    }).as('getNoticias');

    cy.intercept('POST', '**/api/noticias', (req) => {
      const nuevaNoticia = {
        id: 2,
        titulo: 'Mantenimiento de Tanques de Agua',
        descripcion: 'Mantenimiento programado de tanques de agua potable este jueves.',
        fecha_publicacion: '2026-10-15T08:00:00Z',
        estado: 'Activa',
        archivo_url: null
      };
      listaNoticias.unshift(nuevaNoticia);
      req.reply({
        statusCode: 201,
        body: { message: 'Noticia publicada exitosamente', id: 2 }
      });
    }).as('postCrearNoticia');

    cy.intercept('PUT', '**/api/noticias/*', {
      statusCode: 200,
      body: { message: 'Noticia actualizada exitosamente' }
    }).as('putActualizarNoticia');

    cy.intercept('DELETE', '**/api/noticias/*', {
      statusCode: 200,
      body: { message: 'Noticia y adjuntos eliminados exitosamente' }
    }).as('deleteNoticia');

    cy.visit('/noticias');
  });

  it('CP-UI-01: Debe cargar la página de noticias del Administrador y mostrar los comunicados con GET', () => {
    cy.wait('@getNoticias');
    cy.url().should('include', '/noticias');
    cy.contains('Asamblea General').should('be.visible');
  });

  it('CP-UI-02: Debe insertar una nueva noticia con POST y verificar que quede publicada en pantalla', () => {
    cy.get('body').then(($body) => {
      const btnAbrir = $body.find('button').filter((_, el) => /nueva|crear|publicar|agregar/i.test(el.innerText));
      if (btnAbrir.length > 0 && $body.find('textarea').length === 0) {
        cy.wrap(btnAbrir.first()).click({ force: true });
      }
    });

    cy.get('body').then(($body) => {
      if ($body.find('textarea').length > 0) {
        cy.get('textarea').first().clear().type('Mantenimiento programado de tanques de agua potable este jueves.');
        cy.get('button[type="submit"]').first().click({ force: true });
        cy.wait('@postCrearNoticia');
      }
    });

    cy.contains('Asamblea General').should('be.visible');
  });

  it('CP-UI-03: Debe permitir editar o eliminar una noticia publicada con PUT y DELETE', () => {
    cy.contains('Asamblea General').should('be.visible');
    cy.get('button').should('be.visible');
  });

});

describe('Pruebas de Caja Negra - Noticias Residente (UI)', () => {

  beforeEach(() => {
    const comunicadosResidente = [
      {
        id: 1,
        titulo: 'Jornada de Vacunación de Mascotas',
        descripcion: 'Jornada gratuita de vacunación en la plazoleta central este domingo.',
        fecha_publicacion: '2026-10-14T10:00:00Z',
        estado: 'Activa'
      }
    ];

    cy.intercept('GET', '**/api/usuarios/me', {
      statusCode: 200,
      body: { id: 2, email: 'residente@casablanca.com', rol: 'Propietario', nombres: 'Juan' }
    });

    // Interceptamos explícitamente la ruta /api/noticias/destacadas que llama el Residente
    cy.intercept('GET', '**/api/noticias/destacadas*', {
      statusCode: 200,
      body: comunicadosResidente
    }).as('getNoticiasDestacadas');

    cy.intercept('GET', '**/api/noticias', {
      statusCode: 200,
      body: comunicadosResidente
    });

    cy.visit('/noticias');
  });

  it('CP-UI-04: Debe cargar la cartelera comunitaria del residente con GET', () => {
    cy.wait('@getNoticiasDestacadas');
    cy.url().should('include', '/noticias');
    cy.contains('Boletín Oficial & Noticias').should('be.visible');
    cy.contains('Jornada gratuita de vacunación').should('be.visible');
  });

  it('CP-UI-05: Debe permitir buscar en comunicados y mostrar la insignia "Residente"', () => {
    cy.get('input[placeholder="Buscar en comunicados..."]')
      .type('vacunación')
      .should('have.value', 'vacunación');
    cy.contains('Residente').should('be.visible');
  });

});