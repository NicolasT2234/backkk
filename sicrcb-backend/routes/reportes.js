
/**
 * ==============================================================================
 * SICRCB - SISTEMA DE INFORMACIÓN CONJUNTO RESIDENCIAL CASA BLANCA
 * MÓDULO CENTRALIZADO DE REPORTES EN TIEMPO REAL (PDF)
 * Archivo: backend/routes/reportes.js
 * 
 * Endpoints disponibles:
 * 1. GET /api/reportes/admin/multas-pdf             -> Reporte de Cartera y Multas (Admin)
 * 2. GET /api/reportes/residente/paz-y-salvo-pdf   -> Certificación Paz y Salvo Oficial (Residente)
 * 3. GET /api/reportes/admin/alquileres-pdf        -> Reporte de Alquileres e Ingresos (Admin)
 * 4. GET /api/reportes/residente/comprobante-reserva-pdf/:id -> Comprobante de Reserva (Residente)
 * 5. GET /api/reportes/admin/pqrs-pdf              -> Informe de Gestión PQRS (Admin)
 * 6. GET /api/reportes/residente/comprobante-pqr-pdf/:id     -> Radicado Oficial PQR (Residente)
 * 7. GET /api/reportes/admin/censo-apartamentos-pdf -> Directorio y Censo de Inmuebles (Admin)
 * 
 * Requisitos:
 * npm install pdfkit
 * ==============================================================================
 */

const express = require('express');
const pool = require('../db');
const { verificarToken, verificarRol } = require('../middlewares/auth');
const PDFDocument = require('pdfkit');

const router = express.Router();

// Helper: Formato Moneda Colombiana (COP)
const formatCOP = (valor) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(valor || 0);
};

// Helper: Formato de Fecha Legible
const formatFecha = (fecha) => {
  if (!fecha) return 'N/A';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
};

