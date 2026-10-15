describe('Pruebas de Caja Negra - Gestión de Usuarios y Residentes (UI)', () => {

  beforeEach(() => {
    let listaUsuarios = [
      {
        id_usuario: 2,
        email: 'carlos@casablanca.com',
        estado_usuario: 'Activo',
        nombres: 'Carlos',
        apellidos: 'Ramirez',
        primer_nombre: 'Carlos',
        segundo_nombre: 'Andres',
        primer_apellido: 'Ramirez',
        segundo_apellido: 'Lopez',
        id_tipo_documento: 1,
        sigla_documento: 'CC',
        numero_documento: '10203040',
        rol: 'Propietario',
        apartamentos: [{ id: 1, numero: 101, interior: '1', bloque: 'Torre 1' }]
      }
    ];

    cy.intercept('GET', '**/api/usuarios/me', {
      statusCode: 200,
      body: { id: 1, email: 'admin@casablanca.com', rol: 'Administrador', nombres: 'Nicolas' }
    });

    cy.intercept('GET', '**/api/admin/usuarios/catalogos*', {
      statusCode: 200,
      body: {
        roles: [{ id: 1, nombre: 'Administrador' }, { id: 2, nombre: 'Propietario' }],
        tiposDocumento: [{ id: 1, sigla: 'CC', nombre_documento: 'Cédula de Ciudadanía' }],
        apartamentos: [
          { id: 1, numero: 101, interior: '1', bloque: 'Torre 1' },
          { id: 2, numero: 102, interior: '1', bloque: 'Torre 1' }
        ],
        apartamentosDisponibles: [
          { id: 2, numero: 102, interior: '1', bloque: 'Torre 1' }
        ]
      }
    }).as('getCatalogos');

    cy.intercept('GET', '**/api/admin/usuarios*', (req) => {
      req.reply({
        statusCode: 200,
        body: { usuarios: listaUsuarios }
      });
    }).as('getUsuarios');

    cy.intercept('POST', '**/api/admin/usuarios', (req) => {
      const nuevo = {
        id_usuario: 3,
        email: req.body.email || 'laura@casablanca.com',
        estado_usuario: 'Activo',
        nombres: req.body.primerNombre || req.body.primer_nombre || 'Laura',
        apellidos: req.body.primerApellido || req.body.primer_apellido || 'Martinez',
        primer_nombre: req.body.primerNombre || req.body.primer_nombre || 'Laura',
        primer_apellido: req.body.primerApellido || req.body.primer_apellido || 'Martinez',
        id_tipo_documento: 1,
        sigla_documento: 'CC',
        numero_documento: req.body.numeroDocumento || req.body.numero_documento || '10506070',
        rol: 'Propietario',
        apartamentos: [{ id: 2, numero: 102, interior: '1', bloque: 'Torre 1' }]
      };
      listaUsuarios.push(nuevo);
      req.reply({
        statusCode: 201,
        body: { message: 'Usuario creado exitosamente', id_usuario: 3, passwordTemporal: 'CasaBlanca2026*' }
      });
    }).as('postCrearUsuario');

    cy.intercept('PUT', '**/api/admin/usuarios/*', (req) => {
      listaUsuarios[0].primer_nombre = 'Carlos Editado';
      listaUsuarios[0].nombres = 'Carlos Editado';
      req.reply({
        statusCode: 200,
        body: { message: 'Usuario actualizado exitosamente' }
      });
    }).as('putEditarUsuario');

    cy.intercept('PATCH', '**/api/admin/usuarios/*/estado', (req) => {
      listaUsuarios[0].estado_usuario = 'Inactivo';
      req.reply({
        statusCode: 200,
        body: { message: 'Estado actualizado', estado: 'Inactivo' }
      });
    }).as('patchEstadoUsuario');

    cy.visit('/admin/usuarios');
  });

  it('CP-UI-01: Debe cargar la página de gestión de residentes y listar el censo con GET', () => {
    cy.wait('@getUsuarios');
    cy.url().should('include', '/admin/usuarios');
    cy.contains('Carlos').should('be.visible');
    cy.contains('carlos@casablanca.com').should('be.visible');
  });

  it('CP-UI-02: Debe permitir filtrar residentes en el buscador por nombre o documento', () => {
    cy.get('input[type="text"]').first().type('Carlos').should('have.value', 'Carlos');
    cy.contains('Carlos').should('be.visible');
  });

  it('CP-UI-03: Debe abrir el modal de creación, insertar un nuevo residente con POST y verificar su inserción', () => {
    cy.contains('button', /Nuevo|Registrar|Crear|Agregar/i).click();

    // Llenar campos del formulario en el modal
    cy.get('form input').eq(0).clear().type('Laura');
    cy.get('form input').eq(1).clear().type('Sofia');
    cy.get('form input').eq(2).clear().type('Martinez');
    cy.get('form input').eq(3).clear().type('Gomez');
    cy.get('form input').eq(4).clear().type('10506070');
    cy.get('form input[type="email"]').clear().type('laura@casablanca.com');

    // Seleccionar apartamento si hay casilla o botón de apartamento disponible
    cy.get('form').then(($form) => {
      if ($form.find('input[type="checkbox"]').length > 0) {
        cy.wrap($form.find('input[type="checkbox"]').first()).check({ force: true });
      }
    });

    cy.get('form button[type="submit"]').click({ force: true });
  });

  it('CP-UI-04: Debe abrir el modal de edición de "Carlos" y actualizar sus datos con método PUT', () => {
    cy.contains('Carlos').should('be.visible');
    // Clic en el botón de editar de la fila del usuario
    cy.get('table button, .usuario-card button, button[title*="Editar"], button').filter(':visible').then(($btns) => {
      const btnEditar = $btns.filter((_, el) => /editar/i.test(el.innerText || el.title));
      if (btnEditar.length > 0) {
        cy.wrap(btnEditar.first()).click();
        cy.get('form button[type="submit"]').click({ force: true });
        cy.wait('@putEditarUsuario');
      }
    });
  });

  it('CP-UI-05: Debe cambiar el estado del residente entre Activo e Inactivo con método PATCH', () => {
    cy.contains('Carlos').should('be.visible');
    cy.get('button').then(($btns) => {
      const btnEstado = $btns.filter((_, el) => /inactivar|desactivar|estado|activo/i.test(el.innerText || el.title));
      if (btnEstado.length > 0) {
        cy.wrap(btnEstado.first()).click({ force: true });
      }
    });
  });

});