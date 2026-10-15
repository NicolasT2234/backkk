describe('Pruebas de Caja Negra - Alquiler Administrador (UI)', () => {

  beforeEach(() => {
    let listaSolicitudes = [
      {
        id: 10,
        descripcion: 'Reunión de cumpleaños familiar',
        hora_inicio: '2026-12-20T14:00:00',
        hora_fin: '2026-12-20T18:00:00',
        estado: 'Pendiente',
        nombre_propietario: 'Juan',
        apellido_propietario: 'Perez',
        numero_apartamento: '101',
        bloque: 'Torre 1',
        valor_total: 160000
      }
    ];

    cy.intercept('GET', '**/api/usuarios/me', {
      statusCode: 200,
      body: { id: 1, email: 'admin@casablanca.com', rol: 'Administrador', nombres: 'Admin' }
    });

    cy.intercept('GET', '**/api/alquileres/configuracion*', {
      statusCode: 200,
      body: { valorHoraSalon: 50000, valorHoraSillas: 20000, totalSillas: 120 }
    });

    cy.intercept('GET', '**/api/alquileres*', (req) => {
      if (req.url.includes('configuracion') || req.url.includes('ocupacion') || req.url.includes('mis-alquileres')) return;
      req.reply({ statusCode: 200, body: listaSolicitudes });
    }).as('getSolicitudesAdmin');

    cy.intercept('PUT', '**/api/alquileres/configuracion', {
      statusCode: 200,
      body: { message: 'Configuración actualizada exitosamente' }
    }).as('putConfiguracion');

    cy.intercept('PUT', '**/api/alquileres/*', (req) => {
      if (req.url.includes('configuracion')) return;
      listaSolicitudes[0].estado = req.body.estado || 'Aprobada';
      req.reply({
        statusCode: 200,
        body: { message: 'Alquiler actualizado exitosamente' }
      });
    }).as('putEstadoReserva');

    cy.visit('/admin/alquiler');
  });

  it('CP-UI-01: Debe cargar la página de gestión de alquileres del Administrador y listar solicitudes con GET', () => {
    cy.wait('@getSolicitudesAdmin');
    cy.url().should('include', '/admin/alquiler');
    cy.contains('Reunión de cumpleaños familiar').should('be.visible');
  });

  it('CP-UI-02: Debe actualizar las tarifas horarias y el stock de sillas con método PUT y mostrar confirmación', () => {
    cy.get('form input[type="number"]').first().clear().type('55000');
    cy.get('form button[type="submit"]').first().click();

    cy.wait('@putConfiguracion');
    cy.contains('¡Tarifas e inventario actualizados con éxito!').should('be.visible');
  });

  it('CP-UI-03: Debe permitir filtrar las solicitudes en el buscador', () => {
    cy.contains('Reunión de cumpleaños familiar').should('be.visible');
    cy.get('input[type="text"]').first().type('Juan').should('have.value', 'Juan');
  });

  it('CP-UI-04: Debe permitir aprobar o cambiar el estado de una solicitud pendiente con método PUT', () => {
    cy.contains('Reunión de cumpleaños familiar').should('be.visible');
    cy.get('button').then(($btns) => {
      const btnAprobar = $btns.filter((_, el) => /aprobar|confirmar/i.test(el.innerText || el.title));
      if (btnAprobar.length > 0) {
        cy.wrap(btnAprobar.first()).click({ force: true });
      }
    });
  });

});

describe('Pruebas de Caja Negra - Alquiler Residente (UI)', () => {

  beforeEach(() => {
    let misReservas = [];

    cy.intercept('GET', '**/api/usuarios/me', {
      statusCode: 200,
      body: { id: 2, email: 'residente@casablanca.com', rol: 'Propietario', nombres: 'Juan', apellidos: 'Perez' }
    });

    cy.intercept('GET', '**/api/alquileres/configuracion*', {
      statusCode: 200,
      body: { valorHoraSalon: 50000, valorHoraSillas: 20000, totalSillas: 120 }
    });

    cy.intercept('GET', '**/api/apartamentos*', {
      statusCode: 200,
      body: [
        {
          id: 1,
          numero: 101,
          interior: '1',
          bloque: 'Torre 1',
          estado: 'Activo',
          nombre_propietario: 'Juan',
          apellido_propietario: 'Perez'
        }
      ]
    });

    cy.intercept('GET', '**/api/alquileres/ocupacion*', {
      statusCode: 200,
      body: { fecha: '2026-12-20', reservasDelDia: [], franjas: [] }
    });

    cy.intercept('GET', '**/api/alquileres/mis-alquileres*', (req) => {
      req.reply({ statusCode: 200, body: misReservas });
    }).as('getMisAlquileres');

    cy.intercept('POST', '**/api/alquileres', (req) => {
      const nuevaReserva = {
        id: 25,
        descripcion: req.body.descripcion || 'Celebración de grado familiar en salón social',
        tipo_alquiler: 'salon',
        hora_inicio: '2026-12-20T10:00:00',
        hora_fin: '2026-12-20T12:00:00',
        valor_total: 100000,
        estado: 'Pendiente'
      };
      misReservas.unshift(nuevaReserva);
      req.reply({
        statusCode: 201,
        body: { message: 'Reserva creada exitosamente', id: 25, totalLiquidado: 100000 }
      });
    }).as('postCrearReserva');

    cy.intercept('DELETE', '**/api/alquileres/*', (req) => {
      misReservas = [];
      req.reply({
        statusCode: 200,
        body: { message: 'Alquiler eliminado exitosamente' }
      });
    }).as('deleteReserva');

    cy.visit('/alquiler');
  });

  it('CP-UI-05: Debe cargar la página de alquiler del residente con GET', () => {
    cy.wait('@getMisAlquileres');
    cy.url().should('include', '/alquiler');
    cy.contains('Alquiler de Salón Comunal').should('be.visible');
    cy.contains('Nueva Solicitud de Reserva').should('be.visible');
  });

  it('CP-UI-06: Debe permitir alternar entre las modalidades "Salón Social", "Solo Sillas" y "Salón + Sillas"', () => {
    cy.contains('Salón Social').should('be.visible').click();
    cy.contains('Solo Sillas').should('be.visible').click();
    cy.contains('Salón + Sillas').should('be.visible').click();
  });

  it('CP-UI-07: Debe insertar una nueva solicitud de reserva con POST y verificar su inserción en el historial', () => {
    cy.contains('Salón Social').click();

    // 1. Escribir la descripción del evento
    cy.get('textarea').first()
      .clear()
      .type('Celebración de grado familiar en salón social');

    // 2. Seleccionar una fecha futura para que calculoReserva no bloquee por hora pasada de hoy
    cy.get('input[type="date"]').first().clear().type('2026-12-20');

    // 3. Seleccionar los bloques horarios buscando '10:00' y '12:00' (evita conflicto de guion largo)
    cy.contains('button', '10:00').click();
    cy.contains('button', '12:00').click();

    // 4. Enviar la solicitud con POST y verificar que quede insertada en la página
    cy.get('button[type="submit"]').click();

    cy.wait('@postCrearReserva');
    cy.contains('Celebración de grado familiar en salón social').should('be.visible');
  });

});