// Helper: Formato de Fecha y Hora Completa
const formatFechaHora = (fecha) => {
  if (!fecha) return 'N/A';
  const d = new Date(fecha);
  return d.toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper común para encabezado institucional
const dibujarEncabezado = (doc, tituloReporte, subtitulo = 'CONJUNTO RESIDENCIAL CASA BLANCA P.H. - SICRCB') => {
  doc.fillColor('#1B365D')
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(subtitulo, 36, 36);

  doc.fontSize(8)
    .font('Helvetica')
    .fillColor('#4A5568')
    .text('NIT: 900.876.543-1 | Régimen de Propiedad Horizontal (Ley 675 de 2001) | Carrera 68D # 45-20 Sur, Bogotá D.C.')
    .text(`Generado: ${new Date().toLocaleString('es-CO')} | Sistema SICRCB | Bogotá D.C.`);

  doc.moveDown(0.4);
  doc.strokeColor('#1B365D').lineWidth(1.5).moveTo(36, doc.y).lineTo(576, doc.y).stroke();
  doc.moveDown(0.7);

  // Banner
  const bannerY = doc.y;
  doc.rect(36, bannerY, 540, 26).fill('#1B365D');
  doc.fillColor('#FFFFFF')
    .fontSize(10.5)
    .font('Helvetica-Bold')
    .text(tituloReporte.toUpperCase(), 42, bannerY + 7, { align: 'center', width: 528 });

  doc.y = bannerY + 36;
};

// Helper común para pie de página legal
const dibujarPiePagina = (doc) => {
  if (doc.y > 670) doc.addPage();
  doc.strokeColor('#CBD5E0').lineWidth(0.75).moveTo(36, doc.y + 10).lineTo(576, doc.y + 10).stroke();
  doc.fontSize(7).font('Helvetica').fillColor('#718096')
    .text(
      'Documento oficial generado por el Sistema de Información para el Control Residencial Casa Blanca (SICRCB). Validez sujeta a verificación en base de datos.',
      36,
      doc.y + 16,
      { align: 'center', width: 540 }
    );
};

/**
 * -----------------------------------------------------------------------------
 * 1. REPORTE ADMINISTRATIVO: Cartera, Multas y Recaudo en Vivo
 * Rol: Administrador
 * -----------------------------------------------------------------------------
 */
router.get('/admin/multas-pdf', verificarToken, verificarRol('Administrador'), async (req, res) => {
  try {
    const [multas] = await pool.query(`
      SELECT m.id, m.numero, m.nombre, m.descripcion, m.estado,
             b.nombre AS bloque, i.numero AS interior, ap.numero AS apartamento,
             tm.valor AS monto, tm.descripcion AS tipo_multa
      FROM multa m
      JOIN apartamento ap ON m.id_apartamento = ap.id
      JOIN interior i ON ap.id_interior = i.id
      JOIN bloque b ON i.id_bloque = b.id
      JOIN tipo_multa tm ON m.id_tipo_multa = tm.id
      ORDER BY m.estado ASC, m.id DESC
    `);

    const totalSanciones = multas.length;
    let montoTotal = 0;
    let montoRecaudado = 0;
    let totalPagadas = 0;
    let totalPendientes = 0;

    multas.forEach(m => {
      const v = Number(m.monto || 0);
      montoTotal += v;
      if (m.estado === 'Pagada' || m.estado === 'Pagado' || m.estado === 'Resuelta') {
        montoRecaudado += v;
        totalPagadas++;
      } else {
        totalPendientes++;
      }
    });

    const porcentajeRecaudo = montoTotal > 0 ? Math.round((montoRecaudado / montoTotal) * 100) : 0;
    const montoPendiente = montoTotal - montoRecaudado;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Reporte_Multas_SICRCB_${Date.now()}.pdf`);

    const doc = new PDFDocument({ size: 'LETTER', margins: { top: 36, bottom: 40, left: 36, right: 36 } });
    doc.pipe(res);

    dibujarEncabezado(doc, 'Informe Consolidado de Sanciones, Cartera y Recaudo');

    // KPIs
    const kpiY = doc.y;
    const kpiWidth = 126;
    const kpiHeight = 44;
    const gap = 12;

    const kpis = [
      { label: 'TOTAL SANCIONES', val: `${totalSanciones}`, sub: `${totalPagadas} Pagadas / ${totalPendientes} Pend.` },
      { label: 'MONTO TOTAL', val: formatCOP(montoTotal), sub: 'Facturación global' },
      { label: 'RECAUDO COBRADO', val: formatCOP(montoRecaudado), sub: `${porcentajeRecaudo}% de efectividad` },
      { label: 'CARTERA PENDIENTE', val: formatCOP(montoPendiente), sub: `${100 - porcentajeRecaudo}% por cobrar` }
    ];

    kpis.forEach((kpi, idx) => {
      const x = 36 + idx * (kpiWidth + gap);
      doc.rect(x, kpiY, kpiWidth, kpiHeight).fillAndStroke('#F7FAFC', '#E2E8F0');
      doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#718096').text(kpi.label, x + 6, kpiY + 6, { width: kpiWidth - 12, align: 'center' });
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1B365D').text(kpi.val, x + 6, kpiY + 18, { width: kpiWidth - 12, align: 'center' });
      doc.fontSize(6).font('Helvetica').fillColor('#2E7D32').text(kpi.sub, x + 6, kpiY + 32, { width: kpiWidth - 12, align: 'center' });
    });

    doc.y = kpiY + kpiHeight + 14;

    // Tabla
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1B365D').text('Detalle de Sanciones Registradas');
    doc.moveDown(0.4);

    let tableY = doc.y;
    doc.rect(36, tableY, 540, 18).fill('#1B365D');
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#FFFFFF');
    doc.text('N°', 42, tableY + 5, { width: 35 });
    doc.text('Inmueble (Torre/Int/Apto)', 80, tableY + 5, { width: 130 });
    doc.text('Concepto / Infracción', 215, tableY + 5, { width: 165 });
    doc.text('Monto COP', 385, tableY + 5, { width: 85, align: 'right' });
    doc.text('Estado', 485, tableY + 5, { width: 85, align: 'center' });

    tableY += 18;

    multas.forEach((m, i) => {
      if (tableY > 700) {
        doc.addPage();
        tableY = 40;
        doc.rect(36, tableY, 540, 18).fill('#1B365D');
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#FFFFFF');
        doc.text('N°', 42, tableY + 5, { width: 35 });
        doc.text('Inmueble (Torre/Int/Apto)', 80, tableY + 5, { width: 130 });
        doc.text('Concepto / Infracción', 215, tableY + 5, { width: 165 });
        doc.text('Monto COP', 385, tableY + 5, { width: 85, align: 'right' });
        doc.text('Estado', 485, tableY + 5, { width: 85, align: 'center' });
        tableY += 18;
      }

      const rowBg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      doc.rect(36, tableY, 540, 16).fillAndStroke(rowBg, '#EDF2F7');

      doc.fontSize(7).font('Helvetica').fillColor('#2D3748');
      doc.text(m.numero ? `M-${m.numero}` : `M-${m.id}`, 42, tableY + 4, { width: 35 });
      doc.text(`Torre ${m.bloque} • Int ${m.interior} • Apto ${m.apartamento}`, 80, tableY + 4, { width: 130 });
      doc.text(m.nombre || m.tipo_multa || 'Sanción de convivencia', 215, tableY + 4, { width: 165, lineBreak: false, ellipsis: true });
      doc.font('Helvetica-Bold').text(formatCOP(m.monto), 385, tableY + 4, { width: 85, align: 'right' });

      const esPagada = m.estado === 'Pagada' || m.estado === 'Pagado' || m.estado === 'Resuelta';
      doc.rect(495, tableY + 2.5, 65, 11).fill(esPagada ? '#C6F6D5' : '#FED7D7');
      doc.fontSize(6.5).font('Helvetica-Bold').fillColor(esPagada ? '#22543D' : '#742A2A')
        .text(m.estado || 'Pendiente', 495, tableY + 4, { width: 65, align: 'center' });

      tableY += 16;
    });

    // Total
    doc.rect(36, tableY, 540, 18).fillAndStroke('#EDF2F7', '#CBD5E0');
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1A202C')
      .text('TOTAL CONSOLIDADO', 80, tableY + 5)
      .text(formatCOP(montoTotal), 385, tableY + 5, { width: 85, align: 'right' })
      .text(`${porcentajeRecaudo}% Cobrado`, 485, tableY + 5, { width: 85, align: 'center' });

    doc.y = tableY + 24;
    dibujarPiePagina(doc);
    doc.end();
  } catch (error) {
    console.error('Error al generar PDF de multas:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Error al generar reporte de multas' });
  }
});

/**
 * -----------------------------------------------------------------------------
 * 2. REPORTE DEL RESIDENTE: Certificación Oficial de Paz y Salvo
 * Rol: Residente autenticado
 * -----------------------------------------------------------------------------
 */
router.get('/residente/paz-y-salvo-pdf', verificarToken, async (req, res) => {
  try {
    const idUsuario = req.usuario.id;

    const [userDataRows] = await pool.query(`
      SELECT ud.numero_documento, ud.primer_nombre, ud.segundo_nombre, 
             ud.primer_apellido, ud.segundo_apellido,
             td.sigla AS tipo_doc, td.nombre_documento,
             ap.id AS id_apartamento, ap.numero AS numero_apartamento,
             i.numero AS numero_interior, b.nombre AS bloque,
             pga.fecha_registro
      FROM user_data ud
      JOIN tipo_documento td ON ud.id_tipo_documento = td.id
      JOIN propietario p ON ud.id = p.id_user_data
      JOIN propietario_gestion_apartamento pga ON p.id = pga.id_propietario AND pga.estado = 'Activo'
      JOIN apartamento ap ON pga.id_apartamento = ap.id
      JOIN interior i ON ap.id_interior = i.id
      JOIN bloque b ON i.id_bloque = b.id
      WHERE ud.id_usuario = ?
      LIMIT 1
    `, [idUsuario]);

    if (userDataRows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron datos residenciales activos asociados a este usuario.' });
    }

    const residente = userDataRows[0];
    const nombreCompleto = `${residente.primer_nombre} ${residente.segundo_nombre || ''} ${residente.primer_apellido} ${residente.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim();

    const [multasPendientes] = await pool.query(`
      SELECT m.id, tm.valor AS monto
      FROM multa m
      JOIN tipo_multa tm ON m.id_tipo_multa = tm.id
      WHERE m.id_apartamento = ? AND m.estado NOT IN ('Pagada', 'Pagado', 'Resuelta', 'Anulada')
    `, [residente.id_apartamento]);

    const saldoPendiente = multasPendientes.reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
    const estaPazYSalvo = saldoPendiente === 0;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Paz_y_Salvo_Apto_${residente.numero_apartamento}.pdf`);

    const doc = new PDFDocument({ size: 'LETTER', margins: { top: 40, bottom: 40, left: 45, right: 45 } });
    doc.pipe(res);

    dibujarEncabezado(doc, 'Certificación Oficial de Estado de Cuenta y Paz y Salvo');

    // Ficha
    const cardY = doc.y;
    doc.rect(45, cardY, 522, 58).fillAndStroke('#F7FAFC', '#CBD5E0');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1A202C')
      .text('Titular / Copropietario:', 55, cardY + 8)
      .text('Identificación Oficial:', 55, cardY + 22)
      .text('Unidad Privada:', 55, cardY + 36)
      .text('Ubicación Conjunto:', 55, cardY + 48);

    doc.font('Helvetica').fillColor('#2D3748')
      .text(nombreCompleto, 160, cardY + 8)
      .text(`${residente.tipo_doc} N° ${residente.numero_documento}`, 160, cardY + 22)
      .text(`Apartamento ${residente.numero_apartamento}`, 160, cardY + 36)
      .text(`Torre ${residente.bloque} • Interior ${residente.numero_interior}`, 160, cardY + 48);

    const radicado = `PYS-${residente.numero_apartamento}-${Date.now().toString().slice(-6)}`;
    doc.font('Helvetica-Bold').fillColor('#1A202C')
      .text('Fecha Emisión:', 360, cardY + 8)
      .text('Código Radicado:', 360, cardY + 22)
      .text('Vigencia:', 360, cardY + 36);

    doc.font('Helvetica').fillColor('#4A5568')
      .text(formatFecha(new Date()), 435, cardY + 8)
      .text(radicado, 435, cardY + 22)
      .text('30 días calendario', 435, cardY + 36);

    doc.y = cardY + 68;

    // Callout
    const saldY = doc.y;
    const bgCallout = estaPazYSalvo ? '#C6F6D5' : '#FED7D7';
    const borderCallout = estaPazYSalvo ? '#38A169' : '#E53E3E';
    const textCallout = estaPazYSalvo ? '#22543D' : '#742A2A';

    doc.rect(45, saldY, 522, 36).fillAndStroke(bgCallout, borderCallout);
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(textCallout)
      .text(estaPazYSalvo ? 'ESTADO FINANCIERO: A PAZ Y SALVO ($ 0 COP)' : `SALDO PENDIENTE POR SANCIONES: ${formatCOP(saldoPendiente)}`, 45, saldY + 8, { align: 'center', width: 522 });

    doc.fontSize(7.5).font('Helvetica').fillColor(textCallout)
      .text(estaPazYSalvo ? 'El inmueble se encuentra al corriente de todas sus obligaciones al momento de la expedición.' : 'Se requiere cancelar los valores pendientes para validar este certificado.', 45, saldY + 21, { align: 'center', width: 522 });

    doc.y = saldY + 48;

    // Declaración
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1B365D').text('Certificación Institucional');
    doc.moveDown(0.3);

    const textoCert = estaPazYSalvo
      ? `La Administración del CONJUNTO RESIDENCIAL CASA BLANCA P.H. (NIT 900.876.543-1), constituida formalmente bajo la Ley 675 de 2001 de Colombia, HACE CONSTAR que el Apartamento ${residente.numero_apartamento} (Torre ${residente.bloque}, Interior ${residente.numero_interior}), registrado a nombre de ${nombreCompleto}, identificado con ${residente.tipo_doc} N° ${residente.numero_documento}, se encuentra a la fecha y hora de emisión A PAZ Y SALVO por concepto de expensas necesarias y multas de convivencia.

Se expide el presente documento para los trámites que el titular estime pertinentes (notaría, entidades bancarias, arriendo o mudanza).`
      : `La Administración del CONJUNTO RESIDENCIAL CASA BLANCA P.H. deja constancia de que el Apartamento ${residente.numero_apartamento} presenta obligaciones pendientes por ${formatCOP(saldoPendiente)}. Para obtener el Paz y Salvo oficial se requiere la acreditación del pago respectivo.`;

    doc.fontSize(8).font('Helvetica').fillColor('#2D3748').text(textoCert, { align: 'justify', lineGap: 3 });

    // Firmas
    const firmaY = doc.y + 35;
    doc.strokeColor('#CBD5E0').lineWidth(1).moveTo(80, firmaY).lineTo(250, firmaY).stroke();
    doc.strokeColor('#CBD5E0').lineWidth(1).moveTo(360, firmaY).lineTo(530, firmaY).stroke();

    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1A202C')
      .text('ADMINISTRACIÓN GENERAL', 80, firmaY + 5, { width: 170, align: 'center' })
      .text('REVISORÍA / AUDITORÍA', 360, firmaY + 5, { width: 170, align: 'center' });

    doc.fontSize(6.5).font('Helvetica').fillColor('#718096')
      .text('Conjunto Residencial Casa Blanca\nFirma Digital Certificada', 80, firmaY + 16, { width: 170, align: 'center' })
      .text('Control Interno Copropiedad\nValidez Verificable SICRCB', 360, firmaY + 16, { width: 170, align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error al generar Paz y Salvo:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Error al generar la certificación de paz y salvo' });
  }
});

/**
 * -----------------------------------------------------------------------------
 * 3. REPORTE ADMINISTRATIVO: Alquileres, Salón Comunal y Mobiliario (Sillas)
 * Rol: Administrador
 * -----------------------------------------------------------------------------
 */
router.get('/admin/alquileres-pdf', verificarToken, verificarRol('Administrador'), async (req, res) => {
  try {
    const [alquileres] = await pool.query(`
      SELECT a.id, a.descripcion, a.hora_inicio, a.hora_fin, a.valor_hora, a.estado,
             ud.primer_nombre, ud.primer_apellido, ud.numero_documento,
             ap.numero AS apartamento, i.numero AS interior, b.nombre AS bloque,
             a.id_salon_comunal,
             COALESCE(als.cantidad, 0) AS cantidad_sillas,
             CASE 
               WHEN a.id_salon_comunal IS NOT NULL AND COALESCE(als.cantidad, 0) > 0 THEN 'Salón + Sillas'
               WHEN a.id_salon_comunal IS NOT NULL THEN 'Salón Comunal'
               ELSE 'Sillas'
             END AS recurso
      FROM alquiler a
      JOIN propietario p ON a.id_propietario = p.id
      JOIN user_data ud ON p.id_user_data = ud.id
      LEFT JOIN propietario_gestion_apartamento pga ON p.id = pga.id_propietario AND pga.estado = 'Activo'
      LEFT JOIN apartamento ap ON pga.id_apartamento = ap.id
      LEFT JOIN interior i ON ap.id_interior = i.id
      LEFT JOIN bloque b ON i.id_bloque = b.id
      LEFT JOIN alquiler_silla als ON a.id = als.id_alquiler
      ORDER BY a.hora_inicio DESC
    `);

    let totalRecaudado = 0;
    let totalConfirmadas = 0;
    let totalReservadas = 0;
    let totalCanceladas = 0;
    let totalSillasUsadas = 0;

    const listaCalculada = alquileres.map(a => {
      const ini = new Date(a.hora_inicio);
      const fin = new Date(a.hora_fin);
      const horas = Math.max(1, Math.ceil((fin - ini) / (1000 * 60 * 60)));
      const totalAlquiler = horas * Number(a.valor_hora || 0);

      if (a.estado === 'Confirmado') {
        totalRecaudado += totalAlquiler;
        totalConfirmadas++;
      } else if (a.estado === 'Reservado') {
        totalReservadas++;
      } else if (a.estado === 'Cancelado') {
        totalCanceladas++;
      }
      totalSillasUsadas += Number(a.cantidad_sillas || 0);

      return {
        ...a,
        horas,
        totalAlquiler
      };
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Reporte_Alquileres_SICRCB_${Date.now()}.pdf`);

    const doc = new PDFDocument({ size: 'LETTER', margins: { top: 36, bottom: 40, left: 36, right: 36 } });
    doc.pipe(res);

    dibujarEncabezado(doc, 'Informe General de Alquileres de Áreas Comunes y Mobiliario');

    // KPIs
    const kpiY = doc.y;
    const kpiWidth = 126;
    const kpiHeight = 44;
    const gap = 12;

    const kpis = [
      { label: 'TOTAL RESERVAS', val: `${listaCalculada.length}`, sub: `${totalConfirmadas} Conf. / ${totalReservadas} Pend.` },
      { label: 'INGRESOS CONFIRMADOS', val: formatCOP(totalRecaudado), sub: 'Recaudo por eventos' },
      { label: 'SILLAS MOVILIZADAS', val: `${totalSillasUsadas}`, sub: 'Acumulado prestado' },
      { label: 'CANCELADAS', val: `${totalCanceladas}`, sub: 'Reservas declinadas' }
    ];

    kpis.forEach((kpi, idx) => {
      const x = 36 + idx * (kpiWidth + gap);
      doc.rect(x, kpiY, kpiWidth, kpiHeight).fillAndStroke('#F7FAFC', '#E2E8F0');
      doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#718096').text(kpi.label, x + 6, kpiY + 6, { width: kpiWidth - 12, align: 'center' });
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1B365D').text(kpi.val, x + 6, kpiY + 18, { width: kpiWidth - 12, align: 'center' });
      doc.fontSize(6).font('Helvetica').fillColor('#2E7D32').text(kpi.sub, x + 6, kpiY + 32, { width: kpiWidth - 12, align: 'center' });
    });

    doc.y = kpiY + kpiHeight + 14;

    // Tabla
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1B365D').text('Historial Detallado de Eventos y Reservas');
    doc.moveDown(0.4);

    let tableY = doc.y;
    doc.rect(36, tableY, 540, 18).fill('#1B365D');
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#FFFFFF');
    doc.text('ID', 40, tableY + 5, { width: 30 });
    doc.text('Inmueble / Solicitante', 75, tableY + 5, { width: 140 });
    doc.text('Recurso / Sillas', 220, tableY + 5, { width: 100 });
    doc.text('Fecha / Horario', 325, tableY + 5, { width: 110 });
    doc.text('Total COP', 440, tableY + 5, { width: 60, align: 'right' });
    doc.text('Estado', 505, tableY + 5, { width: 65, align: 'center' });

    tableY += 18;

    listaCalculada.forEach((r, i) => {
      if (tableY > 700) {
        doc.addPage();
        tableY = 40;
        doc.rect(36, tableY, 540, 18).fill('#1B365D');
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#FFFFFF');
        doc.text('ID', 40, tableY + 5, { width: 30 });
        doc.text('Inmueble / Solicitante', 75, tableY + 5, { width: 140 });
        doc.text('Recurso / Sillas', 220, tableY + 5, { width: 100 });
        doc.text('Fecha / Horario', 325, tableY + 5, { width: 110 });
        doc.text('Total COP', 440, tableY + 5, { width: 60, align: 'right' });
        doc.text('Estado', 505, tableY + 5, { width: 65, align: 'center' });
        tableY += 18;
      }

      const rowBg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      doc.rect(36, tableY, 540, 16).fillAndStroke(rowBg, '#EDF2F7');

      doc.fontSize(7).font('Helvetica').fillColor('#2D3748');
      doc.text(`#${r.id}`, 40, tableY + 4, { width: 30 });
      doc.text(`Apto ${r.apartamento || 'S/A'} - ${r.primer_nombre} ${r.primer_apellido}`, 75, tableY + 4, { width: 140, lineBreak: false, ellipsis: true });
      doc.text(`${r.recurso} (${r.cantidad_sillas} sillas)`, 220, tableY + 4, { width: 100 });
      doc.text(formatFechaHora(r.hora_inicio), 325, tableY + 4, { width: 110 });
      doc.font('Helvetica-Bold').text(formatCOP(r.totalAlquiler), 440, tableY + 4, { width: 60, align: 'right' });

      let badgeBg = '#FEFCBF';
      let badgeColor = '#744210';
      if (r.estado === 'Confirmado') {
        badgeBg = '#C6F6D5';
        badgeColor = '#22543D';
      } else if (r.estado === 'Cancelado') {
        badgeBg = '#FED7D7';
        badgeColor = '#742A2A';
      }

      doc.rect(505, tableY + 2.5, 65, 11).fill(badgeBg);
      doc.fontSize(6.5).font('Helvetica-Bold').fillColor(badgeColor)
        .text(r.estado || 'Reservado', 505, tableY + 4, { width: 65, align: 'center' });

      tableY += 16;
    });

    // Fila Total
    doc.rect(36, tableY, 540, 18).fillAndStroke('#EDF2F7', '#CBD5E0');
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1A202C')
      .text('TOTAL RECAUDADO (CONFIRMADOS)', 75, tableY + 5)
      .text(formatCOP(totalRecaudado), 440, tableY + 5, { width: 60, align: 'right' });

    doc.y = tableY + 24;
    dibujarPiePagina(doc);
    doc.end();
  } catch (error) {
    console.error('Error al generar PDF de alquileres:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Error al generar reporte de alquileres' });
  }
});

