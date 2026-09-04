import { generateCode128SvgString } from './barcode128.helper';
import QRCode from 'qrcode-svg';

const INSTAGRAM_URL = "https://www.instagram.com/nfs_palam/";
const instagramQrSvg = new QRCode({
  content: INSTAGRAM_URL,
  padding: 2,
  width: 55,
  height: 55,
  color: "#000000",
  background: "#ffffff",
  ecl: "M",
  container: "svg-viewbox"
}).svg();

const svgIcons = {
  qrPlace: `<svg width="55" height="55" viewBox="0 0 25 25" fill="#000"><path d="M2 2h7v7H2zM3 3v5h5V3zM4 4h3v3H4z"/><path d="M16 2h7v7h-7zM17 3v5h5V3zM18 4h3v3h-3z"/><path d="M2 16h7v7H2zM3 17v5h5v-5zM4 18h3v3H4z"/><rect x="10" y="2" width="1" height="1"/><rect x="12" y="2" width="1" height="1"/><rect x="14" y="2" width="1" height="1"/><rect x="11" y="3" width="1" height="1"/><rect x="13" y="3" width="1" height="1"/><rect x="10" y="4" width="2" height="1"/><rect x="13" y="4" width="1" height="1"/><rect x="10" y="5" width="1" height="1"/><rect x="12" y="5" width="2" height="1"/><rect x="11" y="6" width="1" height="1"/><rect x="13" y="6" width="2" height="1"/><rect x="10" y="7" width="2" height="1"/><rect x="14" y="7" width="1" height="1"/><rect x="11" y="8" width="1" height="1"/><rect x="13" y="8" width="1" height="1"/><rect x="2" y="10" width="1" height="1"/><rect x="4" y="10" width="2" height="1"/><rect x="7" y="10" width="1" height="1"/><rect x="9" y="10" width="3" height="1"/><rect x="13" y="10" width="1" height="1"/><rect x="15" y="10" width="2" height="1"/><rect x="18" y="10" width="1" height="1"/><rect x="20" y="10" width="2" height="1"/><rect x="3" y="11" width="1" height="1"/><rect x="5" y="11" width="1" height="1"/><rect x="8" y="11" width="2" height="1"/><rect x="11" y="11" width="1" height="1"/><rect x="14" y="11" width="2" height="1"/><rect x="17" y="11" width="1" height="1"/><rect x="19" y="11" width="1" height="1"/><rect x="21" y="11" width="1" height="1"/><rect x="2" y="12" width="2" height="1"/><rect x="6" y="12" width="1" height="1"/><rect x="9" y="12" width="1" height="1"/><rect x="12" y="12" width="2" height="1"/><rect x="16" y="12" width="1" height="1"/><rect x="18" y="12" width="2" height="1"/><rect x="21" y="12" width="1" height="1"/><rect x="3" y="13" width="1" height="1"/><rect x="5" y="13" width="2" height="1"/><rect x="8" y="13" width="1" height="1"/><rect x="10" y="13" width="1" height="1"/><rect x="13" y="13" width="1" height="1"/><rect x="15" y="13" width="2" height="1"/><rect x="19" y="13" width="1" height="1"/><rect x="2" y="14" width="1" height="1"/><rect x="4" y="14" width="1" height="1"/><rect x="7" y="14" width="2" height="1"/><rect x="11" y="14" width="2" height="1"/><rect x="14" y="14" width="1" height="1"/><rect x="17" y="14" width="2" height="1"/><rect x="20" y="14" width="1" height="1"/><rect x="10" y="16" width="1" height="1"/><rect x="12" y="16" width="2" height="1"/><rect x="15" y="16" width="1" height="1"/><rect x="17" y="16" width="1" height="1"/><rect x="19" y="16" width="2" height="1"/><rect x="22" y="16" width="1" height="1"/><rect x="11" y="17" width="1" height="1"/><rect x="13" y="17" width="1" height="1"/><rect x="16" y="17" width="2" height="1"/><rect x="19" y="17" width="1" height="1"/><rect x="21" y="17" width="1" height="1"/><rect x="10" y="18" width="2" height="1"/><rect x="14" y="18" width="1" height="1"/><rect x="17" y="18" width="1" height="1"/><rect x="20" y="18" width="2" height="1"/><rect x="11" y="19" width="1" height="1"/><rect x="13" y="19" width="2" height="1"/><rect x="16" y="19" width="1" height="1"/><rect x="18" y="19" width="1" height="1"/><rect x="21" y="19" width="1" height="1"/><rect x="10" y="20" width="1" height="1"/><rect x="12" y="20" width="1" height="1"/><rect x="15" y="20" width="2" height="1"/><rect x="19" y="20" width="1" height="1"/><rect x="22" y="20" width="1" height="1"/><rect x="11" y="21" width="2" height="1"/><rect x="14" y="21" width="1" height="1"/><rect x="17" y="21" width="2" height="1"/><rect x="20" y="21" width="1" height="1"/><rect x="10" y="22" width="1" height="1"/><rect x="13" y="22" width="1" height="1"/><rect x="16" y="22" width="1" height="1"/><rect x="19" y="22" width="2" height="1"/><rect x="22" y="22" width="1" height="1"/></svg>`,
  crownLogo: `<svg width="55" height="55" viewBox="0 0 100 100" fill="none" stroke="#000" stroke-width="2"><circle cx="50" cy="50" r="47"/><path d="M25 42 L20 25 L35 34 L50 15 L65 34 L80 25 L75 42 Z" fill="#000"/><circle cx="20" cy="22" r="2.5" fill="#000" /><circle cx="35" cy="31" r="2.5" fill="#000" /><circle cx="50" cy="12" r="2.5" fill="#000" /><circle cx="65" cy="31" r="2.5" fill="#000" /><circle cx="80" cy="22" r="2.5" fill="#000" /><rect x="25" y="45" width="50" height="2" fill="#000"/><text x="50" y="70" font-family="Arial, sans-serif" font-size="28" font-weight="900" text-anchor="middle" fill="#000" stroke="none">NFS</text><path d="M50 78 l1 3 l3 0 l-2.5 2 l1 3 l-2.5 -2 l-2.5 2 l1 -3 l-2.5 -2 l3 0 z" fill="#000" stroke="none"/><path d="M37 76 l1 3 l3 0 l-2.5 2 l1 3 l-2.5 -2 l-2.5 2 l1 -3 l-2.5 -2 l3 0 z" fill="#000" stroke="none"/><path d="M63 76 l1 3 l3 0 l-2.5 2 l1 3 l-2.5 -2 l-2.5 2 l1 -3 l-2.5 -2 l3 0 z" fill="#000" stroke="none"/></svg>`,
  phone: `<svg width="10" height="10" viewBox="0 0 24 24" fill="#000"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>`,
  whatsapp: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`,
  instagram: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`,
  pin: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
  document: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
  user: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  mobile: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.5"><rect x="6" y="2" width="12" height="20" rx="2" ry="2" stroke-width="1.5"/><circle cx="16" cy="16" r="5.5" fill="#000" stroke="none"/><path d="M14 16 l1.5 1.5 l3 -3" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  sewing: `<svg width="35" height="28" viewBox="0 0 100 100" fill="#000"><path d="M10 80 H90 V90 H10 Z"/><path d="M15 80 V60 H70 C80 60, 80 30, 70 30 H25 V45 H15 V25 H75 C95 25, 95 65, 75 65 H25 V80 Z"/><rect x="40" y="10" width="4" height="20"/><circle cx="42" cy="15" r="6"/><rect x="20" y="45" width="4" height="20"/><circle cx="22" cy="70" r="4" fill="none" stroke="#000" stroke-width="3"/></svg>`,
  new: `<svg width="30" height="30" viewBox="0 0 100 100" fill="#000"><polygon points="50,5 60,20 78,15 80,33 95,43 85,57 95,71 80,80 78,95 60,90 50,105 40,90 22,95 20,80 5,71 15,57 5,43 20,33 22,15 40,20"/><text x="50" y="56" font-family="Arial" font-size="28" font-weight="900" fill="#fff" text-anchor="middle">NEW</text></svg>`,
  percent: `<svg width="30" height="30" viewBox="0 0 100 100" fill="#000"><polygon points="50,5 60,20 78,15 80,33 95,43 85,57 95,71 80,80 78,95 60,90 50,105 40,90 22,95 20,80 5,71 15,57 5,43 20,33 22,15 40,20"/><text x="50" y="59" font-family="Arial" font-size="40" font-weight="900" fill="#fff" text-anchor="middle">%</text></svg>`,
  premium: `<svg width="30" height="30" viewBox="0 0 100 100" fill="#000"><path d="M20 35 L80 35 L85 90 L15 90 Z"/><path d="M35 35 C35 10, 65 10, 65 35" fill="none" stroke="#000" stroke-width="7"/></svg>`,
  truck: `<svg width="30" height="30" viewBox="0 0 100 100" fill="#000"><path d="M15 35 H65 V70 H15 Z" /><path d="M65 45 H85 L90 55 V70 H65 Z" /><circle cx="30" cy="70" r="10" fill="#fff" stroke="#000" stroke-width="4"/><circle cx="75" cy="70" r="10" fill="#fff" stroke="#000" stroke-width="4"/><path d="M0 45 H10 M0 55 H10" stroke="#000" stroke-width="4" stroke-linecap="round"/></svg>`,
  instagramLarge: `<svg width="30" height="30" viewBox="0 0 100 100" fill="none" stroke="#000" stroke-width="8" stroke-linejoin="round"><rect x="15" y="15" width="70" height="70" rx="20" ry="20" /><circle cx="50" cy="50" r="16" /><circle cx="70" cy="30" r="4" fill="#000" stroke="none" /></svg>`,
  exchange: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>`,
  starFilled: `<svg width="12" height="12" viewBox="0 0 24 24" fill="#000"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  circleStars: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6l1 3h3l-2.5 2 1 3-2.5-2-2.5 2 1-3-2.5-2h3z" fill="#000"/></svg>`
};

