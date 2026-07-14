const PDFDocument = require('pdfkit');

/**
 * Generates a professional invoice PDF as a Buffer.
 * @param {Object} invoice - The invoice document from MongoDB
 * @param {Object} customer - The customer document (optional, may be a walk-in)
 * @returns {Promise<Buffer>} - Resolves with the PDF as a Buffer
 */
const generateInvoicePDF = (invoice, customer) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const primaryColor = '#4F46E5'; // indigo
      const lightGray = '#F8FAFC';
      const textDark = '#1E293B';
      const textMid = '#475569';
      const textLight = '#94A3B8';
      const successGreen = '#16A34A';

      // ─── HEADER BAND ─────────────────────────────────────────────
      doc.rect(0, 0, doc.page.width, 110).fill(primaryColor);

      doc.fillColor('#FFFFFF')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('VASTRA GARMENTS', 40, 28);

      doc.fontSize(9)
        .font('Helvetica')
        .text('GST Invoice / Tax Receipt', 40, 56);

      // Invoice # in top-right
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text(`Invoice No: ${invoice.invoiceNo}`, 0, 28, { align: 'right' });

      const dateStr = invoice.date
        ? new Date(invoice.date).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
          })
        : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      doc.fontSize(9)
        .font('Helvetica')
        .text(`Date: ${dateStr}`, 0, 46, { align: 'right' })
        .text('Vastra Garments, Mumbai, MH', 0, 60, { align: 'right' })
        .text('GSTIN: 27AAAAA1111A1Z1', 0, 72, { align: 'right' });

      // ─── BILLED TO ───────────────────────────────────────────────
      doc.fillColor(textDark).fontSize(9).font('Helvetica-Bold').text('BILLED TO', 40, 130);
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text(invoice.customerName || 'Walk-in Customer', 40, 145);

      if (invoice.customerPhone) {
        doc.fontSize(9).font('Helvetica').fillColor(textMid)
          .text(`Mobile: ${invoice.customerPhone}`, 40, 162);
      }
      if (customer && customer.whatsappNumber) {
        doc.text(`WhatsApp: ${customer.whatsappNumber}`, 40, 174);
      }
      if (customer && customer.email) {
        doc.text(`Email: ${customer.email}`, 40, customer.whatsappNumber ? 186 : 174);
      }

      // Salesperson
      doc.fillColor(textDark).fontSize(9).font('Helvetica-Bold')
        .text('SALESPERSON', 380, 130);
      doc.font('Helvetica').fillColor(textMid)
        .text(invoice.salespersonName || invoice.employeeName || 'Admin', 380, 145);

      // ─── ITEMS TABLE HEADER ───────────────────────────────────────
      const tableTop = 220;
      doc.rect(40, tableTop, doc.page.width - 80, 24).fill(primaryColor);

      const col = { item: 40, qty: 300, price: 370, gst: 440, total: 490 };
      doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
      doc.text('Item Description', col.item + 6, tableTop + 7);
      doc.text('Qty', col.qty, tableTop + 7);
      doc.text('Unit Price', col.price, tableTop + 7);
      doc.text('GST%', col.gst, tableTop + 7);
      doc.text('Total', col.total, tableTop + 7);

      // ─── ITEMS ROWS ───────────────────────────────────────────────
      let y = tableTop + 28;
      doc.font('Helvetica').fillColor(textDark).fontSize(9);

      (invoice.items || []).forEach((item, idx) => {
        if (y > 720) {
          doc.addPage();
          y = 40;
        }
        const rowBg = idx % 2 === 0 ? '#FFFFFF' : lightGray;
        doc.rect(40, y - 4, doc.page.width - 80, 20).fill(rowBg);

        const label = [item.name, item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`]
          .filter(Boolean).join(' | ');

        doc.fillColor(textDark);
        doc.text(label, col.item + 6, y, { width: col.qty - col.item - 12, ellipsis: true });
        doc.text(String(item.quantity), col.qty, y);
        doc.text(`₹${(item.price || 0).toLocaleString('en-IN')}`, col.price, y);
        doc.text(`${item.gstPercent || 0}%`, col.gst, y);
        doc.text(`₹${(item.totalPrice || 0).toLocaleString('en-IN')}`, col.total, y);

        y += 20;
      });

      // ─── DIVIDER ─────────────────────────────────────────────────
      y += 8;
      doc.moveTo(40, y).lineTo(doc.page.width - 40, y).strokeColor('#E2E8F0').lineWidth(1).stroke();
      y += 12;

      // ─── TOTALS SECTION ───────────────────────────────────────────
      const addTotalRow = (label, value, isBold = false, color = textDark) => {
        doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fillColor(isBold ? primaryColor : color)
          .fontSize(isBold ? 11 : 9);
        doc.text(label, 350, y);
        doc.text(value, 0, y, { align: 'right' });
        y += isBold ? 18 : 15;
      };

      addTotalRow('Subtotal:', `₹${(invoice.subTotal || 0).toLocaleString('en-IN')}`);
      if (invoice.discountTotal > 0) {
        addTotalRow('Discount:', `-₹${(invoice.discountTotal || 0).toLocaleString('en-IN')}`, false, '#EF4444');
      }
      if (invoice.gstTotal > 0) {
        addTotalRow('GST (CGST + SGST):', `₹${(invoice.gstTotal || 0).toLocaleString('en-IN')}`);
      }

      // Grand total box
      y += 4;
      doc.rect(340, y - 4, doc.page.width - 380, 28).fill(primaryColor);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(13)
        .text('GRAND TOTAL:', 350, y + 2);
      doc.text(`₹${(invoice.grandTotal || 0).toLocaleString('en-IN')}`, 0, y + 2, { align: 'right' });
      y += 40;

      // Payment method
      doc.fillColor(successGreen).font('Helvetica-Bold').fontSize(9)
        .text(`Payment Method: ${invoice.paymentMethod}`, 40, y);
      doc.fillColor(invoice.status === 'Paid' ? successGreen : '#EF4444')
        .text(`Status: ${invoice.status}`, 200, y);
      y += 20;

      // ─── FOOTER ──────────────────────────────────────────────────
      const footerY = doc.page.height - 60;
      doc.moveTo(40, footerY).lineTo(doc.page.width - 40, footerY).strokeColor('#E2E8F0').lineWidth(1).stroke();
      doc.fillColor(textLight).font('Helvetica').fontSize(8)
        .text('Thank you for shopping with Vastra Garments. All sales are final unless returned within 7 days with original receipt.',
          40, footerY + 8, { align: 'center', width: doc.page.width - 80 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoicePDF };
