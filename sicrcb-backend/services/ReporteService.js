// sicrcb-backend/services/ReporteService.js
const pool = require('../database/db');
const PDFDocument = require('pdfkit');

// Helpers de formato y diseño
const formatCOP = (valor) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(valor || 0);
};

const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
    });
};

const formatFechaHora = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

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

    const bannerY = doc.y;
    doc.rect(36, bannerY, 540, 26).fill('#1B365D');
    doc.fillColor('#FFFFFF')
       .fontSize(10.5)
       .font('Helvetica-Bold')
       .text(tituloReporte.toUpperCase(), 42, bannerY + 7, { align: 'center', width: 528 });

    doc.y = bannerY + 36;
};

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

class ReporteService {
    // 1. Reporte de Multas (Admin)
    static async generarMultasPdf(res) {
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

        let montoTotal = 0;
        let montoRecaudado = 0;
        let totalPagadas = 0;
        let totalPendientes = 0;

        multas.forEach(m => {
            const v = Number(m.monto || 0);
            montoTotal += v;
            if (['Pagada', 'Pagado', 'Resuelta'].includes(m.estado)) {
                montoRecaudado += v;
                totalPagadas++;
            } else {
                totalPendientes++;
            }
        });

        const porcentajeRecaudo = montoTotal > 0 ? Math.round((montoRecaudado / montoTotal) * 100) : 0;
        const montoPendiente = montoTotal - montoRecaudado;

        const doc = new PDFDocument({ size: 'LETTER', margins: { top: 36, bottom: 40, left: 36, right: 36 } });
        doc.pipe(res);

        dibujarEncabezado(doc, 'Informe Consolidado de Sanciones, Cartera y Recaudo');

        // KPIs
        const kpiY = doc.y;
        const kpiWidth = 126;
        const kpiHeight = 44;
        const gap = 12;

        const kpis = [
            { label: 'TOTAL SANCIONES', val: `${multas.length}`, sub: `${totalPagadas} Pagadas / ${totalPendientes} Pend.` },
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

            const esPagada = ['Pagada', 'Pagado', 'Resuelta'].includes(m.estado);
            doc.rect(495, tableY + 2.5, 65, 11).fill(esPagada ? '#C6F6D5' : '#FED7D7');
            doc.fontSize(6.5).font('Helvetica-Bold').fillColor(esPagada ? '#22543D' : '#742A2A')
               .text(m.estado || 'Pendiente', 495, tableY + 4, { width: 65, align: 'center' });

            tableY += 16;
        });

        // Fila Total
        doc.rect(36, tableY, 540, 18).fillAndStroke('#EDF2F7', '#CBD5E0');
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1A202C')
           .text('TOTAL CONSOLIDADO', 80, tableY + 5)
           .text(formatCOP(montoTotal), 385, tableY + 5, { width: 85, align: 'right' })
           .text(`${porcentajeRecaudo}% Cobrado`, 485, tableY + 5, { width: 85, align: 'center' });

