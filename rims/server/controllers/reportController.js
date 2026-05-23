const PDFDocument = require('pdfkit');
const ExcelJS     = require('exceljs');
const Invoice     = require('../models/Invoice');
const Receipt     = require('../models/Receipt');

const GREEN  = '#2d7a3a';
const LGREEN = '#f7f9f4';
const TEXT   = '#1a2e1a';
const SUBTEXT= '#7a9b72';

const fmt     = n  => `₦${Number(n || 0).toLocaleString('en-NG')}`;
const fmtDate = d  => d ? new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const cap     = s  => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

// ── PDF utilities ─────────────────────────────────────────────────
function createPDF(res, filename) {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  return doc;
}

function pdfHeader(doc, title, subtitle) {
  doc.font('Helvetica-Bold').fontSize(20).fillColor(TEXT).text(title, { align: 'center' });
  doc.font('Helvetica').fontSize(9).fillColor(SUBTEXT).text(subtitle, { align: 'center' });
  doc.moveDown(1.2);
}

function pdfKPIRow(doc, kpis) {
  const boxW = 160, boxH = 44, gap = 10;
  const totalW = kpis.length * boxW + (kpis.length - 1) * gap;
  let x = (doc.page.width - totalW) / 2;
  const y = doc.y;

  kpis.forEach(({ label, value }) => {
    doc.rect(x, y, boxW, boxH).fill(LGREEN);
    doc.font('Helvetica').fontSize(8).fillColor(SUBTEXT).text(label.toUpperCase(), x + 8, y + 7, { width: boxW - 16 });
    doc.font('Helvetica-Bold').fontSize(13).fillColor(TEXT).text(String(value), x + 8, y + 20, { width: boxW - 16 });
    x += boxW + gap;
  });
  doc.y = y + boxH + 14;
}

function pdfTable(doc, headers, colWidths, rows, alignRight = []) {
  const ROW_H = 21;
  const x0    = 40;
  const TW    = colWidths.reduce((s, w) => s + w, 0);

  // Header bar
  const hy = doc.y;
  doc.rect(x0, hy, TW, ROW_H).fill(GREEN);
  let x = x0;
  headers.forEach((h, i) => {
    const align = alignRight.includes(i) ? 'right' : 'left';
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#fff')
       .text(h.toUpperCase(), x + 4, hy + 7, { width: colWidths[i] - 8, lineBreak: false, align });
    x += colWidths[i];
  });

  // Data rows
  rows.forEach((row, ri) => {
    if (doc.y + ROW_H > doc.page.height - 50) {
      doc.addPage();
      // Repeat header on new page
      const ny = doc.y;
      doc.rect(x0, ny, TW, ROW_H).fill(GREEN);
      x = x0;
      headers.forEach((h, i) => {
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#fff')
           .text(h.toUpperCase(), x + 4, ny + 7, { width: colWidths[i] - 8, lineBreak: false });
        x += colWidths[i];
      });
      doc.y = ny + ROW_H;
    }
    const ry = doc.y;
    if (ri % 2 === 0) doc.rect(x0, ry, TW, ROW_H).fill(LGREEN);
    x = x0;
    row.forEach((cell, i) => {
      const align = alignRight.includes(i) ? 'right' : 'left';
      doc.font('Helvetica').fontSize(8).fillColor(TEXT)
         .text(String(cell ?? '—'), x + 4, ry + 7, { width: colWidths[i] - 8, lineBreak: false, align });
      x += colWidths[i];
    });
    doc.y = ry + ROW_H;
  });
}

// ── Excel utilities ───────────────────────────────────────────────
function createWorkbook(title) {
  const wb = new ExcelJS.Workbook();
  wb.creator  = 'RIMS';
  wb.created  = new Date();
  wb.modified = new Date();
  wb.properties.title = title;
  return wb;
}