export const generateReceiptHTMLContent = (invoice, autoPrint = false) => {
  const receiptDate = invoice.date ? new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/') : '-';
  const receiptTime = invoice.date ? new Date(invoice.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() : '-';
  
  const paymentSplits = invoice.transactions || invoice.splitPayments || [];
  let totalPaid = 0;

  if (paymentSplits.length > 0) {
    // Exclude DUE mode from totalPaid — DUE is the unpaid portion, not cash received
    totalPaid = paymentSplits.reduce((acc, sp) => {
      const mode = (sp.method || sp.mode || '').toUpperCase();
      if (mode === 'DUE' || mode === 'CREDIT') return acc;
      return acc + (Number(sp.amount) || 0);
    }, 0);
  } else if (invoice.amountPaid !== undefined && invoice.amountPaid > 0) {
    totalPaid = invoice.amountPaid;
  }

  // Bill adjustment: only count as special discount if it's a Discount operation
  const billAdj = invoice.billAdjustment || {};
  const billAdjAmt = Number(billAdj.amount || invoice.billAdjustmentAmount || 0);
  const billAdjOperation = billAdj.operation || 'Discount';
  const specialDiscountAmt = billAdjOperation === 'Discount' ? Number(invoice.specialDiscount || billAdjAmt || 0) : 0;
  const serviceChargeAmt = billAdjOperation === 'Charge' ? billAdjAmt : 0;

  const dueAmount = Math.max(0, Number((invoice.grandTotal - totalPaid).toFixed(2)));
  const displayGrandTotal = Number(invoice.grandTotal) || 0;

  // Show due info ONLY when "Due" was explicitly selected as payment method
  const isDueSelected =
    paymentSplits.some(sp => (sp.method || sp.mode || '').toUpperCase() === 'DUE') ||
    ['DUE', 'CREDIT'].includes((invoice.paymentMethod || invoice.paymentMode || '').toUpperCase());

  const getPaymentModesText = () => {
    if (paymentSplits.length > 0) {
      return paymentSplits.filter(sp => (sp.method || sp.mode || '').toUpperCase() !== 'DUE').map(sp => (sp.method || sp.mode).toUpperCase()).join(', ') || 'DUE';
    }
    return (invoice.paymentMethod || invoice.paymentMode || 'CASH').toUpperCase();
  };

  const getTaxBreakdownHTML = () => {
    const taxRows = [];
    if (invoice.taxBreakdown && invoice.taxBreakdown.length > 0) {
      invoice.taxBreakdown.forEach(tb => {
        taxRows.push(`
          <tr>
            <td class="text-center font-bold">${tb.gstPercent || '-'}%</td>
            <td>${(Number(tb.taxableAmount) || 0).toFixed(2)}</td>
            <td>${(Number(tb.cgst) || 0).toFixed(2)}</td>
            <td>${(Number(tb.sgst) || 0).toFixed(2)}</td>
            <td>${(Number(tb.totalTax) || 0).toFixed(2)}</td>
          </tr>
        `);
      });
    } else {
      taxRows.push(`
        <tr>
          <td class="text-center font-bold">-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
        </tr>
      `);
    }
    return taxRows.join('');
  };

  const items = invoice.items || [];
  
  const itemsHTML = items.map((item, index) => {
    return `
      <tr class="item-row">
        <td class="col-sn">${index + 1}</td>
        <td class="col-code">
          <div>B- ${item.barcode || 'N/A'}</div>
          <div>U- ${item.uniqueCode || item.barcode || 'N/A'}</div>
          <div>D- ${item.sku || item.designNo || item.itemCode || 'N/A'}</div>
        </td>
        <td class="col-product">${item.name || item.itemName}</td>
        <td class="col-shade">(NIL)</td>
        <td class="col-qty">${(Number(item.quantity)||1).toFixed(2)}</td>
        <td class="col-mrp">${(Number(item.mrp) || Number(item.price) || 0).toFixed(0)}</td>
        <td class="col-cd">${(Number(item.discountPercent) || 0).toFixed(0)}</td>
        <td class="col-amount">${(Number(item.totalPrice || item.price) || 0).toFixed(0)}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Receipt ${invoice.invoiceNo || invoice.billNo || 'DRAFT'}</title>
      <style>
        @page { margin: 0; }
        body { 
          font-family: Arial, sans-serif; 
          color: #000; 
          margin: 0 auto; 
          padding: 0;
          width: 80mm;
          font-size: 10px;
          line-height: 1.2;
          background: #fff;
        }
        * { box-sizing: border-box; }
        
        .print-container {
          width: 80mm;
          padding: 4px;
          overflow: hidden;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        
        /* Header Section */
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 5px;
        }
        
        .header-title-box {
          flex: 1;
          text-align: center;
          margin-left: 3px;
        }
        .tax-invoice-label {
          font-size: 11px;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          margin-bottom: 2px;
          width: 100%;
        }
        .tax-invoice-label::before,
        .tax-invoice-label::after {
          content: "";
          flex: 1;
          height: 3px;
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          margin: 0 10px;
        }

        .firm-title {
          font-family: "Arial Narrow", Arial, sans-serif;
          font-stretch: condensed;
          font-size: 19px;
          font-weight: 700;
          margin: 2px 0;
          letter-spacing: -0.2px;
        }
        .tagline {
          font-size: 8px;
          font-weight: bold;
          background: #000;
          color: #fff;
          padding: 3px 15px;
          display: inline-flex;
          align-items: center;
          clip-path: polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%);
        }
        
        .address-box {
          text-align: center;
          font-size: 9px;
          border-bottom: 1px dashed #666;
          padding-bottom: 5px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        .social-row {
          display: flex;
          justify-content: center;
          gap: 10px;
          font-size: 9px;
          margin: 3px 0;
          align-items: center;
        }
        
        /* Info Boxes Side by Side */
        .info-boxes {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          gap: 4px;
        }
        .info-box {
          border: 1px solid #777;
          border-radius: 4px;
          flex: 1;
          font-size: 9px;
          padding-bottom: 3px;
        }
        .info-box-header {
          color: #000;
          font-weight: bold;
          text-align: left;
          padding: 3px 6px;
          font-size: 9px;
          display: flex;
          align-items: center;
          gap: 4px;
          border-bottom: 1px solid #777;
        }
        .info-box-content {
          padding: 3px 6px;
          font-weight: bold;
        }
        .info-row {
          display: flex;
          margin-bottom: 1px;
        }
        .info-label {
          width: 50px;
        }
        .info-value {
          flex: 1;
          word-break: break-all;
        }
        
        /* Product Table */
        .product-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 5px;
          font-size: 9px;
        }
        .product-table th, .product-table td {
          border: 1px solid #777;
          padding: 3px 2px;
          vertical-align: middle;
        }
        .product-table th {
          text-align: center;
          font-weight: bold;
          font-size: 8px;
        }
        .col-sn { width: 5%; text-align: center; font-weight: bold;}
        .col-code { width: 23%; word-wrap: break-word; font-size: 8px; font-weight: bold;}
        .col-code div { margin-bottom: 1px; }
        .col-product { width: 23%; word-wrap: break-word; font-weight: bold; text-align: center;}
        .col-shade { width: 10%; text-align: center; font-size: 8px; font-weight: bold;}
        .col-qty { width: 8%; text-align: center; font-weight: bold;}
        .col-mrp { width: 10%; text-align: center; font-weight: bold;}
        .col-cd { width: 8%; text-align: center; font-weight: bold;}
        .col-amount { width: 13%; text-align: center; font-weight: bold; }
        
        .totals-row td {
          font-weight: bold;
          border-top: 1px solid #777;
          padding: 4px 2px;
        }
        
        /* Summary & Tax Side by Side */
        .summary-tax-container {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          gap: 4px;
        }
        .summary-box {
          flex: 1;
          font-size: 9px;
          font-weight: bold;
        }
        .section-black-header {
          background: #000;
          color: #fff;
          font-weight: bold;
          padding: 2px 4px;
          font-size: 9px;
          text-align: center;
          border-radius: 2px;
          margin-bottom: 2px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .final-amount-box {
          border: 1px solid #000;
          padding: 2px 4px;
          font-weight: bold;
          font-size: 11px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 2px;
        }
        .final-amount-label {
          font-size: 9px;
        }
        
        .tax-box {
          flex: 1.3;
        }
        .tax-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 7px;
        }
        .tax-table th, .tax-table td {
          border: 1px solid #777;
          padding: 2px;
          text-align: center;
          font-weight: bold;
        }
        .tax-table th { background: #fff; color: #000; font-size: 7px;}
        
        /* Payment & Loyalty */
        .payment-loyalty-container {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          gap: 4px;
        }
        .payment-box {
          flex: 1;
          font-size: 9px;
        }
        .payment-content { padding: 2px 0; font-weight: bold; white-space: nowrap; }
        .loyalty-box {
          flex: 1.3;
        }
        
        /* Alteration Box */
        .alteration-box {
          border: 1px dashed #777;
          border-radius: 4px;
          padding: 4px;
          margin-bottom: 5px;
          text-align: center;
        }
        
        /* Promotions Section */
        .promo-box {
          display: flex;
          justify-content: space-between;
          border: 1px dashed #777;
          border-radius: 4px;
          padding: 4px 2px;
          margin-bottom: 5px;
          font-size: 7px;
          text-align: center;
        }
        .promo-item {
          flex: 1;
          padding: 0 2px;
          border-right: 1px dashed #ccc;
        }
        .promo-item:last-child {
          border-right: none;
        }
        .promo-icon {
          margin-bottom: 2px;
          display: flex;
          justify-content: center;
        }
        
        /* Footer Terms & Exchange */
        .terms-box {
          border: 1px solid #777;
          padding: 4px;
          font-size: 7px;
          display: flex;
        }
        .terms-list {
          flex: 1;
          padding-left: 10px;
          margin: 0;
          font-weight: bold;
        }
        .exchange-policy {
          flex: 0.6;
          border-left: 1px dashed #777;
          padding-left: 4px;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-weight: bold;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        
        <!-- Header -->
        <div class="header-top">
          <div style="width: 55px; display:flex; flex-direction:column; align-items:center;">
             ${svgIcons.qrPlace}
             <div style="margin-top:2px;">${svgIcons.crownLogo}</div>
          </div>
          <div class="header-title-box">
            <div style="font-size: 8px; margin-bottom: 2px; font-weight: bold;">Scan & Pay with any UPI App</div>
            <div class="tax-invoice-label">TAX INVOICE</div>
            <div class="firm-title">NEW FASHION STYLE - NFS</div>
            <div style="margin-top: 2px; display: flex; justify-content: center; align-items: center; gap: 4px;">
              ${svgIcons.starFilled}
              <div class="tagline">STYLE JO AAPKO PARIBHASHIT KARE</div>
              ${svgIcons.starFilled}
            </div>
            
            <div class="address-box">
              <div style="display:flex; align-items:center; justify-content:center; gap:4px; margin-bottom: 2px;">
                 ${svgIcons.pin} WZ-127, RAM CHOWK SADH NAGAR,
              </div>
              <div>PALAM COLONY, DELHI-110045</div>
              <div class="social-row">
                <span style="display:flex; align-items:center; gap:4px;">${svgIcons.phone} 9990397529</span> | 
                <span style="display:flex; align-items:center; gap:4px;">${svgIcons.whatsapp} 9990397529</span> | 
                <span style="display:flex; align-items:center; gap:4px;">${svgIcons.instagram} nfs_palam</span>
              </div>
              <div class="font-bold">GSTIN No.: 07AALPD0185E1Z1</div>
            </div>
            
          </div>
        </div>
        
        <!-- Info Boxes -->
        <div class="info-boxes">
          <div class="info-box">
            <div class="info-box-header">${svgIcons.document} INVOICE DETAIL</div>
            <div class="info-box-content">
              <div class="info-row"><div class="info-label">Bill No.</div><div>: ${invoice.invoiceNo || invoice.billNo || 'DRAFT'}</div></div>
              <div class="info-row"><div class="info-label">Date</div><div>: ${receiptDate}</div></div>
              <div class="info-row"><div class="info-label">Time</div><div>: ${receiptTime}</div></div>
            </div>
          </div>
          <div class="info-box">
            <div class="info-box-header">${svgIcons.user} CUSTOMER DETAIL</div>
            <div class="info-box-content">
              <div class="info-row"><div class="info-label">Name</div><div>: ${invoice.customerName || invoice.customer?.name || 'NIL'}</div></div>
              <div class="info-row"><div class="info-label">Mobile No.</div><div>: ${invoice.customerPhone || invoice.customer?.phone || '0'}</div></div>
              <div class="info-row"><div class="info-label">GST No.</div><div>: ${invoice.customer?.gstin || '-'}</div></div>
            </div>
          </div>
        </div>
        
        <!-- Product Table -->
        <table class="product-table">
          <thead>
            <tr>
              <th class="col-sn">SN</th>
              <th class="col-code">CODE / DETAILS</th>
              <th class="col-product">PRODUCT</th>
              <th class="col-shade">SHADE</th>
              <th class="col-qty">QTY</th>
              <th class="col-mrp">MRP</th>
              <th class="col-cd">CD %</th>
              <th class="col-amount">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
          <tfoot>
            <tr class="totals-row">
              <td colspan="4" class="text-left" style="padding-left:4px;">ITEMS SOLD : ${(invoice.items || []).length}</td>
              <td colspan="4" class="text-left" style="padding-left:14px;">NET SALE QTY : ${(invoice.items || []).reduce((acc, item) => acc + (Number(item.quantity) || 0), 0)}</td>
            </tr>
          </tfoot>
        </table>
        
        <!-- Summary & Tax -->
        <div class="summary-tax-container">
          <div class="summary-box">
            <div class="section-black-header" style="text-align: left;">BILL SUMMARY</div>
            <div class="summary-row"><div>Gross Amount</div><div>:</div><div style="width: 45px; text-align: right;">₹${(Number(invoice.subTotal) || 0).toFixed(2)}</div></div>
            <div class="summary-row"><div>Total Discount</div><div>:</div><div style="width: 45px; text-align: right;">₹${(Number(invoice.discountTotal) || 0).toFixed(2)}</div></div>
            ${specialDiscountAmt > 0 ? `<div class="summary-row"><div>Bill Adjustment (Discount)</div><div>:</div><div style="width: 45px; text-align: right;">-₹${specialDiscountAmt.toFixed(2)}</div></div>` : ''}
            ${serviceChargeAmt > 0 ? `<div class="summary-row"><div>Service Charge</div><div>:</div><div style="width: 45px; text-align: right;">+₹${serviceChargeAmt.toFixed(2)}</div></div>` : ''}
            <div class="summary-row"><div>Round Off</div><div>:</div><div style="width: 45px; text-align: right;">₹0.00</div></div>
            
            <div class="final-amount-box">
              <div class="final-amount-label">FINAL BILL AMOUNT<br><span style="font-size:6px; font-weight:normal;">(Inclusive of GST)</span></div>
              <div style="font-size: 12px;">₹${(Number(displayGrandTotal) || 0).toFixed(2)}</div>
            </div>
            <div style="font-size:6px; margin-top:2px; font-weight:bold;">* Final Bill Value Inclusive of GST</div>
          </div>
          
          <div class="tax-box">
            <div class="section-black-header">TAX DETAILS</div>
            <table class="tax-table">
              <thead>
                <tr>
                  <th>GST %</th>
                  <th>TAXABLE<br>AMOUNT</th>
                  <th>CGST<br>TAX</th>
                  <th>SGST<br>TAX</th>
                  <th>TOTAL<br>TAX</th>
                </tr>
              </thead>
              <tbody>
                ${getTaxBreakdownHTML()}
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Payment & Loyalty -->
        <div class="payment-loyalty-container">
          <div class="payment-box">
            <div class="section-black-header" style="text-align: left;">PAYMENT DETAILS</div>
            <div class="payment-content">
                ${paymentSplits.length > 0 ? 
                  paymentSplits.map(sp => {
                    const modeRaw = (sp.method || sp.mode || 'CASH').toUpperCase();
                    const modeLabel = modeRaw === 'POINTS' || modeRaw === 'POINTS_REDEEM' ? 'LOYALTY PTS' :
                      modeRaw === 'GIFT_VOUCHER' ? 'GIFT VOUCHER' :
                      modeRaw === 'ADVANCE' ? 'ADVANCE USED' : modeRaw;
                    return `<div class="info-row"><div class="info-label" style="width: 65px;">${modeLabel}</div><div>: &#8377;${(Number(sp.amount)||0).toFixed(2)}</div></div>`;
                  }).join('') +
                  (isDueSelected && dueAmount > 0 && !paymentSplits.some(sp => (sp.method || sp.mode || '').toUpperCase() === 'DUE') ? `<div class="info-row"><div class="info-label" style="width: 65px;">DUE / UNPAID</div><div>: &#8377;${dueAmount.toFixed(2)}</div></div>` : '')
                  :
                  `<div class="info-row"><div class="info-label" style="width: 65px;">Payment Mode</div><div>: ${getPaymentModesText()}</div></div>
                   <div class="info-row"><div class="info-label" style="width: 65px;">Amount Paid</div><div>: &#8377;${totalPaid.toFixed(2)}</div></div>
                   ${isDueSelected && dueAmount > 0 ? `<div class="info-row"><div class="info-label" style="width: 65px;">Due Balance</div><div>: &#8377;${dueAmount.toFixed(2)}</div></div>` : ''}`
                }
              </div>
            </div>
            
            <div style="flex:0.6; display: flex; flex-direction: column; align-items: center; justify-content: center; padding-top: 2px;">
             <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
               ${svgIcons.mobile}
               <div style="font-family: 'Brush Script MT', cursive; font-size: 18px; font-weight: 500; line-height: 0.9; margin-left: 3px;">Thank<br>You!</div>
             </div>
             <div style="text-align: center; font-size: 7px; font-weight: bold; margin-top: 4px;">VISIT AGAIN</div>
          </div>

          <div class="loyalty-box">
            <div class="section-black-header">LOYALTY POINTS</div>
            ${invoice.customer?.loyaltyPoints !== undefined || invoice.loyaltyPointsEarned ? `
            <table class="tax-table" style="width: 100%;">
              <thead>
                <tr>
                  <th style="font-size: 6px; font-weight: normal; padding: 2px;">Prev.</th>
                    <th style="font-size: 6px; font-weight: normal; padding: 2px;">Earned</th>
                    <th style="font-size: 6px; font-weight: normal; padding: 2px;">Redeemed</th>
                    <th style="font-size: 6px; font-weight: normal; padding: 2px;">Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr class="text-center font-bold" style="font-size: 8px;">
                  <td>${invoice.customer?.loyaltyPoints || 0}</td>
                  <td>${invoice.loyaltyPointsEarned || 0}</td>
                  <td>${invoice.loyaltyPointsRedeemed || 0}</td>
                  <td>${(invoice.customer?.loyaltyPoints || 0) + (invoice.loyaltyPointsEarned || 0) - (invoice.loyaltyPointsRedeemed || 0)}</td>
                </tr>
              </tbody>
            </table>
            ` : `<table class="tax-table" style="width: 100%;">
              <thead>
                <tr>
                  <th style="font-size: 6px; font-weight: normal; padding: 2px;">Prev.</th>
                    <th style="font-size: 6px; font-weight: normal; padding: 2px;">Earned</th>
                    <th style="font-size: 6px; font-weight: normal; padding: 2px;">Redeemed</th>
                    <th style="font-size: 6px; font-weight: normal; padding: 2px;">Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr class="text-center font-bold" style="font-size: 8px;">
                  <td>0</td>
                  <td>0</td>
                  <td>0</td>
                  <td>0</td>
                </tr>
              </tbody>
            </table>`}
          </div>
        </div>
        
        <!-- Due Highlight Box (Conditional - Prominent Black/White Box for Counter Staff) -->
        ${isDueSelected && dueAmount > 0 ? `
        <div class="due-box" style="border: 2px solid #000; background: #fff; padding: 4px 6px; margin: 6px 0; font-family: Arial, sans-serif;">
          <div style="background: #000; color: #fff; text-align: center; font-weight: 900; font-size: 11px; padding: 3px 0; letter-spacing: 1px; text-transform: uppercase;">
            ⚠️ OUTSTANDING CREDIT / DUE ⚠️
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 4px; font-weight: 900; font-size: 13px; color: #000;">
            <div>CREDIT / DUE AMOUNT:</div>
            <div style="font-size: 15px; font-family: monospace;">₹${dueAmount.toFixed(2)}</div>
          </div>
        </div>
        ` : ''}
        
        <!-- Alteration Section -->
        <div class="alteration-box" style="border: 1px dashed #000; border-radius: 4px; padding: 4px; margin-bottom: 5px; display: flex; align-items: center; justify-content: space-between;">
          <div style="font-size: 10px; font-weight: 900; margin-bottom: 2px; display: flex; align-items: center; justify-content: center; gap: 8px;">
            ${svgIcons.sewing} ALTERATION / STITCHING FACILITY AVAILABLE
          </div>
          <div style="font-weight: bold; font-size: 7px;">Alteration / Stitching service available on all eligible items. Please show this bill while submitting / collecting your items.</div>
        </div>
        
        <!-- Promotions Section -->
        <div class="promo-box">
          <div class="promo-item">
            <div class="promo-icon">${svgIcons.new}</div>
            <div class="font-bold">LATEST<br>COLLECTIONS</div>
            <div style="font-size: 6px;">Trendy styles for<br>every occasion</div>
          </div>
          <div class="promo-item">
            <div class="promo-icon">${svgIcons.percent}</div>
            <div class="font-bold">EXCLUSIVE<br>OFFERS</div>
            <div style="font-size: 6px;">Special Discounts<br>for our valued<br>customers</div>
          </div>
          <div class="promo-item">
            <div class="promo-icon">${svgIcons.premium}</div>
            <div class="font-bold">PREMIUM<br>QUALITY</div>
            <div style="font-size: 6px;">Best quality<br>fabrics &<br>finishing</div>
          </div>
          <div class="promo-item">
            <div class="promo-icon">${svgIcons.truck}</div>
            <div class="font-bold">FAST & SAFE<br>DELIVERY</div>
            <div style="font-size: 6px;">Quick & reliable<br>delivery across<br>Delhi NCR</div>
          </div>
          <div class="promo-item">
            <div class="promo-icon">${svgIcons.instagramLarge}</div>
            <div class="font-bold">FOLLOW US<br>ON INSTAGRAM</div>
            <div style="font-size: 6px;">Stay updated with<br>latest collections<br>& offers<br>@nfs_palam</div>
          </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <div style="display:flex; align-items:center; gap:5px;">
             <div style="width: 55px; height: 55px; flex-shrink: 0; display: flex; justify-content: center; align-items: center;">
               ${instagramQrSvg}
             </div>
             <div style="font-size: 8px; padding: 2px; display: flex; flex-direction: column; justify-content: center;">
                 <div style="font-size: 7px; font-weight:bold; margin-bottom: 1px;">SCAN TO FOLLOW</div>
                 <div class="font-bold" style="font-size: 10px; margin-bottom: 1px;">@nfs_palam</div>
                 <div style="font-size: 7px; font-weight:bold; margin-bottom: 2px;">ON INSTAGRAM</div>
                 <div style="font-size: 6px; background: #000; color: #fff; padding: 2px 4px; display: inline-block; font-weight:bold; border-radius: 8px;">SEE OUR LATEST COLLECTION</div>
             </div>
          </div>
          <div style="text-align: center;">
            <div style="margin-bottom: 4px;">${svgIcons.circleStars}</div>
          </div>
          <div class="text-center font-bold" style="font-size: 8px; padding-right: 10px;">
            THANK YOU FOR SHOPPING WITH US<br>
            <div style="font-family: 'Brush Script MT', cursive; font-size: 16px; font-weight: normal; margin-top: 4px; letter-spacing: 0.5px;">Your Trust, Our Style</div>
            <div style="font-size: 10px; margin-top: 2px;">♥</div>
          </div>
        </div>
        
        <!-- Footer Terms & Exchange -->
        <div class="terms-box">
          <ul class="terms-list">
            <div class="font-bold" style="margin-left: -10px; margin-bottom: 2px;">TERMS & CONDITIONS</div>
            <li>Exchange or return of pieces will not be allowed after Alteration, Fall Picco.</li>
            <li>No guarantee No claim.</li>
            <li>In today's fashion era, there is no guarantee of color.</li>
            <li>Money will not be refunded, you can exchange your pieces within 3 days.</li>
          </ul>
          <div class="exchange-policy">
            <div style="margin-bottom: 4px;">${svgIcons.exchange}</div>
            <div style="font-size: 12px;">EXCHANGE</div>
            <div style="font-size: 12px;">WITHIN 3 DAYS</div>
            <div style="font-size: 6px; font-weight: normal; margin-top: 4px;">* Only on Original Bill & Unused items</div>
          </div>
        </div>

      </div>

      ${autoPrint ? `
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        }
      </script>
      ` : ''}
    </body>
    </html>
  `;
};

export const generateAlterationReceiptHTMLContent = (invoice) => {
  return generateReceiptHTMLContent(invoice, false);
};