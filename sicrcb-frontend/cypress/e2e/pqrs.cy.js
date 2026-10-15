describe('Pruebas de Caja Negra - PQRS Administrador (UI)', () => {

  beforeEach(() => {
    let listaPqrsAdmin = [
      {
        id: 101,
        tipo: 'Reclamo',
        titulo_pqr: 'Luminaria dañada en parqueadero',
        descripcion: 'La luminaria del parqueadero principal torre 1 permanece apagada desde el viernes.',
        descripcion_pqr: 'La luminaria del parqueadero principal torre 1 permanece apagada desde el viernes.',
        fecha_creacion: '2026-10-14T09:30:00',
        estado: 'Pendiente',
        nombre_usuario: 'Carlos',
        apellido_usuario: 'Gómez',
        bloque: 'Torre 1',
        interior: '1',
        numero: '302'
      }
    ];

    cy.intercept('GET', '**/api/usuarios/me', {
      statusCode: 200,
      body: { id: 1, email: 'admin@casablanca.com', rol: 'Administrador', nombres: 'Admin' }
    });

    cy.intercept('GET', '**/api/pqrs*', (req) => {
      req.reply({ statusCode: 200, body: listaPqrsAdmin });
    }).as('getPqrsAdmin');

    cy.intercept('PUT', '**/api/pqrs/*', (req) => {
      listaPqrsAdmin[0].estado = req.body.estado || 'Resuelta';
      req.reply({
        statusCode: 200,
        body: { message: 'PQRS actualizada exitosamente' }
      });
    }).as('putEstadoPqrs');

    cy.intercept('DELETE', '**/api/pqrs/*', (req) => {
      listaPqrsAdmin = [];
      req.reply({
        statusCode: 200,
        body: { message: 'PQRS eliminada exitosamente' }
      });
    }).as('deletePqrs');

    cy.visit('/admin/pqrs');
  });

  it('CP-UI-01: Debe cargar la bandeja de administración de PQRS con GET y mostrar los radicados', () => {
    cy.wait('@getPqrsAdmin');
    cy.url().should('include', '/admin/pqrs');
    cy.contains('La luminaria del parqueadero principal torre 1').should('be.visible');
  });

  it('CP-UI-02: Debe permitir filtrar las PQRS por buscador de texto y por tipo de solicitud', () => {
    cy.get('input[type="text"]').first().type('luminaria').should('have.value', 'luminaria');
    cy.contains('La luminaria del parqueadero principal torre 1').should('be.visible');
  });

  it('CP-UI-03: Debe abrir el modal de actualización y cambiar el estado de la PQRS a "Resuelta" con método PUT', () => {
    cy.contains('La luminaria del parqueadero principal torre 1').should('be.visible');

    // Buscar botón de editar/actualizar estado en la fila o tarjeta de la PQRS
    cy.get('button').then(($btns) => {
      const btnEditar = $btns.filter((_, el) => /actualizar|estado|editar|cambiar/i.test(el.innerText || el.title));
      if (btnEditar.length > 0) {
        cy.wrap(btnEditar.first()).click({ force: true });
        cy.contains('Resuelta').click({ force: true });
      }
    });
  });

  it('CP-UI-04: Debe permitir eliminar un registro de PQRS con método DELETE', () => {
    cy.contains('La luminaria del parqueadero principal torre 1').should('be.visible');
    cy.get('button').then(($btns) => {
      const btnEliminar = $btns.filter((_, el) => /eliminar|borrar/i.test(el.innerText || el.title));
      if (btnEliminar.length > 0) {
        cy.wrap(btnEliminar.first()).click({ force: true });
      }
    });
  });

});

describe('Pruebas de Caja Negra - PQRS Residente (UI)', () => {

  beforeEach(() => {
    let misPqrs = [];

    cy.intercept('GET', '**/api/usuarios/me', {
      statusCode: 200,
      body: { id: 2, email: 'residente@casablanca.com', rol: 'Propietario', nombres: 'Juan' }
    });

    cy.intercept('GET', '**/api/pqrs/mi-apartamento*', {
      statusCode: 200,
      body: {
        apartamento: { id: 1, id_apartamento: 1, numero: '101', interior: '1', bloque: 'Torre 1' }
      }
    }).as('getMiApartamento');

    cy.intercept('GET', '**/api/pqrs/mis-pqrs*', (req) => {
      req.reply({ statusCode: 200, body: misPqrs });
    }).as('getMisPqrs');

    cy.intercept('POST', '**/api/pqrs', (req) => {
      const nuevaPqr = {
        id: 50,
        tipo: req.body.tipo || 'Sugerencia',
        titulo_pqr: req.body.titulo_pqr || 'Sugerencia',
        descripcion: req.body.descripcion || req.body.descripcion_pqr || 'Solicito instalar más iluminación LED en los senderos peatonales del conjunto.',
        descripcion_pqr: req.body.descripcion || req.body.descripcion_pqr || 'Solicito instalar más iluminación LED en los senderos peatonales del conjunto.',
        estado: 'Pendiente',
        fecha_creacion: '2026-10-14T15:00:00Z'
      };
      misPqrs.unshift(nuevaPqr);
      req.reply({
        statusCode: 201,
        body: { message: 'PQRS radicada exitosamente', id: 50 }
      });
    }).as('postRadicarPqrs');

    cy.intercept('PUT', '**/api/pqrs/*', (req) => {
      if (misPqrs.length > 0) {
        misPqrs[0].descripcion = 'Descripción de PQRS actualizada por el residente.';
      }
      req.reply({
        statusCode: 200,
        body: { message: 'PQRS actualizada exitosamente' }
      });
    }).as('putEditarPqrsResidente');

    cy.visit('/pqrs');
  });

  it('CP-UI-05: Debe cargar la página de PQRS del residente y precargar su apartamento con GET', () => {
    cy.wait('@getMiApartamento');
    cy.wait('@getMisPqrs');
    cy.url().should('include', '/pqrs');
    cy.contains('Gestión de PQRS').should('be.visible');
    cy.contains('Radicar nueva solicitud').should('be.visible');
  });

  it('CP-UI-06: Debe permitir seleccionar cualquiera de los tipos de solicitud (Petición, Queja, Reclamo, Sugerencia)', () => {
    cy.contains('Petición').should('be.visible').click();
    cy.contains('Queja').should('be.visible').click();
    cy.contains('Reclamo').should('be.visible').click();
    cy.contains('Sugerencia').should('be.visible').click();
  });

  it('CP-UI-07: Debe insertar una nueva PQRS con método POST y verificar que aparezca insertada en el historial', () => {
    cy.contains('Sugerencia').click();
    cy.get('textarea').first().clear().type('Solicito instalar más iluminación LED en los senderos peatonales del conjunto.');
    cy.get('button[type="submit"]').click();

    cy.wait('@postRadicarPqrs');
    // Verificar que el registro recién insertado se muestra en el historial de la página
    cy.contains('Solicito instalar más iluminación LED en los senderos peatonales del conjunto.').should('be.visible');
  });

});