        doc.y = tableY + 24;
        dibujarPiePagina(doc);
        doc.end();
    }

    // 2. Paz y Salvo Oficial (Residente)
    static async generarPazYSalvoPdf(idUsuario, res) {
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
            const err = new Error('No se encontraron datos residenciales activos asociados a este usuario.');
            err.statusCode = 404;
            throw err;
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

        const doc = new PDFDocument({ size: 'LETTER', margins: { top: 40, bottom: 40, left: 45, right: 45 } });
        doc.pipe(res);

        dibujarEncabezado(doc, 'Certificación Oficial de Estado de Cuenta y Paz y Salvo');

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

        doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1B365D').text('Certificación Institucional');
        doc.moveDown(0.3);

        const textoCert = estaPazYSalvo
            ? `La Administración del CONJUNTO RESIDENCIAL CASA BLANCA P.H. (NIT 900.876.543-1), constituida formalmente bajo la Ley 675 de 2001 de Colombia, HACE CONSTAR que el Apartamento ${residente.numero_apartamento} (Torre ${residente.bloque}, Interior ${residente.numero_interior}), registrado a nombre de ${nombreCompleto}, identificado con ${residente.tipo_doc} N° ${residente.numero_documento}, se encuentra a la fecha y hora de emisión A PAZ Y SALVO por concepto de expensas necesarias y multas de convivencia.\n\nSe expide el presente documento para los trámites que el titular estime pertinentes (notaría, entidades bancarias, arriendo o mudanza).`
            : `La Administración del CONJUNTO RESIDENCIAL CASA BLANCA P.H. deja constancia de que el Apartamento ${residente.numero_apartamento} presenta obligaciones pendientes por ${formatCOP(saldoPendiente)}. Para obtener el Paz y Salvo oficial se requiere la acreditación del pago respectivo.`;

        doc.fontSize(8).font('Helvetica').fillColor('#2D3748').text(textoCert, { align: 'justify', lineGap: 3 });

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
    }

    // 3. Reporte de Alquileres (Admin)
    static async generarAlquileresPdf(res) {
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

            return { ...a, horas, totalAlquiler };
        });

        const doc = new PDFDocument({ size: 'LETTER', margins: { top: 36, bottom: 40, left: 36, right: 36 } });
        doc.pipe(res);

        dibujarEncabezado(doc, 'Informe General de Alquileres de Áreas Comunes y Mobiliario');

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

        doc.rect(36, tableY, 540, 18).fillAndStroke('#EDF2F7', '#CBD5E0');
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1A202C')
           .text('TOTAL RECAUDADO (CONFIRMADOS)', 75, tableY + 5)
           .text(formatCOP(totalRecaudado), 440, tableY + 5, { width: 60, align: 'right' });

        doc.y = tableY + 24;
        dibujarPiePagina(doc);
        doc.end();
    }

    // 4. Comprobante de Reserva (Residente / Admin)
    static async generarComprobanteReservaPdf(idReserva, idUsuario, esAdmin, res) {
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
        `, [idReserva]);

        if (rows.length === 0) {
            const err = new Error('Reserva no encontrada');
            err.statusCode = 404;
            throw err;
        }

        const reserva = rows[0];
        if (!esAdmin && reserva.id_usuario !== idUsuario) {
            const err = new Error('No tienes autorización para consultar este comprobante');
            err.statusCode = 403;
            throw err;
        }

        const nombreCompleto = `${reserva.primer_nombre} ${reserva.segundo_nombre || ''} ${reserva.primer_apellido} ${reserva.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim();
        const ini = new Date(reserva.hora_inicio);
        const fin = new Date(reserva.hora_fin);
        const horas = Math.max(1, Math.ceil((fin - ini) / (1000 * 60 * 60)));
        const totalLiquidado = horas * Number(reserva.valor_hora || 0);

        const doc = new PDFDocument({ size: 'LETTER', margins: { top: 40, bottom: 40, left: 45, right: 45 } });
        doc.pipe(res);

        dibujarEncabezado(doc, 'Acta y Comprobante Oficial de Reserva de Áreas Comunes');

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

        const textoReglas = `1. El copropietario solicitante se hace responsable por el cuidado, aseo y conservación de las instalaciones y mobiliario entregado.
2. El nivel de decibeles y música debe moderarse conforme al Código Nacional de Policía y Manual Interno de Convivencia (límite 10:00 p.m.).
3. El salón comunal y las sillas deberán ser entregados en idénticas condiciones a las recibidas a primera hora del día siguiente.
4. Cualquier daño o faltante en el inventario será facturado directamente en la siguiente cuenta de cobro del inmueble.`;

        doc.fontSize(7.5).font('Helvetica').fillColor('#4A5568').text(textoReglas, { lineGap: 3.5 });

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
    }

    // 5. Informe de Gestión de PQRS (Admin)
    static async generarPqrsPdf(res) {
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

        const doc = new PDFDocument({ size: 'LETTER', margins: { top: 36, bottom: 40, left: 36, right: 36 } });
        doc.pipe(res);

        dibujarEncabezado(doc, 'Informe Estadístico de Atención y Solución de PQRS');

        const kpiY = doc.y;
        const kpiWidth = 126;
        const kpiHeight = 44;
        const gap = 12;

        const kpis = [
            { label: 'TOTAL RADICADOS', val: `${totalPQRS}`, sub: 'PQRS globales' },
            { label: 'RESUELTAS', val: `${resueltas}`, sub: `${porcentajeResolucion}% de efectividad` },
            { label: 'EN TRÁMITE', val: `${enProceso}`, sub: 'Gestión en curso' },
            { label: 'PENDIENTES', val: `${pendientes}`, sub: 'Requieren atención' }
        ];

        kpis.forEach((kpi, idx) => {
            const x = 36 + idx * (kpiWidth + gap);
            doc.rect(x, kpiY, kpiWidth, kpiHeight).fillAndStroke('#F7FAFC', '#E2E8F0');
            doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#718096').text(kpi.label, x + 6, kpiY + 6, { width: kpiWidth - 12, align: 'center' });
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#1B365D').text(kpi.val, x + 6, kpiY + 18, { width: kpiWidth - 12, align: 'center' });
            doc.fontSize(6).font('Helvetica').fillColor('#2E7D32').text(kpi.sub, x + 6, kpiY + 32, { width: kpiWidth - 12, align: 'center' });
        });

        doc.y = kpiY + kpiHeight + 14;

        doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1B365D').text('Listado Detallado de Solicitudes y Reclamaciones');
        doc.moveDown(0.4);

        let tableY = doc.y;
        doc.rect(36, tableY, 540, 18).fill('#1B365D');
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#FFFFFF');
        doc.text('Rad.', 42, tableY + 5, { width: 35 });
        doc.text('Tipo', 80, tableY + 5, { width: 80 });
        doc.text('Inmueble / Solicitante', 165, tableY + 5, { width: 145 });
        doc.text('Fecha Radicación', 315, tableY + 5, { width: 110 });
        doc.text('Estado Actual', 435, tableY + 5, { width: 135, align: 'center' });

        tableY += 18;

        pqrs.forEach((p, i) => {
            if (tableY > 700) {
                doc.addPage();
                tableY = 40;
                doc.rect(36, tableY, 540, 18).fill('#1B365D');
                doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#FFFFFF');
                doc.text('Rad.', 42, tableY + 5, { width: 35 });
                doc.text('Tipo', 80, tableY + 5, { width: 80 });
                doc.text('Inmueble / Solicitante', 165, tableY + 5, { width: 145 });
                doc.text('Fecha Radicación', 315, tableY + 5, { width: 110 });
                doc.text('Estado Actual', 435, tableY + 5, { width: 135, align: 'center' });
                tableY += 18;
            }

            const rowBg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
            doc.rect(36, tableY, 540, 16).fillAndStroke(rowBg, '#EDF2F7');

            doc.fontSize(7).font('Helvetica').fillColor('#2D3748');
            doc.text(`#${p.id}`, 42, tableY + 4, { width: 35 });
            doc.text(p.tipo || 'PQR', 80, tableY + 4, { width: 80 });
            doc.text(`Apto ${p.apartamento || 'S/A'} - ${p.primer_nombre} ${p.primer_apellido}`, 165, tableY + 4, { width: 145, lineBreak: false, ellipsis: true });
            doc.text(formatFechaHora(p.fecha_creacion), 315, tableY + 4, { width: 110 });

            let badgeBg = '#FED7D7';
            let badgeColor = '#742A2A';
            const est = (p.estado || '').toLowerCase();
            if (est === 'resuelta' || est === 'cerrada') {
                badgeBg = '#C6F6D5';
                badgeColor = '#22543D';
            } else if (est === 'en proceso') {
                badgeBg = '#FEFCBF';
                badgeColor = '#744210';
            }

            doc.rect(470, tableY + 2.5, 65, 11).fill(badgeBg);
            doc.fontSize(6.5).font('Helvetica-Bold').fillColor(badgeColor)
               .text(p.estado || 'Pendiente', 470, tableY + 4, { width: 65, align: 'center' });

            tableY += 16;
        });

        doc.y = tableY + 24;
        dibujarPiePagina(doc);
        doc.end();
    }

    // 6. Censo General de Inmuebles (Admin)
    static async generarCensoApartamentosPdf(res) {
        const [apartamentos] = await pool.query(`
            SELECT a.id, a.numero, a.estado,
                   b.nombre AS bloque, i.numero AS interior,
                   ud.primer_nombre, ud.primer_apellido, ud.numero_documento, td.sigla AS tipo_doc
            FROM apartamento a
            JOIN interior i ON a.id_interior = i.id
            JOIN bloque b ON i.id_bloque = b.id
            LEFT JOIN (
                SELECT pga.id_apartamento, pga.id_propietario
                FROM propietario_gestion_apartamento pga
                WHERE pga.estado = 'Activo'
            ) latest_pga ON latest_pga.id_apartamento = a.id
            LEFT JOIN propietario p ON latest_pga.id_propietario = p.id
            LEFT JOIN user_data ud ON p.id_user_data = ud.id
            LEFT JOIN tipo_documento td ON ud.id_tipo_documento = td.id
            ORDER BY b.nombre, i.numero, a.numero
        `);

        const doc = new PDFDocument({ size: 'LETTER', margins: { top: 36, bottom: 40, left: 36, right: 36 } });
        doc.pipe(res);

        dibujarEncabezado(doc, 'Directorio General y Censo de Inmuebles Residenciales');

        let tableY = doc.y;
        doc.rect(36, tableY, 540, 18).fill('#1B365D');
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#FFFFFF');
        doc.text('Torre', 42, tableY + 5, { width: 50 });
        doc.text('Interior', 95, tableY + 5, { width: 50 });
        doc.text('Apartamento', 150, tableY + 5, { width: 75 });
        doc.text('Propietario Registrado', 230, tableY + 5, { width: 175 });
        doc.text('Documento', 410, tableY + 5, { width: 90 });
        doc.text('Estado', 505, tableY + 5, { width: 65, align: 'center' });

        tableY += 18;

        apartamentos.forEach((ap, i) => {
            if (tableY > 700) {
                doc.addPage();
                tableY = 40;
                doc.rect(36, tableY, 540, 18).fill('#1B365D');
                doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#FFFFFF');
                doc.text('Torre', 42, tableY + 5, { width: 50 });
                doc.text('Interior', 95, tableY + 5, { width: 50 });
                doc.text('Apartamento', 150, tableY + 5, { width: 75 });
                doc.text('Propietario Registrado', 230, tableY + 5, { width: 175 });
                doc.text('Documento', 410, tableY + 5, { width: 90 });
                doc.text('Estado', 505, tableY + 5, { width: 65, align: 'center' });
                tableY += 18;
            }

            const rowBg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
            doc.rect(36, tableY, 540, 16).fillAndStroke(rowBg, '#EDF2F7');

            doc.fontSize(7).font('Helvetica').fillColor('#2D3748');
            doc.text(`Torre ${ap.bloque}`, 42, tableY + 4, { width: 50 });
            doc.text(`Int ${ap.interior}`, 95, tableY + 4, { width: 50 });
            doc.font('Helvetica-Bold').text(`Apto ${ap.numero}`, 150, tableY + 4, { width: 75 }).font('Helvetica');
            doc.text(ap.primer_nombre ? `${ap.primer_nombre} ${ap.primer_apellido}` : 'Sin propietario asignado', 230, tableY + 4, { width: 175 });
            doc.text(ap.numero_documento ? `${ap.tipo_doc} ${ap.numero_documento}` : 'N/A', 410, tableY + 4, { width: 90 });
            doc.text(ap.estado || 'Activo', 505, tableY + 4, { width: 65, align: 'center' });

            tableY += 16;
        });

        doc.y = tableY + 24;
        dibujarPiePagina(doc);
        doc.end();
    }
}

module.exports = ReporteService;