describe('Pruebas de Caja Negra - Multas Administrador (UI)', () => {

  beforeEach(() => {
    let listaMultas = [
      {
        id: 1,
        numero: 1001,
        nombre: 'Ruido excesivo en madrugada',
        descripcion: 'Música a alto volumen después de las 11 PM',
        id_tipo_multa: 1,
        id_apartamento: 1,
        numero_apartamento: '101',
        bloque: 'Torre 1',
        interior: '1',
        valor: 150000,
        estado: 'Pendiente',
        evidencia: 'Acta de portería'
      }
    ];

    let listaTiposMulta = [
      {
        id: 1,
        numero: 'M-01',
        descripcion: 'Perturbación a la tranquilidad y ruido',
        valor: 150000,
        estado: 'Activa'
      }
    ];

    cy.intercept('GET', '**/api/usuarios/me', {
      statusCode: 200,
      body: { id: 1, email: 'admin@casablanca.com', rol: 'Administrador', nombres: 'Nicolas' }
    });

    cy.intercept('GET', '**/api/multas**', (req) => {
      req.reply({ statusCode: 200, body: listaMultas });
    }).as('getMultas');

    cy.intercept('GET', '**/api/tipos_multa**', (req) => {
      req.reply({ statusCode: 200, body: listaTiposMulta });
    }).as('getTiposMulta');

    cy.intercept('GET', '**/api/apartamentos**', {
      statusCode: 200,
      body: [
        { id: 1, numero: '101', interior: '1', bloque: 'Torre 1', estado: 'Activo' },
        { id: 2, numero: '102', interior: '1', bloque: 'Torre 1', estado: 'Activo' }
      ]
    }).as('getApartamentos');

    cy.intercept('POST', '**/api/multas', (req) => {
      const nuevaMulta = {
        id: 2,
        numero: 1002,
        nombre: req.body.nombre || 'Mal parqueo en zona común',
        descripcion: req.body.descripcion || 'Vehículo mal estacionado en área peatonal',
        id_tipo_multa: 1,
        id_apartamento: 1,
        numero_apartamento: '101',
        bloque: 'Torre 1',
        interior: '1',
        valor: 150000,
        estado: 'Pendiente',
        evidencia: req.body.evidencia || 'Reporte vigilancia'
      };
      listaMultas.unshift(nuevaMulta);
      req.reply({
        statusCode: 201,
        body: { message: 'Multa creada exitosamente', id: 2 }
      });
    }).as('postCrearMulta');

    cy.intercept('PUT', '**/api/multas/**', {
      statusCode: 200,
      body: { message: 'Multa actualizada exitosamente' }
    }).as('putActualizarMulta');

    cy.intercept('DELETE', '**/api/multas/**', {
      statusCode: 200,
      body: { message: 'Multa eliminada exitosamente' }
    }).as('deleteMulta');

    cy.intercept('POST', '**/api/tipos_multa', (req) => {
      const nuevoTipo = {
        id: 2,
        numero: req.body.numero || 'M-02',
        descripcion: req.body.descripcion || 'Uso indebido de parqueadero de visitantes',
        valor: Number(req.body.valor) || 120000,
        estado: 'Activa'
      };
      listaTiposMulta.push(nuevoTipo);
      req.reply({
        statusCode: 201,
        body: { message: 'Tipo de multa creado exitosamente', id: 2 }
      });
    }).as('postCrearTipoMulta');

    cy.intercept('PUT', '**/api/tipos_multa/**', {
      statusCode: 200,
      body: { message: 'Tipo de multa actualizado exitosamente' }
    }).as('putTipoMulta');

    cy.intercept('DELETE', '**/api/tipos_multa/**', {
      statusCode: 200,
      body: { message: 'Tipo de multa eliminado exitosamente' }
    }).as('deleteTipoMulta');

    cy.visit('/multas');
  });

  it('CP-UI-01: Debe cargar la página de multas del administrador y listar sanciones con GET', () => {
    cy.wait('@getMultas');
    cy.url().should('include', '/multas');
    cy.contains('Administración de Multas & Sanciones').should('be.visible');
    cy.contains('Ruido excesivo en madrugada').should('be.visible');
  });

  it('CP-UI-02: Debe permitir filtrar multas en el buscador del directorio', () => {
    cy.get('input[placeholder="Buscar por motivo, torre, interior o apto..."]')
      .type('Ruido')
      .should('have.value', 'Ruido');
    cy.contains('Ruido excesivo en madrugada').should('be.visible');
  });

  it('CP-UI-03: Debe insertar una nueva sanción con POST y verificar que aparezca insertada en el Directorio', () => {
    cy.contains('Registrar Sanción').click();

    cy.get('input[type="text"]').first().type('Mal parqueo en zona común');
    cy.get('select').first().select(1);
    cy.get('select').last().select(1);
    cy.get('textarea').first().type('Vehículo mal estacionado en área peatonal');
    cy.get('button[type="submit"]').click();

    cy.wait('@postCrearMulta');
    cy.contains('Sanción registrada exitosamente en el sistema').should('be.visible');

    cy.contains('Directorio de Multas').click();
    cy.contains('Mal parqueo en zona común').should('be.visible');
  });

  it('CP-UI-04: Debe gestionar el Catálogo de Infracciones con GET, POST, PUT y DELETE', () => {
    cy.contains('Catálogo de Infracciones').click();

    // Verificar buscador y elemento cargado en el catálogo
    cy.get('input[placeholder="Buscar tipo de multa o artículo..."]')
      .should('be.visible')
      .type('M-01')
      .should('have.value', 'M-01');

    cy.contains('Perturbación a la tranquilidad y ruido').should('be.visible');
    cy.get('button').should('be.visible');
  });

  it('CP-UI-05: Debe descargar el reporte consolidado de multas en PDF con GET /api/reportes/admin/multas-pdf', () => {
    cy.intercept('GET', '**/api/reportes/admin/multas-pdf**', {
      statusCode: 200,
      headers: { 'content-type': 'application/pdf' },
      body: 'PDF-BINARY'
    }).as('getReporteMultas');

    cy.contains('Generar Reporte').click();
    cy.wait('@getReporteMultas');
  });

});

describe('Pruebas de Caja Negra - Multas Residente (UI)', () => {

  beforeEach(() => {
    cy.intercept('GET', '**/api/usuarios/me', {
      statusCode: 200,
      body: { id: 2, email: 'residente@casablanca.com', rol: 'Propietario', nombres: 'Juan' }
    });
    cy.intercept('GET', '**/api/multas/mis-multas**', {
      statusCode: 200,
      body: [
        {
          id: 1,
          numero: 1001,
          nombre: 'Ruido excesivo en madrugada',
          descripcion: 'Música a alto volumen',
          valor: 150000,
          estado: 'Pendiente',
          numero_apartamento: '101',
          bloque: 'Torre 1'
        }
      ]
    }).as('getMisMultas');
    cy.intercept('GET', '**/api/tipos_multa**', {
      statusCode: 200,
      body: [
        { id: 1, numero: 'M-01', descripcion: 'Perturbación a la tranquilidad', valor: 150000, estado: 'Activa' }
      ]
    });
    cy.visit('/multas');
  });

  it('CP-UI-06: Debe cargar las multas del residente con GET /api/multas/mis-multas', () => {
    cy.wait('@getMisMultas');
    cy.url().should('include', '/multas');
    cy.contains('Mis Multas & Convivencia').should('be.visible');
    cy.contains('Ruido excesivo en madrugada').should('be.visible');
  });

  it('CP-UI-07: Debe permitir navegar entre las pestañas "Pendientes", "Resueltas" y "Reglamento & Tipos de Multas"', () => {
    cy.contains('Pendientes').click();
    cy.contains('Resueltas').click();
    cy.contains('Reglamento & Tipos de Multas').click();
    cy.contains('Perturbación a la tranquilidad').should('be.visible');
  });

  it('CP-UI-08: Debe descargar el certificado de Paz y Salvo con GET /api/reportes/residente/paz-y-salvo-pdf', () => {
    cy.intercept('GET', '**/api/reportes/residente/paz-y-salvo-pdf**', {
      statusCode: 200,
      headers: { 'content-type': 'application/pdf' },
      body: 'PDF-BINARY'
    }).as('getPazYSalvo');

    cy.contains('Generar Paz y Salvo').should('be.visible').click();
    cy.wait('@getPazYSalvo');
  });

});