function excelHeader(ws, title, subtitle, colCount) {
  ws.mergeCells(1, 1, 1, colCount);
  const t = ws.getCell('A1');
  t.value = title;
  t.font  = { bold: true, size: 16, color: { argb: 'FF2D7A3A' } };
  t.alignment = { horizontal: 'center' };

  ws.mergeCells(2, 1, 2, colCount);
  const s = ws.getCell('A2');
  s.value = subtitle;
  s.font  = { size: 9, color: { argb: 'FF7A9B72' } };
  s.alignment = { horizontal: 'center' };

  ws.addRow([]);
}

function styleHeaderRow(ws, rowNum) {
  const row = ws.getRow(rowNum);
  row.font       = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill       = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D7A3A' } };
  row.alignment  = { horizontal: 'center' };
  row.height     = 18;
}

async function writeExcel(res, wb, filename) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
  res.end();
}

// ── Shared query builder ──────────────────────────────────────────
function buildDateFilter(startDate, endDate) {
  if (!startDate && !endDate) return undefined;
  const f = {};
  if (startDate) f.$gte = new Date(startDate);
  if (endDate)   f.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
  return f;
}

// ── GET /api/reports/invoices ─────────────────────────────────────
const exportInvoices = async (req, res, next) => {
  try {
    const { format = 'excel', status, startDate, endDate, search } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    const dateF = buildDateFilter(startDate, endDate);
    if (dateF) filter.createdAt = dateF;
    if (search) {
      filter.$or = [
        { invoiceNumber:         { $regex: search, $options: 'i' } },
        { 'clientSnapshot.name': { $regex: search, $options: 'i' } },
      ];
    }

    const invoices = await Invoice.find(filter).sort('-createdAt').limit(1000);

    const totalAmount      = invoices.reduce((s, i) => s + i.total, 0);
    const totalOutstanding = invoices.reduce((s, i) => s + i.balance, 0);
    const overdueCount     = invoices.filter(i => i.status === 'overdue').length;
    const paidCount        = invoices.filter(i => i.status === 'paid').length;

    const subtitle = `Generated ${fmtDate(new Date())} · ${invoices.length} invoices`;

    if (format === 'pdf') {
      const doc = createPDF(res, `invoices-report-${Date.now()}.pdf`);
      pdfHeader(doc, 'Invoice Report', subtitle);
      pdfKPIRow(doc, [
        { label: 'Total Invoiced',   value: fmt(totalAmount) },
        { label: 'Outstanding',      value: fmt(totalOutstanding) },
        { label: 'Paid',             value: paidCount },
        { label: 'Overdue',          value: overdueCount },
      ]);
      pdfTable(
        doc,
        ['Invoice #', 'Client', 'Issue Date', 'Due Date', 'Total', 'Balance', 'Status'],
        [95, 170, 75, 75, 90, 90, 65],
        invoices.map(i => [
          i.invoiceNumber,
          i.clientSnapshot?.name,
          fmtDate(i.issueDate),
          fmtDate(i.dueDate),
          fmt(i.total),
          fmt(i.balance),
          cap(i.status),
        ]),
        [4, 5]
      );
      doc.end();

    } else {
      const wb = createWorkbook('Invoice Report');
      const ws = wb.addWorksheet('Invoices');
      excelHeader(ws, 'Invoice Report', subtitle, 7);

      ws.columns = [
        { key: 'invoiceNumber', width: 16 },
        { key: 'client',        width: 30 },
        { key: 'issueDate',     width: 14 },
        { key: 'dueDate',       width: 14 },
        { key: 'total',         width: 18 },
        { key: 'balance',       width: 18 },
        { key: 'status',        width: 12 },
      ];

      ws.addRow(['Invoice #', 'Client', 'Issue Date', 'Due Date', 'Total (₦)', 'Balance (₦)', 'Status']);
      styleHeaderRow(ws, 4);

      invoices.forEach(inv => {
        const row = ws.addRow([
          inv.invoiceNumber,
          inv.clientSnapshot?.name || '—',
          fmtDate(inv.issueDate),
          fmtDate(inv.dueDate),
          inv.total,
          inv.balance,
          cap(inv.status),
        ]);
        const statusCell = row.getCell(7);
        if (inv.status === 'overdue') statusCell.font = { bold: true, color: { argb: 'FFC0392B' } };
        if (inv.status === 'paid')    statusCell.font = { bold: true, color: { argb: 'FF27AE60' } };
        row.getCell(5).numFmt = '₦#,##0.00';
        row.getCell(6).numFmt = '₦#,##0.00';
      });

      // Totals row
      const totRow = ws.addRow(['', 'TOTAL', '', '', totalAmount, totalOutstanding, '']);
      totRow.font = { bold: true };
      totRow.getCell(5).numFmt = '₦#,##0.00';
      totRow.getCell(6).numFmt = '₦#,##0.00';

      await writeExcel(res, wb, `invoices-report-${Date.now()}.xlsx`);
    }
  } catch (err) { next(err); }
};