/**
 * -----------------------------------------------------------------------------
 * 4. REPORTE DEL RESIDENTE: Comprobante y Acta Oficial de Reserva
 * Rol: Residente autenticado o Admin
 * -----------------------------------------------------------------------------
 */
router.get('/residente/comprobante-reserva-pdf/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const idUsuario = req.usuario.id;
    const esAdmin = req.usuario.rol === 'Administrador';

    const [rows] = await pool.query(`
      SELECT a.id, a.descripcion, a.hora_inicio, a.hora_fin, a.valor_hora, a.estado,
             ud.primer_nombre, ud.segundo_nombre, ud.primer_apellido, ud.segundo_apellido,
             ud.numero_documento, td.sigla AS tipo_doc, ud.id_usuario,
             ap.numero AS apartamento, i.numero AS interior, b.nombre AS bloque,
             a.id_salon_comunal,
             COALESCE(als.cantidad, 0) AS cantidad_sillas
      FROM alquiler a
      JOIN propietario p ON a.id_propietario = p.id
      JOIN user_data ud ON p.id_user_data = ud.id
      JOIN tipo_documento td ON ud.id_tipo_documento = td.id
      LEFT JOIN propietario_gestion_apartamento pga ON p.id = pga.id_propietario AND pga.estado = 'Activo'
      LEFT JOIN apartamento ap ON pga.id_apartamento = ap.id
      LEFT JOIN interior i ON ap.id_interior = i.id
      LEFT JOIN bloque b ON i.id_bloque = b.id
      LEFT JOIN alquiler_silla als ON a.id = als.id_alquiler
      WHERE a.id = ?
      LIMIT 1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const reserva = rows[0];
    if (!esAdmin && reserva.id_usuario !== idUsuario) {
      return res.status(403).json({ error: 'No tienes autorización para consultar este comprobante' });
    }

    const nombreCompleto = `${reserva.primer_nombre} ${reserva.segundo_nombre || ''} ${reserva.primer_apellido} ${reserva.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim();
    const ini = new Date(reserva.hora_inicio);
    const fin = new Date(reserva.hora_fin);
    const horas = Math.max(1, Math.ceil((fin - ini) / (1000 * 60 * 60)));
    const totalLiquidado = horas * Number(reserva.valor_hora || 0);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Comprobante_Reserva_${reserva.id}.pdf`);

    const doc = new PDFDocument({ size: 'LETTER', margins: { top: 40, bottom: 40, left: 45, right: 45 } });
    doc.pipe(res);

    dibujarEncabezado(doc, 'Acta y Comprobante Oficial de Reserva de Áreas Comunes');

    // Ficha de reserva
    const fY = doc.y;
    doc.rect(45, fY, 522, 65).fillAndStroke('#F7FAFC', '#CBD5E0');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1A202C')
      .text('Titular Solicitante:', 55, fY + 8)
      .text('Documento de Identidad:', 55, fY + 22)
      .text('Inmueble / Unidad:', 55, fY + 36)
      .text('Motivo / Evento:', 55, fY + 50);

    doc.font('Helvetica').fillColor('#2D3748')
      .text(nombreCompleto, 165, fY + 8)
      .text(`${reserva.tipo_doc} N° ${reserva.numero_documento}`, 165, fY + 22)
      .text(`Apto ${reserva.apartamento || 'N/A'} (Torre ${reserva.bloque || '1'} • Int ${reserva.interior || '1'})`, 165, fY + 36)
      .text(reserva.descripcion || 'Reunión familiar / evento privado', 165, fY + 50, { width: 170, lineBreak: false, ellipsis: true });

    doc.font('Helvetica-Bold').fillColor('#1A202C')
      .text('Código Reserva:', 355, fY + 8)
      .text('Estado Actual:', 355, fY + 22)
      .text('Horas Liquidada(s):', 355, fY + 36)
      .text('Total a Pagar / Pagado:', 355, fY + 50);

    doc.font('Helvetica').fillColor('#1B365D')
      .text(`ALQ-#${reserva.id}`, 465, fY + 8)
      .text(reserva.estado, 465, fY + 22)
      .text(`${horas} hora(s)`, 465, fY + 36)
      .text(formatCOP(totalLiquidado), 465, fY + 50);

    doc.y = fY + 76;

    // Detalle de recursos asignados
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1B365D').text('Especificación de Recursos y Espacios Reservados');
    doc.moveDown(0.3);

    const recY = doc.y;
    doc.rect(45, recY, 522, 42).fillAndStroke('#FFFFFF', '#E2E8F0');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#2D3748')
      .text('• Salón Comunal Principal:', 55, recY + 8)
      .text('• Mobiliario (Sillas Plásticas):', 55, recY + 24);

    doc.font('Helvetica')
      .text(reserva.id_salon_comunal ? 'Incluido (Capacidad máxima 80 personas)' : 'No incluido en esta reserva', 190, recY + 8)
      .text(`${reserva.cantidad_sillas} unidades en buen estado para entrega`, 190, recY + 24);

    doc.font('Helvetica-Bold')
      .text('Horario Autorizado:', 365, recY + 8)
      .text('Tarifa por Hora:', 365, recY + 24);

    doc.font('Helvetica')
      .text(`${formatFecha(reserva.hora_inicio)} (${formatFechaHora(reserva.hora_inicio).slice(-5)} a ${formatFechaHora(reserva.hora_fin).slice(-5)})`, 450, recY + 8)
      .text(formatCOP(reserva.valor_hora), 450, recY + 24);

    doc.y = recY + 52;

    // Normativa y Compromisos
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1B365D').text('Términos y Compromisos de Uso (Manual de Convivencia)');
    doc.moveDown(0.3);

    const textoReglas = `1. El copropietario solicitante se hace responsable por el cuidado, aseo y conservación de las instalaciones y mobiliario entregado.
2. El nivel de decibeles y música debe moderarse conforme al Código Nacional de Policía y Manual Interno de Convivencia (límite 10:00 p.m.).
3. El salón comunal y las sillas deberán ser entregados en idénticas condiciones a las recibidas a primera hora del día siguiente.
4. Cualquier daño o faltante en el inventario será facturado directamente en la siguiente cuenta de cobro del inmueble.`;

    doc.fontSize(7.5).font('Helvetica').fillColor('#4A5568').text(textoReglas, { lineGap: 3.5 });

    // Firmas
    const fBoxY = doc.y + 35;
    doc.strokeColor('#CBD5E0').lineWidth(1).moveTo(80, fBoxY).lineTo(250, fBoxY).stroke();
    doc.strokeColor('#CBD5E0').lineWidth(1).moveTo(360, fBoxY).lineTo(530, fBoxY).stroke();

    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1A202C')
      .text('ADMINISTRACIÓN CASA BLANCA', 80, fBoxY + 5, { width: 170, align: 'center' })
      .text('FIRMA DEL RESIDENTE RESPONSABLE', 360, fBoxY + 5, { width: 170, align: 'center' });

    doc.fontSize(6.5).font('Helvetica').fillColor('#718096')
      .text('Entrega Oficial de Espacio y Llaves', 80, fBoxY + 16, { width: 170, align: 'center' })
      .text(`Aceptación de Inventario y Compromiso\nApto ${reserva.apartamento || ''}`, 360, fBoxY + 16, { width: 170, align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error al generar comprobante de reserva:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Error al generar el comprobante de reserva' });
  }
});

/**
 * -----------------------------------------------------------------------------
 * 5. REPORTE ADMINISTRATIVO: Informe de Gestión y Eficiencia de PQRS
 * Rol: Administrador
 * -----------------------------------------------------------------------------
 */
router.get('/admin/pqrs-pdf', verificarToken, verificarRol('Administrador'), async (req, res) => {
  try {
    const [pqrs] = await pool.query(`
      SELECT qs.id, qs.descripcion_pqr AS descripcion, qs.fecha AS fecha_creacion,
             qs.estado, qs.titulo_pqr AS tipo,
             ud.primer_nombre, ud.primer_apellido,
             b.nombre AS bloque, ap.numero AS apartamento, i.numero AS interior
      FROM queja_sugerencia qs
      JOIN propietario p ON qs.id_propietario = p.id
      JOIN user_data ud ON p.id_user_data = ud.id
      LEFT JOIN pqr_especifica pe ON qs.id = pe.id_queja_sugerencia
      LEFT JOIN apartamento ap ON pe.id_apartamento = ap.id
      LEFT JOIN interior i ON ap.id_interior = i.id
      LEFT JOIN bloque b ON i.id_bloque = b.id
      ORDER BY qs.fecha DESC
    `);

    const totalPQRS = pqrs.length;
    let resueltas = 0;
    let enProceso = 0;
    let pendientes = 0;

    pqrs.forEach(p => {
      const e = (p.estado || '').toLowerCase();
      if (e === 'resuelta' || e === 'cerrada') resueltas++;
      else if (e === 'en proceso') enProceso++;
      else pendientes++;
    });

    const porcentajeResolucion = totalPQRS > 0 ? Math.round((resueltas / totalPQRS) * 100) : 0;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Reporte_PQRS_SICRCB_${Date.now()}.pdf`);

    const doc = new PDFDocument({ size: 'LETTER', margins: { top: 36, bottom: 40, left: 36, right: 36 } });
    doc.pipe(res);

    dibujarEncabezado(doc, 'Informe Estadístico de Atención y Solución de PQRS');

    // KPIs
    const kpiY = doc.y;
    const kpiWidth = 126;
    const kpiHeight = 44;
    const gap = 12;

    const kpis = [
      { label: 'TOTAL RADICADOS', val: `${totalPQRS}`, sub: 'PQRS tramitadas' },
      { label: 'TASA DE RESOLUCIÓN', val: `${porcentajeResolucion}%`, sub: `${resueltas} casos cerrados` },
      { label: 'EN PROCESO', val: `${enProceso}`, sub: 'En investigación' },
      { label: 'PENDIENTES', val: `${pendientes}`, sub: 'Por asignar' }
    ];

    kpis.forEach((kpi, idx) => {
      const x = 36 + idx * (kpiWidth + gap);
      doc.rect(x, kpiY, kpiWidth, kpiHeight).fillAndStroke('#F7FAFC', '#E2E8F0');
      doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#718096').text(kpi.label, x + 6, kpiY + 6, { width: kpiWidth - 12, align: 'center' });
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1B365D').text(kpi.val, x + 6, kpiY + 18, { width: kpiWidth - 12, align: 'center' });
      doc.fontSize(6).font('Helvetica').fillColor('#2E7D32').text(kpi.sub, x + 6, kpiY + 32, { width: kpiWidth - 12, align: 'center' });
    });

    doc.y = kpiY + kpiHeight + 14;

    // Tabla
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1B365D').text('Registro Cronológico de PQRS');
    doc.moveDown(0.4);

    let tableY = doc.y;
    doc.rect(36, tableY, 540, 18).fill('#1B365D');
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#FFFFFF');
    doc.text('Radicado', 40, tableY + 5, { width: 45 });
    doc.text('Inmueble / Remitente', 90, tableY + 5, { width: 135 });
    doc.text('Tipo', 230, tableY + 5, { width: 75 });
    doc.text('Fecha', 310, tableY + 5, { width: 65 });
    doc.text('Descripción Resumida', 380, tableY + 5, { width: 120 });
    doc.text('Estado', 505, tableY + 5, { width: 65, align: 'center' });

    tableY += 18;

    pqrs.forEach((p, i) => {
      if (tableY > 700) {
        doc.addPage();
        tableY = 40;
        doc.rect(36, tableY, 540, 18).fill('#1B365D');
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#FFFFFF');
        doc.text('Radicado', 40, tableY + 5, { width: 45 });
        doc.text('Inmueble / Remitente', 90, tableY + 5, { width: 135 });
        doc.text('Tipo', 230, tableY + 5, { width: 75 });
        doc.text('Fecha', 310, tableY + 5, { width: 65 });
        doc.text('Descripción Resumida', 380, tableY + 5, { width: 120 });
        doc.text('Estado', 505, tableY + 5, { width: 65, align: 'center' });
        tableY += 18;
      }

      const rowBg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      doc.rect(36, tableY, 540, 16).fillAndStroke(rowBg, '#EDF2F7');

      doc.fontSize(7).font('Helvetica').fillColor('#2D3748');
      doc.text(`RAD-${p.id}`, 40, tableY + 4, { width: 45 });
      doc.text(`Apto ${p.apartamento || 'S/A'} - ${p.primer_nombre} ${p.primer_apellido}`, 90, tableY + 4, { width: 135, lineBreak: false, ellipsis: true });
      doc.text(p.tipo || 'Petición', 230, tableY + 4, { width: 75, lineBreak: false, ellipsis: true });
      doc.text(formatFecha(p.fecha_creacion), 310, tableY + 4, { width: 65 });
      doc.text(p.descripcion || '', 380, tableY + 4, { width: 120, lineBreak: false, ellipsis: true });

      const eLower = (p.estado || '').toLowerCase();
      let badgeBg = '#FED7D7';
      let badgeColor = '#742A2A';
      if (eLower === 'resuelta' || eLower === 'cerrada') {
        badgeBg = '#C6F6D5';
        badgeColor = '#22543D';
      } else if (eLower === 'en proceso') {
        badgeBg = '#BEE3F8';
        badgeColor = '#2B6CB0';
      }

      doc.rect(505, tableY + 2.5, 65, 11).fill(badgeBg);
      doc.fontSize(6.5).font('Helvetica-Bold').fillColor(badgeColor)
        .text(p.estado || 'Pendiente', 505, tableY + 4, { width: 65, align: 'center' });

      tableY += 16;
    });

    doc.y = tableY + 24;
    dibujarPiePagina(doc);
    doc.end();
  } catch (error) {
    console.error('Error al generar PDF de PQRS:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Error al generar reporte de PQRS' });
  }
});

/**
 * -----------------------------------------------------------------------------
 * 6. REPORTE DEL RESIDENTE: Comprobante Oficial de Radicación de PQR
 * Rol: Residente autenticado o Admin
 * -----------------------------------------------------------------------------
 */
router.get('/residente/comprobante-pqr-pdf/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const idUsuario = req.usuario.id;
    const esAdmin = req.usuario.rol === 'Administrador';

    const [rows] = await pool.query(`
      SELECT qs.id, qs.descripcion_pqr AS descripcion, qs.fecha AS fecha_creacion,
             qs.estado, qs.titulo_pqr AS tipo, qs.evidencias,
             ud.primer_nombre, ud.segundo_nombre, ud.primer_apellido, ud.segundo_apellido,
             ud.numero_documento, td.sigla AS tipo_doc, ud.id_usuario,
             b.nombre AS bloque, ap.numero AS apartamento, i.numero AS interior
      FROM queja_sugerencia qs
      JOIN propietario p ON qs.id_propietario = p.id
      JOIN user_data ud ON p.id_user_data = ud.id
      JOIN tipo_documento td ON ud.id_tipo_documento = td.id
      LEFT JOIN pqr_especifica pe ON qs.id = pe.id_queja_sugerencia
      LEFT JOIN apartamento ap ON pe.id_apartamento = ap.id
      LEFT JOIN interior i ON ap.id_interior = i.id
      LEFT JOIN bloque b ON i.id_bloque = b.id
      WHERE qs.id = ?
      LIMIT 1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Radicado PQR no encontrado' });
    }

    const pqr = rows[0];
    if (!esAdmin && pqr.id_usuario !== idUsuario) {
      return res.status(403).json({ error: 'No tienes autorización para consultar este radicado' });
    }

    const nombreCompleto = `${pqr.primer_nombre} ${pqr.segundo_nombre || ''} ${pqr.primer_apellido} ${pqr.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Radicado_PQR_${pqr.id}.pdf`);

    const doc = new PDFDocument({ size: 'LETTER', margins: { top: 40, bottom: 40, left: 45, right: 45 } });
    doc.pipe(res);

    dibujarEncabezado(doc, 'Constancia Oficial de Radicación de Solicitud (PQRS)');

    // Ficha
    const fY = doc.y;
    doc.rect(45, fY, 522, 60).fillAndStroke('#F7FAFC', '#CBD5E0');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1A202C')
      .text('Radicador / Titular:', 55, fY + 8)
      .text('Identificación Oficial:', 55, fY + 22)
      .text('Inmueble Vinculado:', 55, fY + 36)
      .text('Clasificación PQR:', 55, fY + 48);

    doc.font('Helvetica').fillColor('#2D3748')
      .text(nombreCompleto, 160, fY + 8)
      .text(`${pqr.tipo_doc} N° ${pqr.numero_documento}`, 160, fY + 22)
      .text(`Apto ${pqr.apartamento || 'S/A'} (Torre ${pqr.bloque || '1'} • Int ${pqr.interior || '1'})`, 160, fY + 36)
      .text(pqr.tipo || 'Petición / Consulta', 160, fY + 48);

    doc.font('Helvetica-Bold').fillColor('#1A202C')
      .text('Número de Radicado:', 360, fY + 8)
      .text('Fecha y Hora:', 360, fY + 22)
      .text('Estado de Trámite:', 360, fY + 36)
      .text('Plazo Máximo Resp.:', 360, fY + 48);

    doc.font('Helvetica').fillColor('#1B365D')
      .text(`RAD-${String(pqr.id).padStart(5, '0')}`, 460, fY + 8)
      .text(formatFechaHora(pqr.fecha_creacion), 460, fY + 22)
      .text(pqr.estado || 'Pendiente', 460, fY + 36)
      .text('15 días hábiles', 460, fY + 48);

    doc.y = fY + 70;

    // Cuerpo de la solicitud
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1B365D').text('Detalle y Exposición de Motivos de la Solicitud');
    doc.moveDown(0.3);

    const descY = doc.y;
    doc.rect(45, descY, 522, 110).fillAndStroke('#FFFFFF', '#CBD5E0');
    doc.fontSize(8).font('Helvetica').fillColor('#2D3748')
      .text(pqr.descripcion || 'Sin descripción detallada registrada.', 55, descY + 10, {
        width: 502,
        align: 'justify',
        lineGap: 3
      });

    doc.y = descY + 120;

    // Marco Legal
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1B365D').text('Garantías y Marco Legal Aplicable');
    doc.moveDown(0.3);

    const textoLegal = `De conformidad con la Constitución Política de Colombia (Art. 23) y la Ley 1755 de 2015 en concordancia con el Régimen de Propiedad Horizontal (Ley 675 de 2001), la Administración del CONJUNTO RESIDENCIAL CASA BLANCA acusará recibo y emitirá respuesta motivada dentro de los plazos legales establecidos (15 días hábiles para quejas y reclamos, 10 días hábiles para solicitudes de información y documentos).

Puede consultar el avance de su solicitud a través del portal web de SICRCB con el número de radicado.`;

    doc.fontSize(7.5).font('Helvetica').fillColor('#4A5568').text(textoLegal, { align: 'justify', lineGap: 3 });

    // Firmas
    const fBoxY = doc.y + 35;
    doc.strokeColor('#CBD5E0').lineWidth(1).moveTo(80, fBoxY).lineTo(250, fBoxY).stroke();
    doc.strokeColor('#CBD5E0').lineWidth(1).moveTo(360, fBoxY).lineTo(530, fBoxY).stroke();

    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1A202C')
      .text('VENTANILLA DE ATENCIÓN SICRCB', 80, fBoxY + 5, { width: 170, align: 'center' })
      .text('FIRMA / ACREDITACIÓN RESIDENTE', 360, fBoxY + 5, { width: 170, align: 'center' });

    doc.fontSize(6.5).font('Helvetica').fillColor('#718096')
      .text('Recepción y Radicación Electrónica', 80, fBoxY + 16, { width: 170, align: 'center' })
      .text(`${nombreCompleto}\n${pqr.tipo_doc} ${pqr.numero_documento}`, 360, fBoxY + 16, { width: 170, align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error al generar radicado PQR:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Error al generar comprobante de radicación' });
  }
});

/**
 * -----------------------------------------------------------------------------
 * 7. REPORTE ADMINISTRATIVO: Censo y Directorio General de Inmuebles
 * Rol: Administrador
 * -----------------------------------------------------------------------------
 */
router.get('/admin/censo-apartamentos-pdf', verificarToken, verificarRol('Administrador'), async (req, res) => {
  try {
    const [aptos] = await pool.query(`
      SELECT ap.id, ap.numero AS apartamento, ap.estado AS estado_apto,
             i.numero AS interior, b.nombre AS bloque,
             ud.primer_nombre, ud.primer_apellido, ud.numero_documento, td.sigla AS tipo_doc,
             pga.estado AS estado_asignacion
      FROM apartamento ap
      JOIN interior i ON ap.id_interior = i.id
      JOIN bloque b ON i.id_bloque = b.id
      LEFT JOIN propietario_gestion_apartamento pga ON ap.id = pga.id_apartamento AND pga.estado = 'Activo'
      LEFT JOIN propietario p ON pga.id_propietario = p.id
      LEFT JOIN user_data ud ON p.id_user_data = ud.id
      LEFT JOIN tipo_documento td ON ud.id_tipo_documento = td.id
      ORDER BY b.nombre ASC, i.numero ASC, ap.numero ASC
    `);

    const totalAptos = aptos.length;
    let habitados = 0;
    let desocupados = 0;

    aptos.forEach(a => {
      if (a.primer_nombre) habitados++;
      else desocupados++;
    });

    const porcentajeOcupacion = totalAptos > 0 ? Math.round((habitados / totalAptos) * 100) : 0;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Censo_Inmuebles_SICRCB_${Date.now()}.pdf`);

    const doc = new PDFDocument({ size: 'LETTER', margins: { top: 36, bottom: 40, left: 36, right: 36 } });
    doc.pipe(res);

    dibujarEncabezado(doc, 'Directorio General y Censo de Inmuebles Residenciales');

    // KPIs
    const kpiY = doc.y;
    const kpiWidth = 126;
    const kpiHeight = 44;
    const gap = 12;

    const kpis = [
      { label: 'TOTAL INMUEBLES', val: `${totalAptos}`, sub: 'Unidades residenciales' },
      { label: 'OCUPADOS / ASIGNADOS', val: `${habitados}`, sub: `${porcentajeOcupacion}% de ocupación` },
      { label: 'SIN PROPIETARIO REG.', val: `${desocupados}`, sub: 'Disponibles para registro' },
      { label: 'COPROPIEDAD', val: 'CASA BLANCA', sub: 'P.H. Bogotá D.C.' }
    ];

    kpis.forEach((kpi, idx) => {
      const x = 36 + idx * (kpiWidth + gap);
      doc.rect(x, kpiY, kpiWidth, kpiHeight).fillAndStroke('#F7FAFC', '#E2E8F0');
      doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#718096').text(kpi.label, x + 6, kpiY + 6, { width: kpiWidth - 12, align: 'center' });
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1B365D').text(kpi.val, x + 6, kpiY + 18, { width: kpiWidth - 12, align: 'center' });
      doc.fontSize(6).font('Helvetica').fillColor('#2E7D32').text(kpi.sub, x + 6, kpiY + 32, { width: kpiWidth - 12, align: 'center' });
    });

    doc.y = kpiY + kpiHeight + 14;

    // Tabla
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1B365D').text('Listado y Directorio por Bloque e Interior');
    doc.moveDown(0.4);

    let tableY = doc.y;
    doc.rect(36, tableY, 540, 18).fill('#1B365D');
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#FFFFFF');
    doc.text('Torre/Bloque', 42, tableY + 5, { width: 70 });
    doc.text('Interior', 115, tableY + 5, { width: 50 });
    doc.text('Apartamento', 170, tableY + 5, { width: 65 });
    doc.text('Copropietario / Titular', 240, tableY + 5, { width: 170 });
    doc.text('Documento', 415, tableY + 5, { width: 85 });
    doc.text('Estado', 505, tableY + 5, { width: 65, align: 'center' });

    tableY += 18;

    aptos.forEach((a, i) => {
      if (tableY > 700) {
        doc.addPage();
        tableY = 40;
        doc.rect(36, tableY, 540, 18).fill('#1B365D');
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#FFFFFF');
        doc.text('Torre/Bloque', 42, tableY + 5, { width: 70 });
        doc.text('Interior', 115, tableY + 5, { width: 50 });
        doc.text('Apartamento', 170, tableY + 5, { width: 65 });
        doc.text('Copropietario / Titular', 240, tableY + 5, { width: 170 });
        doc.text('Documento', 415, tableY + 5, { width: 85 });
        doc.text('Estado', 505, tableY + 5, { width: 65, align: 'center' });
        tableY += 18;
      }

      const rowBg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      doc.rect(36, tableY, 540, 16).fillAndStroke(rowBg, '#EDF2F7');

      doc.fontSize(7).font('Helvetica').fillColor('#2D3748');
      doc.text(`Torre ${a.bloque}`, 42, tableY + 4, { width: 70 });
      doc.text(`Int ${a.interior}`, 115, tableY + 4, { width: 50 });
      doc.font('Helvetica-Bold').text(`Apto ${a.apartamento}`, 170, tableY + 4, { width: 65 });
      doc.font('Helvetica');

      const titular = a.primer_nombre ? `${a.primer_nombre} ${a.primer_apellido}` : 'Sin Propietario Asignado';
      doc.text(titular, 240, tableY + 4, { width: 170, lineBreak: false, ellipsis: true });
      doc.text(a.numero_documento ? `${a.tipo_doc || 'CC'} ${a.numero_documento}` : 'N/A', 415, tableY + 4, { width: 85 });

      const ocupado = !!a.primer_nombre;
      doc.rect(505, tableY + 2.5, 65, 11).fill(ocupado ? '#C6F6D5' : '#E2E8F0');
      doc.fontSize(6.5).font('Helvetica-Bold').fillColor(ocupado ? '#22543D' : '#4A5568')
        .text(ocupado ? 'Ocupado' : 'Vacante', 505, tableY + 4, { width: 65, align: 'center' });

      tableY += 16;
    });

    doc.y = tableY + 24;
    dibujarPiePagina(doc);
    doc.end();
  } catch (error) {
    console.error('Error al generar PDF del censo:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Error al generar censo de inmuebles' });
  }
});


/**
 * -----------------------------------------------------------------------------
 * 8. REPORTE ADMINISTRATIVO EJECUTIVO: Balance Consolidado de Gestión Mensual
 * Destinado para: Consejo de Administración y Asamblea General de Copropietarios
 * Rol requerido: Administrador
 * -----------------------------------------------------------------------------
 */
router.get('/admin/resumen-ejecutivo-pdf', verificarToken, verificarRol('Administrador'), async (req, res) => {
  try {
    // 1. Datos financieros de Sanciones y Cartera
    const [multasRows] = await pool.query(`
      SELECT m.id, m.estado, tm.valor AS monto
      FROM multa m
      JOIN tipo_multa tm ON m.id_tipo_multa = tm.id
    `);

    let multasTotalFacturado = 0;
    let multasRecaudado = 0;
    let multasPendiente = 0;
    multasRows.forEach(m => {
      const v = Number(m.monto || 0);
      multasTotalFacturado += v;
      if (m.estado === 'Pagada' || m.estado === 'Pagado' || m.estado === 'Resuelta') {
        multasRecaudado += v;
      } else {
        multasPendiente += v;
      }
    });
    const efectividadMultas = multasTotalFacturado > 0 ? Math.round((multasRecaudado / multasTotalFacturado) * 100) : 0;

    // 2. Datos de Alquileres de Áreas Comunes y Mobiliario
    const [alquileresRows] = await pool.query(`
      SELECT a.id, a.hora_inicio, a.hora_fin, a.valor_hora, a.estado,
             a.id_salon_comunal, COALESCE(als.cantidad, 0) AS cantidad_sillas
      FROM alquiler a
      LEFT JOIN alquiler_silla als ON a.id = als.id_alquiler
    `);

    let alquileresRecaudado = 0;
    let totalSillasUsadas = 0;
    let alquileresConfirmados = 0;
    let alquileresPendientes = 0;
    let alquileresCancelados = 0;

    alquileresRows.forEach(a => {
      const ini = new Date(a.hora_inicio);
      const fin = new Date(a.hora_fin);
      const horas = Math.max(1, Math.ceil((fin - ini) / (1000 * 60 * 60)));
      const sub = horas * Number(a.valor_hora || 0);

      if (a.estado === 'Confirmado') {
        alquileresRecaudado += sub;
        alquileresConfirmados++;
      } else if (a.estado === 'Reservado') {
        alquileresPendientes++;
      } else if (a.estado === 'Cancelado') {
        alquileresCancelados++;
      }
      totalSillasUsadas += Number(a.cantidad_sillas || 0);
    });

    // 3. Datos de PQRS
    const [pqrsRows] = await pool.query(`SELECT id, estado, titulo_pqr AS tipo FROM queja_sugerencia`);
    const totalPQRS = pqrsRows.length;
    let pqrsResueltas = 0;
    let pqrsEnProceso = 0;
    let pqrsPendientes = 0;
    pqrsRows.forEach(p => {
      const e = (p.estado || '').toLowerCase();
      if (e === 'resuelta' || e === 'cerrada') pqrsResueltas++;
      else if (e === 'en proceso') pqrsEnProceso++;
      else pqrsPendientes++;
    });
    const tasaPQRS = totalPQRS > 0 ? Math.round((pqrsResueltas / totalPQRS) * 100) : 0;

    // 4. Datos de Censo e Inmuebles
    const [aptosRows] = await pool.query(`
      SELECT ap.id, pga.id_propietario
      FROM apartamento ap
      LEFT JOIN propietario_gestion_apartamento pga ON ap.id = pga.id_apartamento AND pga.estado = 'Activo'
    `);
    const totalApartamentos = aptosRows.length;
    let aptosHabitados = 0;
    aptosRows.forEach(a => {
      if (a.id_propietario) aptosHabitados++;
    });
    const tasaOcupacion = totalApartamentos > 0 ? Math.round((aptosHabitados / totalApartamentos) * 100) : 0;

    // Gran Total Ingresos en Vivo
    const granTotalIngresos = multasRecaudado + alquileresRecaudado;

    // Configurar respuesta PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Informe_Ejecutivo_Mensual_SICRCB_${Date.now()}.pdf`);

    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 36, bottom: 40, left: 36, right: 36 },
      info: {
        Title: 'Informe Ejecutivo Consolidado - SICRCB Casa Blanca',
        Author: 'Consejo de Administración Casa Blanca P.H.'
      }
    });

    doc.pipe(res);

    // ==========================================
    // PÁGINA 1: BALANCE GENERAL & OPERACIONAL
    // ==========================================
    dibujarEncabezado(doc, 'Informe Ejecutivo Consolidado de Gestión y Balance General');

    // 4 KPIs Maestros
    const kpiY = doc.y;
    const kpiWidth = 126;
    const kpiHeight = 44;
    const gap = 12;

    const kpisMaestros = [
      { label: 'INGRESOS TOTALES', val: formatCOP(granTotalIngresos), sub: 'Multas + Alquileres' },
      { label: 'OCUPACIÓN RESIDENCIAL', val: `${tasaOcupacion}%`, sub: `${aptosHabitados} de ${totalApartamentos} aptos` },
      { label: 'EFICIENCIA PQRS', val: `${tasaPQRS}%`, sub: `${pqrsResueltas} casos cerrados` },
      { label: 'CARTERA PENDIENTE', val: formatCOP(multasPendiente), sub: 'Saldo por recaudar' }
    ];

    kpisMaestros.forEach((kpi, idx) => {
      const x = 36 + idx * (kpiWidth + gap);
      doc.rect(x, kpiY, kpiWidth, kpiHeight).fillAndStroke('#F7FAFC', '#E2E8F0');
      doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#718096').text(kpi.label, x + 6, kpiY + 6, { width: kpiWidth - 12, align: 'center' });
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1B365D').text(kpi.val, x + 6, kpiY + 18, { width: kpiWidth - 12, align: 'center' });
      doc.fontSize(6).font('Helvetica').fillColor('#2E7D32').text(kpi.sub, x + 6, kpiY + 32, { width: kpiWidth - 12, align: 'center' });
    });

    doc.y = kpiY + kpiHeight + 16;

    // Sección 1: Balance Financiero y Cartera
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1B365D').text('1. Estado Financiero: Cartera, Sanciones y Recaudo');
    doc.moveDown(0.3);

    let tY = doc.y;
    doc.rect(36, tY, 540, 16).fill('#1B365D');
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#FFFFFF');
    doc.text('Concepto Financiero', 45, tY + 4, { width: 220 });
    doc.text('Facturación Bruta', 275, tY + 4, { width: 95, align: 'right' });
    doc.text('Recaudo Efectivo', 380, tY + 4, { width: 95, align: 'right' });
    doc.text('Efectividad / Saldo', 485, tY + 4, { width: 85, align: 'center' });

    tY += 16;

    const filasFinancieras = [
      {
        concepto: 'Sanciones y Multas de Convivencia',
        facturado: multasTotalFacturado,
        recaudado: multasRecaudado,
        extra: `${efectividadMultas}% Cobrado`
      },
      {
        concepto: 'Alquiler de Salón Comunal y Silletería',
        facturado: alquileresRecaudado,
        recaudado: alquileresRecaudado,
        extra: `${alquileresConfirmados} eventos`
      },
      {
        concepto: 'TOTAL INGRESOS RECAUDADOS',
        facturado: multasTotalFacturado + alquileresRecaudado,
        recaudado: granTotalIngresos,
        extra: 'Caja Activa'
      }
    ];

    filasFinancieras.forEach((f, idx) => {
      const isTotal = idx === filasFinancieras.length - 1;
      const bg = isTotal ? '#EDF2F7' : (idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC');
      doc.rect(36, tY, 540, 16).fillAndStroke(bg, '#E2E8F0');

      doc.fontSize(7).font(isTotal ? 'Helvetica-Bold' : 'Helvetica').fillColor('#2D3748');
      doc.text(f.concepto, 45, tY + 4, { width: 220 });
      doc.text(formatCOP(f.facturado), 275, tY + 4, { width: 95, align: 'right' });
      doc.font('Helvetica-Bold').text(formatCOP(f.recaudado), 380, tY + 4, { width: 95, align: 'right' });
      doc.font('Helvetica').text(f.extra, 485, tY + 4, { width: 85, align: 'center' });

      tY += 16;
    });

    doc.y = tY + 14;

    // Sección 2: Uso de Áreas Comunes y Gestión de Recursos
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1B365D').text('2. Aprovechamiento de Áreas Comunes y Mobiliario');
    doc.moveDown(0.3);

    const alqBoxY = doc.y;
    doc.rect(36, alqBoxY, 540, 52).fillAndStroke('#FFFFFF', '#CBD5E0');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1A202C')
      .text('Eventos Confirmados:', 48, alqBoxY + 10)
      .text('Sillas Prestadas / Movilizadas:', 48, alqBoxY + 28);

    doc.font('Helvetica').fillColor('#2D3748')
      .text(`${alquileresConfirmados} eventos realizados exitosamente`, 190, alqBoxY + 10)
      .text(`${totalSillasUsadas} unidades en perfecto estado`, 190, alqBoxY + 28);

    doc.font('Helvetica-Bold').fillColor('#1A202C')
      .text('Solicitudes Pendientes:', 370, alqBoxY + 10)
      .text('Eventos Cancelados:', 370, alqBoxY + 28);

    doc.font('Helvetica').fillColor('#744210')
      .text(`${alquileresPendientes} por aprobar`, 485, alqBoxY + 10)
      .text(`${alquileresCancelados} cancelados`, 485, alqBoxY + 28);

    doc.y = alqBoxY + 65;
    dibujarPiePagina(doc);

    // ==========================================
    // PÁGINA 2: CONVIVENCIA, CENSO Y DICTAMEN
    // ==========================================
    doc.addPage();
    dibujarEncabezado(doc, 'Convivencia, Censo Habitacional y Dictamen Administrativo');

    // Sección 3: PQRS y Clima de Convivencia
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1B365D').text('3. Gestión de Convivencia y Solicitudes Ciudadanas (PQRS)');
    doc.moveDown(0.3);

    const pqrBoxY = doc.y;
    doc.rect(36, pqrBoxY, 540, 48).fillAndStroke('#FFFFFF', '#CBD5E0');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1A202C')
      .text('Total Radicados Recibidos:', 48, pqrBoxY + 10)
      .text('Casos Resueltos a la Fecha:', 48, pqrBoxY + 26);

    doc.font('Helvetica').fillColor('#2D3748')
      .text(`${totalPQRS} radicados oficiales`, 190, pqrBoxY + 10)
      .text(`${pqrsResueltas} casos cerrados (${tasaPQRS}% de cumplimiento)`, 190, pqrBoxY + 26);

    doc.font('Helvetica-Bold').fillColor('#1A202C')
      .text('En Trámite Técnico:', 370, pqrBoxY + 10)
      .text('Pendientes de Asignar:', 370, pqrBoxY + 26);

    doc.font('Helvetica').fillColor('#2B6CB0')
      .text(`${pqrsEnProceso} en revisión`, 485, pqrBoxY + 10)
      .text(`${pqrsPendientes} nuevas`, 485, pqrBoxY + 26);

    doc.y = pqrBoxY + 62;

    // Sección 4: Parque Habitacional y Ocupación
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1B365D').text('4. Censo y Parque Habitacional de la Copropiedad');
    doc.moveDown(0.3);

    const censoBoxY = doc.y;
    doc.rect(36, censoBoxY, 540, 44).fillAndStroke('#F7FAFC', '#CBD5E0');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1A202C')
      .text('Total Unidades Privadas:', 48, censoBoxY + 10)
      .text('Apartamentos Ocupados:', 48, censoBoxY + 24);

    doc.font('Helvetica').fillColor('#2D3748')
      .text(`${totalApartamentos} inmuebles censados`, 190, censoBoxY + 10)
      .text(`${aptosHabitados} con residente activo`, 190, censoBoxY + 24);

    doc.font('Helvetica-Bold').fillColor('#1A202C')
      .text('Unidades Vacantes:', 370, censoBoxY + 10)
      .text('Índice de Ocupación:', 370, censoBoxY + 24);

    doc.font('Helvetica').fillColor('#22543D')
      .text(`${totalApartamentos - aptosHabitados} disponibles`, 485, censoBoxY + 10)
      .text(`${tasaOcupacion}% de la copropiedad`, 485, censoBoxY + 24);

    doc.y = censoBoxY + 56;

    // Sección 5: Dictamen y Conclusiones de Administración
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1B365D').text('5. Dictamen Administrativo y Observaciones para el Consejo');
    doc.moveDown(0.3);

    const dictamenText = `El presente informe consolida la operación técnica, financiera y comunitaria del CONJUNTO RESIDENCIAL CASA BLANCA P.H., generado en tiempo real a través del Sistema de Información SICRCB. Se certifica que los fondos recaudados por concepto de multas de convivencia y alquiler de zonas comunes se encuentran debidamente conciliados. Asimismo, se mantiene un índice de ocupación del ${tasaOcupacion}% y una tasa de atención de requerimientos comunitarios del ${tasaPQRS}%, en estricta observancia del Régimen de Propiedad Horizontal (Ley 675 de 2001) y el Manual de Convivencia vigente.`;

    doc.fontSize(7.5).font('Helvetica').fillColor('#2D3748').text(dictamenText, { align: 'justify', lineGap: 3 });

    doc.moveDown(2);

    // Firmas de Consejo, Administrador y Revisoría
    const fY = doc.y + 20;
    doc.strokeColor('#CBD5E0').lineWidth(1).moveTo(48, fY).lineTo(188, fY).stroke();
    doc.strokeColor('#CBD5E0').lineWidth(1).moveTo(236, fY).lineTo(376, fY).stroke();
    doc.strokeColor('#CBD5E0').lineWidth(1).moveTo(424, fY).lineTo(564, fY).stroke();

    doc.fontSize(7).font('Helvetica-Bold').fillColor('#1A202C')
      .text('ADMINISTRADOR GENERAL', 48, fY + 5, { width: 140, align: 'center' })
      .text('PRESIDENTE DEL CONSEJO', 236, fY + 5, { width: 140, align: 'center' })
      .text('REVISORÍA FISCAL', 424, fY + 5, { width: 140, align: 'center' });

    doc.fontSize(6).font('Helvetica').fillColor('#718096')
      .text('Representación Legal P.H.\nSICRCB Casa Blanca', 48, fY + 15, { width: 140, align: 'center' })
      .text('Consejo de Administración\nÓrgano de Control', 236, fY + 15, { width: 140, align: 'center' })
      .text('Control Interno y Auditoría\nDictamen Financiero', 424, fY + 15, { width: 140, align: 'center' });

    dibujarPiePagina(doc);
    doc.end();
  } catch (error) {
    console.error('Error al generar Resumen Ejecutivo:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Error al generar informe ejecutivo' });
  }
});

module.exports = router;