const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

class PDFService {
  /**
   * Helper to format numbers as Indian currency / decimal
   */
  static formatCurrency(amount) {
    const num = Number(amount) || 0;
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /**
   * Helper to generate a QR Code Buffer from a URL/payload
   */
  static async getQRCodeBuffer(content, width = 60) {
    try {
      const dataUrl = await QRCode.toDataURL(content, {
        width,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      });
      return Buffer.from(dataUrl.split(',')[1], 'base64');
    } catch (err) {
      console.error('Error generating QR code in PDFService:', err);
      return null;
    }
  }

  /**
   * 1. SINGLE-PAGE INVOICE PDF GENERATOR
   * Produces an exact single-page ERP Tax Invoice matching the approved print template.
   */
  static async generateInvoicePDFBuffer(trackData, baseUrl = '') {
    return new Promise(async (resolve, reject) => {
      try {
        const store = trackData?.store || {};
        const bill = trackData?.bill || {};
        const items = trackData?.items || [];
        const alterations = trackData?.alterations || [];
        const pssm = trackData?.pssm || null;

        // Create standard A4 document with 18pt margins (595.28 x 841.89 points)
        const doc = new PDFDocument({
          size: 'A4',
          margin: 18,
          info: {
            Title: `Tax Invoice - ${bill.billNo || 'NFS'}`,
            Author: store.name || 'NEW FASHION STYLE',
            Subject: 'Retail Tax Invoice',
            Keywords: 'Invoice, Retail, ERP, NFS'
          }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', err => reject(err));

        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const leftMargin = 18;
        const rightMargin = 18;
        const contentWidth = pageWidth - leftMargin - rightMargin; // 559.28 pt

        let y = 18;

        // ─── 1. TOP BRANDING HEADER ───
        doc.rect(leftMargin, y, contentWidth, 54).strokeColor('#000000').lineWidth(1.2).stroke();
        
        // Brand Name
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#000000')
          .text(store.name || 'NEW FASHION STYLE - NFS', leftMargin + 8, y + 5, { width: contentWidth - 16, align: 'center' });
        
        // Subtitle & Address
        doc.font('Helvetica').fontSize(7.5).fillColor('#222222')
          .text('Complete Family Garments, Suitings, Shirting & Custom Tailoring Studio', leftMargin + 8, y + 21, { width: contentWidth - 16, align: 'center' })
          .text(store.address || 'Ram Chowk, Sadh Nagar, Palam, New Delhi - 110045 | Ph: 9990397529, 9990397530', leftMargin + 8, y + 31, { width: contentWidth - 16, align: 'center' });

        // Tax Invoice banner line
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000000')
          .text(`GSTIN: ${store.gstin || '07AAAPL1234A1Z5'}   |   RETAIL TAX INVOICE`, leftMargin + 8, y + 42, { width: contentWidth - 16, align: 'center' });

        y += 58;

        // ─── 2. INVOICE & CUSTOMER INFO GRID (2-Column Box) ───
        const metaBoxHeight = 44;
        doc.rect(leftMargin, y, contentWidth, metaBoxHeight).strokeColor('#000000').lineWidth(0.8).stroke();
        doc.moveTo(leftMargin + contentWidth / 2, y).lineTo(leftMargin + contentWidth / 2, y + metaBoxHeight).stroke();

        const formattedDate = bill.date ? new Date(bill.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A';

        // Left Column: Customer Info
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000')
          .text('CUSTOMER DETAILS:', leftMargin + 6, y + 5)
          .font('Helvetica-Bold').fontSize(9).fillColor('#000000')
          .text(bill.customerName || 'Walk-in Customer', leftMargin + 6, y + 16);
        doc.font('Helvetica').fontSize(7.5).fillColor('#333333')
          .text(`Mobile: +91 ${bill.customerPhone || 'N/A'}    |    Cust ID: ${bill.customerCode || 'CUST-WALK'}`, leftMargin + 6, y + 29);

        // Right Column: Invoice & Payment Info
        const rightColX = leftMargin + (contentWidth / 2) + 6;
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000')
          .text('INVOICE DETAILS:', rightColX, y + 5)
          .font('Helvetica-Bold').fontSize(9).fillColor('#000000')
          .text(`Invoice No: ${bill.billNo || 'N/A'}`, rightColX, y + 16);
        doc.font('Helvetica').fontSize(7.5).fillColor('#333333')
          .text(`Date: ${formattedDate}    |    Mode: ${bill.paymentMethod || 'Cash'}`, rightColX, y + 29);

        y += metaBoxHeight + 5;

        // ─── 3. PURCHASED ITEMS TABLE (COMPLETE ORIGINAL INVOICE) ───
        // Calculate dynamic row height so all items fit cleanly on the single page
        const maxTableHeight = 220;
        const itemCount = Math.max(1, items.length);
        const headerHeight = 16;
        const rowHeight = Math.max(13, Math.min(18, (maxTableHeight - headerHeight) / itemCount));

        const colX = {
          sno: leftMargin,
          desc: leftMargin + 25,
          code: leftMargin + 245,
          qty: leftMargin + 355,
          rate: leftMargin + 395,
          disc: leftMargin + 465,
          amt: leftMargin + 505
        };

        // Table Header
        doc.rect(leftMargin, y, contentWidth, headerHeight).fillColor('#f1f5f9').fill();
        doc.rect(leftMargin, y, contentWidth, headerHeight).strokeColor('#000000').lineWidth(0.8).stroke();

        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000');
        doc.text('S.N.', colX.sno + 3, y + 4);
        doc.text('Item Description / Garment Details', colX.desc + 3, y + 4);
        doc.text('HSN / Barcode / Code', colX.code + 3, y + 4);
        doc.text('Qty', colX.qty + 3, y + 4, { width: 35, align: 'center' });
        doc.text('Rate (Rs)', colX.rate + 3, y + 4, { width: 60, align: 'right' });
        doc.text('Disc', colX.disc + 3, y + 4, { width: 35, align: 'right' });
        doc.text('Amount (Rs)', colX.amt + 3, y + 4, { width: 48, align: 'right' });

        y += headerHeight;

        // Table Rows
        items.forEach((it, idx) => {
          const rowY = y + (idx * rowHeight);
          if (idx % 2 === 1) {
            doc.rect(leftMargin, rowY, contentWidth, rowHeight).fillColor('#fafafa').fill();
          }
          doc.rect(leftMargin, rowY, contentWidth, rowHeight).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

          const hasAlt = it.hasAlteration || it.alterationStatus || (alterations && alterations.some(a => a.barcode === it.code || a.garmentName === it.name));

          doc.font('Helvetica').fontSize(7).fillColor('#000000');
          doc.text(`${idx + 1}`, colX.sno + 3, rowY + 3);
          
          // Item description with alteration indicator if applicable
          const itemTitle = it.name || it.itemName || 'Garment Item';
          const altTag = hasAlt ? ' [ALT]' : '';
          doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000');
          doc.text(`${itemTitle.substring(0, 38)}${altTag}`, colX.desc + 3, rowY + 3);

          doc.font('Helvetica').fontSize(6.5).fillColor('#444444');
          doc.text(it.code || it.barcode || 'N/A', colX.code + 3, rowY + 3);
          doc.text(`${it.qty || it.quantity || 1}`, colX.qty + 3, rowY + 3, { width: 35, align: 'center' });
          doc.text(`${this.formatCurrency(it.price || it.mrp || 0)}`, colX.rate + 3, rowY + 3, { width: 60, align: 'right' });
          doc.text(`${Number(it.discountAmount || 0) > 0 ? this.formatCurrency(it.discountAmount) : '-'}`, colX.disc + 3, rowY + 3, { width: 35, align: 'right' });
          
          doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000');
          doc.text(`${this.formatCurrency(it.amount || it.finalPrice || (Number(it.price || 0) * Number(it.qty || 1)))}`, colX.amt + 3, rowY + 3, { width: 48, align: 'right' });
        });

        // Bottom border of table
        y += (itemCount * rowHeight);
        doc.moveTo(leftMargin, y).lineTo(leftMargin + contentWidth, y).strokeColor('#000000').lineWidth(0.8).stroke();
        y += 4;

        // ─── 4. FINANCIAL TOTALS & TAX BREAKDOWN ───
        const summaryY = y;
        const leftBoxWidth = 320;
        const rightBoxWidth = contentWidth - leftBoxWidth - 8;
        const rightBoxX = leftMargin + leftBoxWidth + 8;

        // Left Side: GST Tax Breakdown Table & Loyalty
        doc.rect(leftMargin, summaryY, leftBoxWidth, 76).strokeColor('#000000').lineWidth(0.6).stroke();
        doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000')
          .text('TAX BREAKDOWN & GST DETAILS', leftMargin + 5, summaryY + 4);

        // Tax Table Header
        doc.rect(leftMargin + 4, summaryY + 14, leftBoxWidth - 8, 12).fillColor('#f8fafc').fill();
        doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#000000');
        doc.text('Tax Rate', leftMargin + 8, summaryY + 17);
        doc.text('Taxable Amount', leftMargin + 65, summaryY + 17, { width: 60, align: 'right' });
        doc.text('CGST (Rs)', leftMargin + 130, summaryY + 17, { width: 55, align: 'right' });
        doc.text('SGST (Rs)', leftMargin + 190, summaryY + 17, { width: 55, align: 'right' });
        doc.text('Total Tax', leftMargin + 250, summaryY + 17, { width: 55, align: 'right' });

        const taxableAmt = Number(bill.taxableAmount || (bill.grandTotal - (bill.totalTax || 0)));
        const halfTax = (Number(bill.totalTax || 0) / 2);
        
        doc.font('Helvetica').fontSize(6.5).fillColor('#222222');
        doc.text('GST (Standard)', leftMargin + 8, summaryY + 29);
        doc.text(this.formatCurrency(taxableAmt), leftMargin + 65, summaryY + 29, { width: 60, align: 'right' });
        doc.text(this.formatCurrency(halfTax), leftMargin + 130, summaryY + 29, { width: 55, align: 'right' });
        doc.text(this.formatCurrency(halfTax), leftMargin + 190, summaryY + 29, { width: 55, align: 'right' });
        doc.text(this.formatCurrency(bill.totalTax || 0), leftMargin + 250, summaryY + 29, { width: 55, align: 'right' });

        // Loyalty Points Summary Box
        doc.rect(leftMargin + 4, summaryY + 42, leftBoxWidth - 8, 28).fillColor('#ffffff').strokeColor('#cbd5e1').lineWidth(0.5).stroke();
        doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#000000')
          .text('CUSTOMER REWARD LOYALTY POINTS SUMMARY', leftMargin + 8, summaryY + 45);
        doc.font('Helvetica').fontSize(6.5).fillColor('#333333');
        doc.text(`Previous: 0  |  Earned: ${Math.floor(bill.grandTotal / 20) || 0}  |  Redeemed: 0  |  Balance: ${bill.loyaltyPoints || Math.floor(bill.grandTotal / 20) || 0} pts`, leftMargin + 8, summaryY + 56);

        // Right Side: Grand Total & Amount Paid Box
        doc.rect(rightBoxX, summaryY, rightBoxWidth, 76).strokeColor('#000000').lineWidth(0.8).stroke();
        
        const fY = summaryY + 5;
        doc.font('Helvetica').fontSize(7.5).fillColor('#333333');
        doc.text('Subtotal (Taxable):', rightBoxX + 6, fY);
        doc.text(`Rs ${this.formatCurrency(taxableAmt)}`, rightBoxX + 6, fY, { width: rightBoxWidth - 12, align: 'right' });

        doc.text('Total GST Tax:', rightBoxX + 6, fY + 12);
        doc.text(`Rs ${this.formatCurrency(bill.totalTax || 0)}`, rightBoxX + 6, fY + 12, { width: rightBoxWidth - 12, align: 'right' });

        doc.rect(rightBoxX + 4, fY + 23, rightBoxWidth - 8, 16).fillColor('#0f172a').fill();
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
        doc.text('GRAND TOTAL:', rightBoxX + 8, fY + 27);
        doc.text(`Rs ${this.formatCurrency(bill.grandTotal || 0)}`, rightBoxX + 8, fY + 27, { width: rightBoxWidth - 16, align: 'right' });

        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#059669');
        doc.text('Amount Paid:', rightBoxX + 6, fY + 43);
        doc.text(`Rs ${this.formatCurrency(bill.amountPaid || bill.grandTotal || 0)}`, rightBoxX + 6, fY + 43, { width: rightBoxWidth - 12, align: 'right' });

        const balanceDue = Number(bill.balanceDue || 0);
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(balanceDue > 0 ? '#dc2626' : '#475569');
        doc.text('Balance Due:', rightBoxX + 6, fY + 55);
        doc.text(`Rs ${this.formatCurrency(balanceDue)}`, rightBoxX + 6, fY + 55, { width: rightBoxWidth - 12, align: 'right' });

        y = summaryY + 81;

        // ─── 5. CONDITIONAL OUTSTANDING DUE ALERT ───
        if (balanceDue > 0) {
          doc.rect(leftMargin, y, contentWidth, 18).fillColor('#fef2f2').strokeColor('#dc2626').lineWidth(1).stroke();
          doc.font('Helvetica-Bold').fontSize(8).fillColor('#dc2626')
            .text(`*** OUTSTANDING CREDIT / BALANCE DUE: Rs ${this.formatCurrency(balanceDue)} (Payment Pending) ***`, leftMargin + 6, y + 5, { width: contentWidth - 12, align: 'center' });
          y += 22;
        }

        // ─── 6. ALTERATION & TRIAL FACILITY DETAILS BOX ───
        const altBoxHeight = (alterations && alterations.length > 0) ? 36 : 22;
        doc.rect(leftMargin, y, contentWidth, altBoxHeight).strokeColor('#000000').lineWidth(0.6).stroke();
        
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000')
          .text(`ALTERATION & CUSTOM STITCHING DETAILS ${pssm?.pssmNo ? `(PSSM Slip: ${pssm.pssmNo})` : ''}`, leftMargin + 6, y + 4);

        if (alterations && alterations.length > 0) {
          const altText = alterations.map((a, i) => `${i + 1}. ${a.garmentName || 'Garment'} [Status: ${a.status || 'BOOKED'}] (Trial: ${a.trialRequired ? 'YES' : 'NO'})`).join('  |  ');
          doc.font('Helvetica').fontSize(6.5).fillColor('#333333')
            .text(altText, leftMargin + 6, y + 14, { width: contentWidth - 12 })
            .text(`Expected Delivery: ${pssm?.expectedDeliveryDate ? new Date(pssm.expectedDeliveryDate).toLocaleDateString('en-IN') : 'Standard Timeline'} | Please present this bill/slip during trial & pickup.`, leftMargin + 6, y + 24, { width: contentWidth - 12 });
        } else {
          doc.font('Helvetica').fontSize(6.5).fillColor('#444444')
            .text('Alteration / Stitching facility available on all eligible garments. Please show this invoice at alteration counter.', leftMargin + 6, y + 13);
        }

        y += altBoxHeight + 4;

        // ─── 7. PROMOTIONAL BANNERS & QR CODES FOOTER ───
        const footerY = y;
        const footerHeight = pageHeight - footerY - 18; // remaining height strictly to bottom margin

        doc.rect(leftMargin, footerY, contentWidth, footerHeight).strokeColor('#000000').lineWidth(0.6).stroke();

        // Generate Invoice Digital Tracking QR
        const invoiceQrUrl = `${baseUrl || 'https://vastra-erp.com'}/invoice/track/${encodeURIComponent(bill.billNo || 'NFS')}`;
        const qrBuffer = await this.getQRCodeBuffer(invoiceQrUrl, 56);
        if (qrBuffer) {
          doc.image(qrBuffer, leftMargin + 8, footerY + 6, { width: 52, height: 52 });
          doc.font('Helvetica-Bold').fontSize(5.5).fillColor('#000000')
            .text('SCAN FOR DIGITAL BILL', leftMargin + 6, footerY + 60, { width: 56, align: 'center' });
        }

        // Terms & Conditions in Middle
        const termsX = leftMargin + 72;
        const termsWidth = contentWidth - 144;
        doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#000000')
          .text('TERMS & CONDITIONS OF SALE & EXCHANGE:', termsX, footerY + 5);
        
        doc.font('Helvetica').fontSize(5.8).fillColor('#333333')
          .text('1. Exchange or return of garments will not be accepted after Alteration or Fall Picco.', termsX, footerY + 14)
          .text('2. Garments can be exchanged within 3 days with original bill and unused tags intact.', termsX, footerY + 22)
          .text('3. In fashion fabrics, colors cannot be guaranteed against harsh chemical wash.', termsX, footerY + 30)
          .text('4. Goods once sold will not be refunded. Altered items must be collected within 15 days.', termsX, footerY + 38);

        doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000')
          .text('THANK YOU FOR SHOPPING WITH US!  -  Your Trust, Our Style', termsX, footerY + 52, { width: termsWidth, align: 'center' });

        // Instagram / Social QR on Right
        const instaQrUrl = 'https://www.instagram.com/nfs_palam/';
        const instaQrBuffer = await this.getQRCodeBuffer(instaQrUrl, 56);
        if (instaQrBuffer) {
          doc.image(instaQrBuffer, leftMargin + contentWidth - 62, footerY + 6, { width: 52, height: 52 });
          doc.font('Helvetica-Bold').fontSize(5.5).fillColor('#000000')
            .text('FOLLOW @nfs_palam', leftMargin + contentWidth - 66, footerY + 60, { width: 60, align: 'center' });
        }

        doc.end();
      } catch (err) {
        console.error('Failed to generate Invoice PDF Buffer:', err);
        reject(err);
      }
    });
  }

  /**
   * 2. SINGLE-PAGE PSSM / ALTERATION TRACKING SLIP PDF GENERATOR
   * Produces an exact single-page live alteration tracking slip with real-time database statuses.
   */
  static async generatePSSMPDFBuffer(trackData, baseUrl = '') {
    return new Promise(async (resolve, reject) => {
      try {
        const store = trackData?.store || {};
        const pssm = trackData?.pssm || {};
        const bill = trackData?.bill || {};
        const items = trackData?.alterationItems || [];
        const summary = trackData?.summary || {};

        const doc = new PDFDocument({
          size: 'A4',
          margin: 18,
          info: {
            Title: `PSSM Alteration Slip - ${pssm.pssmNo || 'NFS'}`,
            Author: store.name || 'NEW FASHION STYLE',
            Subject: 'Post Sales Alteration Tracking Slip'
          }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', err => reject(err));

        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const leftMargin = 18;
        const rightMargin = 18;
        const contentWidth = pageWidth - leftMargin - rightMargin;

        let y = 18;

        // ─── 1. TOP HEADER ───
        doc.rect(leftMargin, y, contentWidth, 54).strokeColor('#000000').lineWidth(1.2).stroke();
        
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#000000')
          .text(store.name || 'NEW FASHION STYLE (NFS)', leftMargin + 8, y + 5, { width: contentWidth - 16, align: 'center' });
        
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000')
          .text('POST SALES SERVICE (PSSM) - ALTERATION & CUSTOM TAILORING SLIP', leftMargin + 8, y + 21, { width: contentWidth - 16, align: 'center' });
        
        doc.font('Helvetica').fontSize(7.5).fillColor('#333333')
          .text('Ram Chowk, Sadh Nagar, Palam, New Delhi - 110045 | Helpline: 9990397529 | LIVE STATUS TRACKING', leftMargin + 8, y + 33, { width: contentWidth - 16, align: 'center' });

        doc.font('Helvetica-Bold').fontSize(7).fillColor('#dc2626')
          .text('*** LIVE REAL-TIME DATABASE DOCUMENT - VERIFY STATUS BEFORE DELIVERY ***', leftMargin + 8, y + 43, { width: contentWidth - 16, align: 'center' });

        y += 58;

        // ─── 2. PSSM TICKET & CUSTOMER META GRID ───
        const metaBoxHeight = 52;
        doc.rect(leftMargin, y, contentWidth, metaBoxHeight).strokeColor('#000000').lineWidth(0.8).stroke();
        doc.moveTo(leftMargin + contentWidth / 2, y).lineTo(leftMargin + contentWidth / 2, y + metaBoxHeight).stroke();

        const pssmDate = pssm.createdAt || pssm.date ? new Date(pssm.createdAt || pssm.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A';
        const deliveryDateStr = pssm.expectedDeliveryDate ? new Date(pssm.expectedDeliveryDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Standard Timeline';
        const trialDateStr = pssm.trialDate ? new Date(pssm.trialDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : (pssm.trialRequired ? 'Trial Required (Date TBD)' : 'No Trial (Direct Delivery)');

        // Left Box: PSSM Slip Details
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000')
          .text('PSSM SLIP NUMBER:', leftMargin + 6, y + 5)
          .font('Helvetica-Bold').fontSize(11).fillColor('#000000')
          .text(pssm.pssmNo || 'PSSM-NFS', leftMargin + 6, y + 16);
        doc.font('Helvetica').fontSize(7.5).fillColor('#333333')
          .text(`Original Bill / Inv: ${pssm.billNo || bill.billNo || 'N/A'}    |    Booked: ${pssmDate}`, leftMargin + 6, y + 32)
          .text(`Priority: ${pssm.priority || 'STANDARD'}    |    Salesman: ${pssm.salesmanName || 'Store Staff'}`, leftMargin + 6, y + 42);

        // Right Box: Customer & Delivery Details
        const rightColX = leftMargin + (contentWidth / 2) + 6;
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000')
          .text('CUSTOMER & DELIVERY SCHEDULE:', rightColX, y + 5)
          .font('Helvetica-Bold').fontSize(9.5).fillColor('#000000')
          .text(`${pssm.customerName || bill.customerName || 'Walk-in Customer'} (+91 ${pssm.customerPhone || bill.customerPhone || 'N/A'})`, rightColX, y + 16);
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#059669')
          .text(`Expected Delivery: ${deliveryDateStr}`, rightColX, y + 30);
        doc.font('Helvetica').fontSize(7.5).fillColor('#4338ca')
          .text(`Trial Schedule: ${trialDateStr}`, rightColX, y + 41);

        y += metaBoxHeight + 6;

        // ─── 3. ITEM-LEVEL ALTERATION & TAILORING STATUS TABLE ───
        const maxTableHeight = 440;
        const itemCount = Math.max(1, items.length);
        const headerHeight = 16;
        const rowHeight = Math.max(26, Math.min(48, (maxTableHeight - headerHeight) / itemCount));

        const colX = {
          sno: leftMargin,
          garment: leftMargin + 24,
          service: leftMargin + 130,
          barcode: leftMargin + 250,
          tailor: leftMargin + 340,
          status: leftMargin + 420,
          trialDel: leftMargin + 485
        };

        // Table Header
        doc.rect(leftMargin, y, contentWidth, headerHeight).fillColor('#f1f5f9').fill();
        doc.rect(leftMargin, y, contentWidth, headerHeight).strokeColor('#000000').lineWidth(0.8).stroke();

        doc.font('Helvetica-Bold').fontSize(7.2).fillColor('#000000');
        doc.text('S.N.', colX.sno + 3, y + 4);
        doc.text('Garment / Product', colX.garment + 3, y + 4);
        doc.text('Alteration Work / Details', colX.service + 3, y + 4);
        doc.text('Item Barcode / TI#', colX.barcode + 3, y + 4);
        doc.text('Master Tailor', colX.tailor + 3, y + 4);
        doc.text('LIVE STATUS', colX.status + 3, y + 4);
        doc.text('Trial & Delivery', colX.trialDel + 3, y + 4);

        y += headerHeight;

        // Render Table Rows
        items.forEach((it, idx) => {
          const rowY = y + (idx * rowHeight);
          if (idx % 2 === 1) {
            doc.rect(leftMargin, rowY, contentWidth, rowHeight).fillColor('#fbfbfb').fill();
          }
          doc.rect(leftMargin, rowY, contentWidth, rowHeight).strokeColor('#cbd5e1').lineWidth(0.5).stroke();

          // S.No
          doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000');
          doc.text(`${idx + 1}`, colX.sno + 3, rowY + 4);

          // Garment Name & Size
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000')
            .text((it.garmentName || 'Altered Garment').substring(0, 24), colX.garment + 3, rowY + 3);
          doc.font('Helvetica').fontSize(6.5).fillColor('#475569')
            .text(`Size: ${it.size || 'Free'} | ${it.gender || 'Standard'}`, colX.garment + 3, rowY + 13);

          // Alteration Details & Instructions
          const detailsStr = Array.isArray(it.alterationDetails) ? it.alterationDetails.join(', ') : (it.serviceType || 'Alteration');
          doc.font('Helvetica-Bold').fontSize(7).fillColor('#1e293b')
            .text(detailsStr.substring(0, 34), colX.service + 3, rowY + 3);
          if (it.specialInstructions) {
            doc.font('Helvetica-Oblique').fontSize(6).fillColor('#64748b')
              .text(`Note: ${it.specialInstructions.substring(0, 34)}`, colX.service + 3, rowY + 13);
          }

          // Barcode & Tailor Invoice No
          const barcodeText = it.alterationBarcode || it.tailorInvoiceNo || `${pssm.pssmNo}-${idx + 1}`;
          doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000')
            .text(barcodeText, colX.barcode + 3, rowY + 3);
          if (it.barcode) {
            doc.font('Helvetica').fontSize(6).fillColor('#64748b')
              .text(`Tag: ${it.barcode}`, colX.barcode + 3, rowY + 13);
          }

          // Master Tailor
          doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000')
            .text(it.tailorName || 'In-House Tailor', colX.tailor + 3, rowY + 4);

          // Status Badge (Color-coded)
          const st = (it.status || 'PENDING').toUpperCase();
          let statusColor = '#2563eb'; // Blue
          if (st.includes('READY')) statusColor = '#059669'; // Green
          if (st.includes('COLLECT') || st.includes('DELIVER')) statusColor = '#0f172a'; // Black/Slate
          if (st.includes('PROGRESS') || st.includes('STITCH')) statusColor = '#d97706'; // Amber

          doc.font('Helvetica-Bold').fontSize(7.5).fillColor(statusColor)
            .text(st, colX.status + 3, rowY + 4);

          // Trial & Delivery Schedule
          const itemTrial = it.trialDate ? new Date(it.trialDate).toLocaleDateString('en-IN') : (it.trialRequired ? 'Req' : 'No');
          const itemDel = it.deliveryDate ? new Date(it.deliveryDate).toLocaleDateString('en-IN') : (pssm.expectedDeliveryDate ? new Date(pssm.expectedDeliveryDate).toLocaleDateString('en-IN') : '-');
          doc.font('Helvetica').fontSize(6.5).fillColor('#333333')
            .text(`Trial: ${itemTrial}`, colX.trialDel + 3, rowY + 3)
            .text(`Del: ${itemDel}`, colX.trialDel + 3, rowY + 13);
        });

        y += (itemCount * rowHeight);
        doc.moveTo(leftMargin, y).lineTo(leftMargin + contentWidth, y).strokeColor('#000000').lineWidth(0.8).stroke();
        y += 6;

        // ─── 4. BOTTOM STATUS PIPELINE SUMMARY BAR ───
        const totalItemsCount = items.length;
        const pendingCount = items.filter(i => (i.status || '').includes('PENDING') || (i.status || '').includes('BOOKED')).length;
        const inStitchingCount = items.filter(i => (i.status || '').includes('STITCH') || (i.status || '').includes('PROGRESS') || (i.status || '').includes('CUTTING')).length;
        const readyCount = items.filter(i => (i.status || '').includes('READY')).length;
        const collectedCount = items.filter(i => (i.status || '').includes('COLLECT') || (i.status || '').includes('DELIVER') || (i.status || '').includes('CLOSED')).length;

        doc.rect(leftMargin, y, contentWidth, 24).fillColor('#0f172a').fill();
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff')
          .text(`TOTAL GARMENTS: ${totalItemsCount}   |   BOOKED: ${pendingCount}   |   IN STITCHING: ${inStitchingCount}   |   READY FOR PICKUP: ${readyCount}   |   COLLECTED: ${collectedCount}`, leftMargin + 6, y + 8, { width: contentWidth - 12, align: 'center' });

        y += 28;

        // ─── 5. PSSM FOOTER & QR CODE ───
        const footerY = y;
        const footerHeight = pageHeight - footerY - 18;

        doc.rect(leftMargin, footerY, contentWidth, footerHeight).strokeColor('#000000').lineWidth(0.6).stroke();

        // Generate PSSM QR Code
        const pssmQrUrl = `${baseUrl || 'https://vastra-erp.com'}/pssm/track/${encodeURIComponent(pssm.pssmNo || 'PSSM')}`;
        const pssmQrBuffer = await this.getQRCodeBuffer(pssmQrUrl, 56);
        if (pssmQrBuffer) {
          doc.image(pssmQrBuffer, leftMargin + 8, footerY + 6, { width: 52, height: 52 });
          doc.font('Helvetica-Bold').fontSize(5.5).fillColor('#000000')
            .text('SCAN FOR LIVE PSSM', leftMargin + 6, footerY + 60, { width: 56, align: 'center' });
        }

        const termsX = leftMargin + 72;
        const termsWidth = contentWidth - 80;
        doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000')
          .text('CUSTOMER NOTICE & ALTERATION COLLECTION GUIDELINES:', termsX, footerY + 5);

        doc.font('Helvetica').fontSize(6).fillColor('#333333')
          .text('1. Please bring and present this alteration slip or show the digital QR code at the collection counter.', termsX, footerY + 15)
          .text('2. Customers are requested to take a trial at the time of delivery to ensure perfect fit satisfaction.', termsX, footerY + 23)
          .text('3. Any re-alteration request must be registered within 48 hours of trial / delivery.', termsX, footerY + 31)
          .text('4. Store will not be responsible for altered garments uncollected after 30 days of expected delivery date.', termsX, footerY + 39);

        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000')
          .text('NEW FASHION STYLE (NFS) - Master Tailoring & Perfect Fit Guarantee', termsX, footerY + 52, { width: termsWidth, align: 'center' });

        doc.end();
      } catch (err) {
        console.error('Failed to generate PSSM PDF Buffer:', err);
        reject(err);
      }
    });
  }
}

module.exports = PDFService;