// ── GET /api/reports/receipts ─────────────────────────────────────
const exportReceipts = async (req, res, next) => {
  try {
    const { format = 'excel', type, category, startDate, endDate } = req.query;

    const filter = {};
    if (type)     filter.type     = type;
    if (category) filter.category = category;
    const dateF = buildDateFilter(startDate, endDate);
    if (dateF) filter.date = dateF;

    const receipts    = await Receipt.find(filter).sort('-date').limit(1000);
    const totalExp    = receipts.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
    const totalIncome = receipts.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    const subtitle    = `Generated ${fmtDate(new Date())} · ${receipts.length} records`;

    if (format === 'pdf') {
      const doc = createPDF(res, `receipts-report-${Date.now()}.pdf`);
      pdfHeader(doc, 'Receipt Report', subtitle);
      pdfKPIRow(doc, [
        { label: 'Total Records',  value: receipts.length },
        { label: 'Total Expenses', value: fmt(totalExp) },
        { label: 'Total Income',   value: fmt(totalIncome) },
        { label: 'Net',            value: fmt(totalIncome - totalExp) },
      ]);
      pdfTable(
        doc,
        ['Receipt #', 'Type', 'Vendor', 'Category', 'Amount', 'Tax', 'Payment Method', 'Date'],
        [80, 55, 120, 90, 80, 60, 90, 85],
        receipts.map(r => [
          r.receiptNumber,
          cap(r.type),
          r.vendorSnapshot?.name || '—',
          r.category.replace(/_/g, ' '),
          fmt(r.amount),
          fmt(r.taxAmount),
          r.paymentMethod.replace(/_/g, ' '),
          fmtDate(r.date),
        ]),
        [4, 5]
      );
      doc.end();

    } else {
      const wb = createWorkbook('Receipt Report');
      const ws = wb.addWorksheet('Receipts');
      excelHeader(ws, 'Receipt Report', subtitle, 8);

      ws.columns = [
        { key: 'receiptNumber',  width: 14 },
        { key: 'type',           width: 10 },
        { key: 'vendor',         width: 26 },
        { key: 'category',       width: 20 },
        { key: 'amount',         width: 16 },
        { key: 'taxAmount',      width: 14 },
        { key: 'paymentMethod',  width: 16 },
        { key: 'date',           width: 14 },
      ];

      ws.addRow(['Receipt #', 'Type', 'Vendor', 'Category', 'Amount (₦)', 'Tax (₦)', 'Payment Method', 'Date']);
      styleHeaderRow(ws, 4);

      receipts.forEach(r => {
        const row = ws.addRow([
          r.receiptNumber,
          cap(r.type),
          r.vendorSnapshot?.name || '—',
          r.category.replace(/_/g, ' '),
          r.amount,
          r.taxAmount,
          r.paymentMethod.replace(/_/g, ' '),
          fmtDate(r.date),
        ]);
        row.getCell(5).numFmt = '₦#,##0.00';
        row.getCell(6).numFmt = '₦#,##0.00';
      });

      const totRow = ws.addRow(['', '', 'TOTAL', '', totalExp, '', '', '']);
      totRow.font = { bold: true };
      totRow.getCell(5).numFmt = '₦#,##0.00';

      await writeExcel(res, wb, `receipts-report-${Date.now()}.xlsx`);
    }
  } catch (err) { next(err); }
};

// ── GET /api/reports/summary ──────────────────────────────────────
const exportSummary = async (req, res, next) => {
  try {
    const { format = 'excel' } = req.query;

    const now        = new Date();
    const yearStart  = new Date(now.getFullYear(), 0, 1);

    const [receivablesAgg, payablesAgg, statusDist, monthlyAgg] = await Promise.all([
      Invoice.aggregate([
        { $match: { status: { $in: ['sent', 'viewed', 'partial', 'overdue'] } } },
        { $group: { _id: null, total: { $sum: '$balance' } } },
      ]),
      Receipt.aggregate([
        { $match: { type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Invoice.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } },
      ]),
      Invoice.aggregate([
        { $match: { createdAt: { $gte: yearStart } } },
        { $group: { _id: { month: { $month: '$createdAt' } }, invoiced: { $sum: '$total' }, count: { $sum: 1 } } },
        { $sort: { '_id.month': 1 } },
      ]),
    ]);

    const MONTHS_FULL = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const totalRec   = receivablesAgg[0]?.total || 0;
    const totalPay   = payablesAgg[0]?.total    || 0;
    const subtitle   = `Financial Summary · ${now.getFullYear()} · Generated ${fmtDate(now)}`;

    if (format === 'pdf') {
      const doc = createPDF(res, `summary-report-${Date.now()}.pdf`);
      pdfHeader(doc, `Financial Summary ${now.getFullYear()}`, subtitle);
      pdfKPIRow(doc, [
        { label: 'Total Receivables', value: fmt(totalRec) },
        { label: 'Total Expenses',    value: fmt(totalPay) },
        { label: 'Net Position',      value: fmt(totalRec - totalPay) },
        { label: 'Report Year',       value: now.getFullYear() },
      ]);

      doc.moveDown(0.5).font('Helvetica-Bold').fontSize(11).fillColor(TEXT).text('Invoice Status Breakdown');
      doc.moveDown(0.3);
      pdfTable(doc, ['Status', 'Count', 'Total Invoiced'], [200, 150, 150],
        statusDist.map(s => [cap(s._id), s.count, fmt(s.total)]), [1, 2]);

      doc.moveDown(1).font('Helvetica-Bold').fontSize(11).fillColor(TEXT).text('Monthly Invoiced');
      doc.moveDown(0.3);
      pdfTable(doc, ['Month', 'Invoices Created', 'Total Invoiced'], [200, 150, 150],
        monthlyAgg.map(m => [MONTHS_FULL[m._id.month - 1], m.count, fmt(m.invoiced)]), [1, 2]);
      doc.end();

    } else {
      const wb = createWorkbook('Financial Summary');
      const ws = wb.addWorksheet('Summary');
      excelHeader(ws, `Financial Summary ${now.getFullYear()}`, subtitle, 3);

      ws.addRow(['KPI', 'Value']);
      styleHeaderRow(ws, 4);
      ws.columns = [{ key: 'kpi', width: 28 }, { key: 'value', width: 20 }, { key: 'extra', width: 20 }];
      ws.addRow({ kpi: 'Total Receivables', value: totalRec }).getCell(2).numFmt = '₦#,##0.00';
      ws.addRow({ kpi: 'Total Expenses',    value: totalPay }).getCell(2).numFmt = '₦#,##0.00';
      ws.addRow({ kpi: 'Net Position',      value: totalRec - totalPay }).getCell(2).numFmt = '₦#,##0.00';
      ws.addRow([]);

      ws.addRow(['Invoice Status Breakdown', '', '']);
      ws.addRow(['Status', 'Count', 'Total (₦)']);
      styleHeaderRow(ws, ws.lastRow.number);
      statusDist.forEach(s => {
        const row = ws.addRow([cap(s._id), s.count, s.total]);
        row.getCell(3).numFmt = '₦#,##0.00';
      });
      ws.addRow([]);

      ws.addRow(['Monthly Invoiced', '', '']);
      ws.addRow(['Month', 'Invoices Created', 'Total (₦)']);
      styleHeaderRow(ws, ws.lastRow.number);
      monthlyAgg.forEach(m => {
        const row = ws.addRow([MONTHS_FULL[m._id.month - 1], m.count, m.invoiced]);
        row.getCell(3).numFmt = '₦#,##0.00';
      });

      await writeExcel(res, wb, `summary-report-${Date.now()}.xlsx`);
    }
  } catch (err) { next(err); }
};

// ── GET /api/reports/aging ────────────────────────────────────────
const exportAging = async (req, res, next) => {
  try {
    const { format = 'excel' } = req.query;

    const now = new Date();
    const outstanding = await Invoice.find({
      status: { $in: ['sent', 'viewed', 'partial', 'overdue'] },
    }).sort('dueDate');

    const buckets = { '0–30d': [], '31–60d': [], '61–90d': [], '90+d': [] };
    outstanding.forEach(inv => {
      const days = Math.floor((now - inv.dueDate) / 86_400_000);
      if      (days <= 0)  buckets['0–30d'].push(inv);
      else if (days <= 30) buckets['0–30d'].push(inv);
      else if (days <= 60) buckets['31–60d'].push(inv);
      else if (days <= 90) buckets['61–90d'].push(inv);
      else                 buckets['90+d'].push(inv);
    });

    const totalOutstanding = outstanding.reduce((s, i) => s + i.balance, 0);
    const subtitle = `Aging Report · Generated ${fmtDate(now)} · ${outstanding.length} outstanding invoices`;

    if (format === 'pdf') {
      const doc = createPDF(res, `aging-report-${Date.now()}.pdf`);
      pdfHeader(doc, 'Accounts Receivable Aging Report', subtitle);
      pdfKPIRow(doc, Object.entries(buckets).map(([range, items]) => ({
        label: range,
        value: fmt(items.reduce((s, i) => s + i.balance, 0)),
      })));

      for (const [range, items] of Object.entries(buckets)) {
        if (!items.length) continue;
        doc.moveDown(0.6).font('Helvetica-Bold').fontSize(10).fillColor(TEXT).text(`${range} — ${items.length} invoice(s)`);
        doc.moveDown(0.2);
        pdfTable(doc, ['Invoice #', 'Client', 'Due Date', 'Total', 'Balance', 'Days Out'],
          [90, 200, 80, 90, 90, 60],
          items.map(i => {
            const days = Math.max(0, Math.floor((now - i.dueDate) / 86_400_000));
            return [i.invoiceNumber, i.clientSnapshot?.name, fmtDate(i.dueDate), fmt(i.total), fmt(i.balance), days];
          }), [3, 4, 5]);
      }
      doc.end();

    } else {
      const wb = createWorkbook('Aging Report');
      const ws = wb.addWorksheet('Aging');
      excelHeader(ws, 'Accounts Receivable Aging Report', subtitle, 6);

      ws.columns = [
        { key: 'bucket',  width: 10 }, { key: 'invoice', width: 16 },
        { key: 'client',  width: 28 }, { key: 'dueDate', width: 14 },
        { key: 'total',   width: 18 }, { key: 'balance', width: 18 },
      ];

      ws.addRow(['Bucket', 'Invoice #', 'Client', 'Due Date', 'Total (₦)', 'Balance (₦)']);
      styleHeaderRow(ws, 4);

      for (const [range, items] of Object.entries(buckets)) {
        items.forEach(inv => {
          const row = ws.addRow([range, inv.invoiceNumber, inv.clientSnapshot?.name || '—', fmtDate(inv.dueDate), inv.total, inv.balance]);
          row.getCell(5).numFmt = '₦#,##0.00';
          row.getCell(6).numFmt = '₦#,##0.00';
        });
      }

      const totRow = ws.addRow(['TOTAL', '', '', '', totalOutstanding, totalOutstanding]);
      totRow.font = { bold: true };
      totRow.getCell(5).numFmt = '₦#,##0.00';
      totRow.getCell(6).numFmt = '₦#,##0.00';

      await writeExcel(res, wb, `aging-report-${Date.now()}.xlsx`);
    }
  } catch (err) { next(err); }
};

module.exports = { exportInvoices, exportReceipts, exportSummary, exportAging };
