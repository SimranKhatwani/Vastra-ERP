import api from '../api/axios';
import React, { useState, useEffect } from 'react';
import {
  Building2, Phone, Mail, MessageSquare, Copy, Eye, Plus, AlertCircle,
  Search, Trash2, Edit3, MapPin, CreditCard, Tag, Printer, ArrowLeft, RefreshCw, Globe, X
} from 'lucide-react';

// ─── PT File Vendor Field Extractor Helper ────────────────────────────────────
export const getVendorField = (vendor, ...keys) => {
  if (!vendor) return '';
  // 1. Direct property check
  for (const k of keys) {
    if (vendor[k] !== undefined && vendor[k] !== null && String(vendor[k]).trim() !== '' && vendor[k] !== 'GENERIC BRAND') {
      return vendor[k];
    }
  }
  // 2. Nested objects check (bankDetails, contacts, emails)
  if (vendor.bankDetails && typeof vendor.bankDetails === 'object') {
    for (const k of keys) {
      if (vendor.bankDetails[k] !== undefined && vendor.bankDetails[k] !== null && String(vendor.bankDetails[k]).trim() !== '') {
        return vendor.bankDetails[k];
      }
    }
  }
  if (vendor.contacts && typeof vendor.contacts === 'object') {
    for (const k of keys) {
      if (vendor.contacts[k] !== undefined && vendor.contacts[k] !== null && String(vendor.contacts[k]).trim() !== '') {
        return vendor.contacts[k];
      }
    }
  }
  if (vendor.emails && typeof vendor.emails === 'object') {
    for (const k of keys) {
      if (vendor.emails[k] !== undefined && vendor.emails[k] !== null && String(vendor.emails[k]).trim() !== '') {
        return vendor.emails[k];
      }
    }
  }
  // 3. vendorDataRow check (raw row from PT Excel import)
  if (vendor.vendorDataRow && typeof vendor.vendorDataRow === 'object') {
    for (const k of keys) {
      if (vendor.vendorDataRow[k] !== undefined && vendor.vendorDataRow[k] !== null && String(vendor.vendorDataRow[k]).trim() !== '') {
        return vendor.vendorDataRow[k];
      }
    }
    const vKeys = Object.keys(vendor.vendorDataRow);
    for (const k of keys) {
      const target = String(k).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const matched = vKeys.find(vk => String(vk).replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === target);
      if (matched && vendor.vendorDataRow[matched] !== undefined && vendor.vendorDataRow[matched] !== null && String(vendor.vendorDataRow[matched]).trim() !== '') {
        return vendor.vendorDataRow[matched];
      }
    }
  }
  return '';
};

// Helper to extract brand robustly from vendor, brandNames, or vendorDataRow
export const getVendorBrand = (vendor) => {
  if (!vendor) return '';
  if (vendor.brand && String(vendor.brand).trim() !== '' && vendor.brand !== 'GENERIC BRAND') {
    return String(vendor.brand).trim();
  }
  if (Array.isArray(vendor.brandNames) && vendor.brandNames.filter(b => b && b !== 'GENERIC BRAND').length > 0) {
    return vendor.brandNames.filter(b => b && b !== 'GENERIC BRAND').join(', ');
  }
  if (Array.isArray(vendor.brandsSupplied) && vendor.brandsSupplied.filter(b => b && b !== 'GENERIC BRAND').length > 0) {
    return vendor.brandsSupplied.filter(b => b && b !== 'GENERIC BRAND').join(', ');
  }
  const fromField = getVendorField(
    vendor,
    'BRAND NAME(S)', 'BRAND NAME', 'BRAND NAMES', 'BRAND', 'Brand', 'Brands',
    'Brand Name(s)', 'Brand Name', 'Brand(s)', 'BRANDS', 'BrandNames'
  );
  if (fromField && String(fromField).trim() !== '' && fromField !== 'GENERIC BRAND') {
    return String(fromField).trim();
  }
  const name = String(vendor.name || vendor.companyName || vendor.businessName || '');
  if (/^Rangoli/i.test(name)) return 'Rangoli';
  if (/^Mannat/i.test(name)) return 'Mannat Creation';
  if (/^Sneha/i.test(name)) return 'Sneha Silk';
  if (/^K\.?R/i.test(name)) return 'K.R. Chhabra';
  return '';
};

// ─── UNIFIED VENDOR CARD COMPONENT ───────────────────────────────────────────
function UnifiedVendorCard({ vendor, onBack, onEdit, onShare, showToast }) {
  const v = vendor || {};
  const gstin = v.gstin || getVendorField(v, 'GST NUMBER', 'GSTIN', 'Vendor GST', 'GST');
  const state = v.state || getVendorField(v, 'STATE', 'State', 'STAE');
  const city = v.city || getVendorField(v, 'CITY', 'City');
  const vendorCode = v.vendorCode || getVendorField(v, 'VENDOR CODE', 'Vendor Code', 'CODE');
  const subtitle = [gstin, state || city, vendorCode].filter(Boolean).join(' • ');

  const brandVal = getVendorBrand(v);
  const websiteVal = v.website || v.emails?.website || getVendorField(v, 'WEBSITE', 'Web Address', 'Website', 'URL', 'Web', 'SITE');
  const landlineVal = v.contacts?.landlineContact || v.landline || getVendorField(v, 'LANDLINE CONTACT', 'Landline', 'Landline Number');

  const renderValue = (val, isBoldPurple = false, isMono = false) => {
    if (!val || String(val).trim() === '' || val === 'N/A') {
      return <span className="italic text-slate-400 font-normal text-xs md:text-sm">not printed on this bill</span>;
    }
    return (
      <span className={`${isBoldPurple ? 'font-bold text-[#3b0764]' : 'text-slate-900 font-medium'} ${isMono ? 'font-mono' : ''} text-xs md:text-sm`}>
        {val}
      </span>
    );
  };

  // Dedicated Print Function: Opens clean isolated print window without sidebar/topbar
  const handlePrintCard = () => {
    const cardEl = document.getElementById('unified-vendor-card-print');
    if (!cardEl) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank', 'width=950,height=1000');
    if (!printWin) {
      window.print();
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Vendor Card - ${v.name || 'Vendor'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
            body { background: #ffffff; padding: 24px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { size: A4 portrait; margin: 10mm; }
            .card-wrapper { border: 2px solid #120326; border-radius: 12px; overflow: hidden; width: 100%; max-width: 850px; margin: 0 auto; box-shadow: none; }
            .header-banner { background-color: #120326 !important; color: #ffffff !important; padding: 18px 24px; }
            .header-title { font-size: 24px; font-weight: 900; color: #ffffff; }
            .header-sub { font-size: 12px; font-weight: 600; color: #e9d5ff; margin-top: 4px; }
            .section-header { background-color: #471277 !important; color: #ffffff !important; padding: 8px 16px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 8px; }
            table { width: 100%; border-collapse: collapse; }
            tr { border-bottom: 1px solid #e2e8f0; }
            td { padding: 9px 16px; font-size: 12px; vertical-align: middle; }
            td.label-cell { width: 220px; background-color: #f8fafc !important; color: #334155; font-weight: 600; border-right: 1px solid #e2e8f0; }
            .bold-purple { font-weight: 800; color: #3b0764; }
            .mono-text { font-family: 'JetBrains Mono', monospace; font-weight: 700; }
            .italic-placeholder { font-style: italic; color: #94a3b8; font-weight: normal; }
          </style>
        </head>
        <body>
          <div class="card-wrapper">
            <div class="header-banner">
              <div class="header-title">${v.name || 'Vendor Name'}</div>
              ${subtitle ? `<div class="header-sub">${subtitle}</div>` : ''}
            </div>

            <!-- IDENTITY -->
            <div class="section-header">IDENTITY</div>
            <table>
              <tr>
                <td class="label-cell">Vendor Name</td>
                <td><span class="bold-purple">${v.name || '<span class="italic-placeholder">not printed on this bill</span>'}</span></td>
              </tr>
              <tr>
                <td class="label-cell">Vendor Code</td>
                <td><span class="mono-text">${vendorCode || '<span class="italic-placeholder">not printed on this bill</span>'}</span></td>
              </tr>
              <tr>
                <td class="label-cell">Company Name</td>
                <td>${v.companyName || v.businessName || getVendorField(v, 'COMPANY NAME', 'Company Name') || v.name || '<span class="italic-placeholder">not printed on this bill</span>'}</td>
              </tr>
              <tr>
                <td class="label-cell">Brand Name(s)</td>
                <td>${brandVal || '<span class="italic-placeholder">not printed on this bill</span>'}</td>
              </tr>
              <tr>
                <td class="label-cell">GST Number</td>
                <td><span class="bold-purple mono-text">${gstin || '<span class="italic-placeholder">not printed on this bill</span>'}</span></td>
              </tr>
              <tr>
                <td class="label-cell">PAN Number</td>
                <td><span class="mono-text">${v.panNumber || getVendorField(v, 'PAN NUMBER', 'PAN') || (gstin && gstin.length >= 12 ? gstin.substring(2, 12) : '') || '<span class="italic-placeholder">not printed on this bill</span>'}</span></td>
              </tr>
              <tr>
                <td class="label-cell">State</td>
                <td>${state || getVendorField(v, 'STATE', 'State') || '<span class="italic-placeholder">not printed on this bill</span>'}</td>
              </tr>
              <tr>
                <td class="label-cell">State Code</td>
                <td><span class="mono-text">${v.stateCode || getVendorField(v, 'STATE CODE', 'State Code') || (gstin && gstin.length >= 2 ? gstin.substring(0, 2) : '') || '<span class="italic-placeholder">not printed on this bill</span>'}</span></td>
              </tr>
              <tr>
                <td class="label-cell">CIN</td>
                <td>${v.cin || getVendorField(v, 'CIN', 'CIN NO') || '<span class="italic-placeholder">not printed on this bill</span>'}</td>
              </tr>
              <tr>
                <td class="label-cell">UDYAM Reg. No</td>
                <td>${v.udyamNo || getVendorField(v, 'UDYAM REG. NO', 'UDYAM') || '<span class="italic-placeholder">not printed on this bill</span>'}</td>
              </tr>
            </table>

            <!-- ADDRESS -->
            <div class="section-header">ADDRESS</div>
            <table>
              <tr>
                <td class="label-cell">Office Address</td>
                <td>${v.address || getVendorField(v, 'OFFICE ADDRESS', 'Address') || '<span class="italic-placeholder">not printed on this bill</span>'}</td>
              </tr>
              <tr>
                <td class="label-cell">City</td>
                <td>${city || getVendorField(v, 'CITY', 'City') || '<span class="italic-placeholder">not printed on this bill</span>'}</td>
              </tr>
              <tr>
                <td class="label-cell">Pincode</td>
                <td><span class="mono-text">${v.pincode || getVendorField(v, 'PINCODE', 'Pincode') || '<span class="italic-placeholder">not printed on this bill</span>'}</span></td>
              </tr>
            </table>

            <!-- PHONE NUMBERS -->
            <div class="section-header">PHONE NUMBERS</div>
            <table>
              <tr>
                <td class="label-cell">Sales/General Contact</td>
                <td>${v.contacts?.salesContact || v.phone || getVendorField(v, 'SALES/GENERAL CONTACT', 'Sales Contact', 'Phone') || '<span class="italic-placeholder">not printed on this bill</span>'}</td>
              </tr>
              <tr>
                <td class="label-cell">Accounts Contact</td>
                <td>${v.contacts?.accountsContact || getVendorField(v, 'ACCOUNTS CONTACT', 'Accounts Contact') || '<span class="italic-placeholder">not printed on this bill</span>'}</td>
              </tr>
              <tr>
                <td class="label-cell">Dispatch Contact</td>
                <td>${v.contacts?.dispatchContact || getVendorField(v, 'DISPATCH CONTACT', 'Dispatch Contact') || '<span class="italic-placeholder">not printed on this bill</span>'}</td>
              </tr>
              <tr>
                <td class="label-cell">Appointment Contact</td>
                <td>${v.contacts?.appointmentContact || getVendorField(v, 'APPOINTMENT CONTACT', 'Appointment Contact') || '<span class="italic-placeholder">not printed on this bill</span>'}</td>
              </tr>
              <tr>
                <td class="label-cell">Landline Contact</td>
                <td>${landlineVal || '<span class="italic-placeholder">not printed on this bill</span>'}</td>
              </tr>
            </table>

            <!-- EMAIL & WEB ADDRESSES -->
            <div class="section-header">EMAIL & WEB ADDRESSES</div>
            <table>
              <tr>
                <td class="label-cell">Primary Email</td>
                <td>${v.emails?.primaryEmail || v.email || getVendorField(v, 'PRIMARY EMAIL', 'Email') || '<span class="italic-placeholder">not printed on this bill</span>'}</td>
              </tr>
              <tr>
                <td class="label-cell">Accounts Email</td>
                <td>${v.emails?.accountsEmail || getVendorField(v, 'ACCOUNTS EMAIL', 'Accounts Email') || '<span class="italic-placeholder">not printed on this bill</span>'}</td>
              </tr>
              <tr>
                <td class="label-cell">Dispatch Email</td>
                <td>${v.emails?.dispatchEmail || getVendorField(v, 'DISPATCH EMAIL', 'Dispatch Email') || '<span class="italic-placeholder">not printed on this bill</span>'}</td>
              </tr>
              <tr>
                <td class="label-cell">Website / Web Address</td>
                <td>${websiteVal || '<span class="italic-placeholder">not printed on this bill</span>'}</td>
              </tr>
            </table>

            <!-- BANKING DETAILS -->
            <div class="section-header">BANKING DETAILS</div>
            <table>
              <tr>
                <td class="label-cell">Bank Name</td>
                <td>${v.bankDetails?.bankName || getVendorField(v, 'BANK NAME', 'Bank') || '<span class="italic-placeholder">not printed on this bill</span>'}</td>
              </tr>
              <tr>
                <td class="label-cell">Account Number</td>
                <td><span class="mono-text">${v.bankDetails?.accountNumber || v.bankDetails?.accountNo || getVendorField(v, 'ACCOUNT NUMBER') || '<span class="italic-placeholder">not printed on this bill</span>'}</span></td>
              </tr>
              <tr>
                <td class="label-cell">IFSC Code</td>
                <td><span class="mono-text">${v.bankDetails?.ifscCode || getVendorField(v, 'IFSC CODE', 'IFSC') || '<span class="italic-placeholder">not printed on this bill</span>'}</span></td>
              </tr>
              <tr>
                <td class="label-cell">Branch Name</td>
                <td>${v.bankDetails?.branchName || v.bankDetails?.branch || getVendorField(v, 'BRANCH NAME') || '<span class="italic-placeholder">not printed on this bill</span>'}</td>
              </tr>
              <tr>
                <td class="label-cell">UPI ID</td>
                <td>${v.bankDetails?.upiId || v.upiId || getVendorField(v, 'UPI ID', 'UPI') || '<span class="italic-placeholder">not printed on this bill</span>'}</td>
              </tr>
            </table>

            <!-- TRANSPORT & LOGISTICS -->
            <div class="section-header">TRANSPORT & LOGISTICS</div>
            <table>
              <tr>
                <td class="label-cell">Preferred Transport</td>
                <td>${v.transport || getVendorField(v, 'PREFERRED TRANSPORT', 'TRANSPORT', 'Transport') || '<span class="italic-placeholder">not printed on this bill</span>'}</td>
              </tr>
              <tr style="border-bottom: none;">
                <td class="label-cell">Booking Station / Delivery Hub</td>
                <td>${v.station || getVendorField(v, 'STATION', 'Destination', 'Station') || '<span class="italic-placeholder">not printed on this bill</span>'}</td>
              </tr>
            </table>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          <\/script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleCopyCard = () => {
    const text = `VENDOR CARD
Vendor Name: ${v.name || 'N/A'}
Vendor Code: ${vendorCode || 'N/A'}
Company Name: ${v.companyName || v.businessName || v.name || 'N/A'}
Brand: ${brandVal || 'N/A'}
GSTIN: ${gstin || 'N/A'}
PAN: ${v.panNumber || 'N/A'}
State: ${state || 'N/A'} (${v.stateCode || ''})
Address: ${v.address || 'N/A'}, ${city || ''} - ${v.pincode || ''}
Phone: ${v.contacts?.salesContact || v.phone || 'N/A'} ${landlineVal ? `| Landline: ${landlineVal}` : ''}
Email: ${v.emails?.primaryEmail || v.email || 'N/A'} ${websiteVal ? `| Website: ${websiteVal}` : ''}
Bank: ${v.bankDetails?.bankName || 'N/A'} | A/C: ${v.bankDetails?.accountNumber || 'N/A'} | IFSC: ${v.bankDetails?.ifscCode || 'N/A'} | Branch: ${v.bankDetails?.branchName || 'N/A'}
Transport: ${v.transport || 'N/A'} | Station: ${v.station || 'N/A'}`;
    navigator.clipboard.writeText(text);
    if (showToast) showToast('Vendor Card details copied to clipboard!');
  };

  return (
    <div className="space-y-4 animate-fade-in font-sans">
      {/* Top Action & Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs no-print">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Vendor Directory
            </button>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-100 text-[#471277] text-xs font-black font-mono border border-purple-200">
            ⭐ VENDOR CARD
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onShare && onShare('Call')}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-indigo-200 transition"
          >
            <Phone className="w-3.5 h-3.5" /> Call
          </button>
          <button
            onClick={() => onShare && onShare('WhatsApp Message')}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-emerald-200 transition"
          >
            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
          </button>
          <button
            onClick={() => onShare && onShare('Email')}
            className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-sky-200 transition"
          >
            <Mail className="w-3.5 h-3.5" /> Email
          </button>
          <button
            onClick={handleCopyCard}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition"
          >
            <Copy className="w-3.5 h-3.5" /> Copy Card
          </button>
          <button
            onClick={handlePrintCard}
            className="px-3.5 py-1.5 bg-[#471277] hover:bg-[#3b0764] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" /> Print Card
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-purple-200 transition"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Vendor
            </button>
          )}
        </div>
      </div>

      {/* Main Unified Vendor Card */}
      <div id="unified-vendor-card-print" className="bg-white border-2 border-[#120326]/30 rounded-2xl overflow-hidden shadow-xl max-w-4xl mx-auto">
        {/* Dark Purple Top Header Banner */}
        <div className="bg-[#120326] text-white px-6 py-5 border-b border-purple-950">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            {v.name || 'Vendor Name'}
          </h2>
          {subtitle && (
            <p className="text-purple-200 text-xs md:text-sm font-semibold tracking-wide mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Section 1: IDENTITY */}
        <div className="border-b border-slate-200">
          <div className="bg-[#471277] text-white px-4 py-2.5 text-xs md:text-sm font-black uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4" /> IDENTITY
          </div>
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="w-1/3 md:w-60 bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">Vendor Name</td>
                <td className="px-4 py-2.5">{renderValue(v.name, true)}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">Vendor Code</td>
                <td className="px-4 py-2.5">{renderValue(vendorCode, false, true)}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">Company Name</td>
                <td className="px-4 py-2.5">{renderValue(v.companyName || v.businessName || v.name || getVendorField(v, 'COMPANY NAME', 'Company Name', 'Firm'))}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">Brand Name(s)</td>
                <td className="px-4 py-2.5">{renderValue(brandVal)}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">GST Number</td>
                <td className="px-4 py-2.5">{renderValue(gstin, true, true)}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">PAN Number</td>
                <td className="px-4 py-2.5">{renderValue(v.panNumber || getVendorField(v, 'PAN NUMBER', 'PAN') || (gstin && gstin.length >= 12 ? gstin.substring(2, 12) : null), false, true)}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">State</td>
                <td className="px-4 py-2.5">{renderValue(state || getVendorField(v, 'STATE', 'State'))}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">State Code</td>
                <td className="px-4 py-2.5">{renderValue(v.stateCode || getVendorField(v, 'STATE CODE', 'State Code') || (gstin && gstin.length >= 2 ? gstin.substring(0, 2) : null), false, true)}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">CIN</td>
                <td className="px-4 py-2.5">{renderValue(v.cin || getVendorField(v, 'CIN', 'CIN NO'))}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">UDYAM Reg. No</td>
                <td className="px-4 py-2.5">{renderValue(v.udyamNo || getVendorField(v, 'UDYAM REG. NO', 'UDYAM', 'UDYAM NO'))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: ADDRESS */}
        <div className="border-b border-slate-200">
          <div className="bg-[#471277] text-white px-4 py-2.5 text-xs md:text-sm font-black uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4" /> ADDRESS
          </div>
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="w-1/3 md:w-60 bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">Office Address</td>
                <td className="px-4 py-2.5">{renderValue(v.address || getVendorField(v, 'OFFICE ADDRESS', 'Address'))}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">City</td>
                <td className="px-4 py-2.5">{renderValue(city || getVendorField(v, 'CITY', 'City'))}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">Pincode</td>
                <td className="px-4 py-2.5">{renderValue(v.pincode || getVendorField(v, 'PINCODE', 'Pincode', 'PIN'), false, true)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: PHONE NUMBERS */}
        <div className="border-b border-slate-200">
          <div className="bg-[#471277] text-white px-4 py-2.5 text-xs md:text-sm font-black uppercase tracking-wider flex items-center gap-2">
            <Phone className="w-4 h-4" /> PHONE NUMBERS
          </div>
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="w-1/3 md:w-60 bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">Sales/General Contact</td>
                <td className="px-4 py-2.5">{renderValue(v.contacts?.salesContact || v.phone || getVendorField(v, 'SALES/GENERAL CONTACT', 'Sales Contact', 'Phone'))}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">Accounts Contact</td>
                <td className="px-4 py-2.5">{renderValue(v.contacts?.accountsContact || getVendorField(v, 'ACCOUNTS CONTACT', 'Accounts Contact'))}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">Dispatch Contact</td>
                <td className="px-4 py-2.5">{renderValue(v.contacts?.dispatchContact || getVendorField(v, 'DISPATCH CONTACT', 'Dispatch Contact'))}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">Appointment Contact</td>
                <td className="px-4 py-2.5">{renderValue(v.contacts?.appointmentContact || getVendorField(v, 'APPOINTMENT CONTACT', 'Appointment Contact'))}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">Landline Contact</td>
                <td className="px-4 py-2.5">{renderValue(landlineVal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 4: EMAIL & WEB ADDRESSES */}
        <div className="border-b border-slate-200">
          <div className="bg-[#471277] text-white px-4 py-2.5 text-xs md:text-sm font-black uppercase tracking-wider flex items-center gap-2">
            <Mail className="w-4 h-4" /> EMAIL & WEB ADDRESSES
          </div>
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="w-1/3 md:w-60 bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">Primary Email</td>
                <td className="px-4 py-2.5">{renderValue(v.emails?.primaryEmail || v.email || getVendorField(v, 'PRIMARY EMAIL', 'Primary Email', 'Email'))}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">Accounts Email</td>
                <td className="px-4 py-2.5">{renderValue(v.emails?.accountsEmail || getVendorField(v, 'ACCOUNTS EMAIL', 'Accounts Email'))}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">Dispatch Email</td>
                <td className="px-4 py-2.5">{renderValue(v.emails?.dispatchEmail || getVendorField(v, 'DISPATCH EMAIL', 'Dispatch Email'))}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">Website / Web Address</td>
                <td className="px-4 py-2.5">{renderValue(websiteVal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 5: BANKING DETAILS */}
        <div className="border-b border-slate-200">
          <div className="bg-[#471277] text-white px-4 py-2.5 text-xs md:text-sm font-black uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> BANKING DETAILS
          </div>
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="w-1/3 md:w-60 bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">Bank Name</td>
                <td className="px-4 py-2.5">{renderValue(v.bankDetails?.bankName || getVendorField(v, 'BANK NAME', 'Bank Name', 'Bank'))}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">Account Number</td>
                <td className="px-4 py-2.5">{renderValue(v.bankDetails?.accountNumber || v.bankDetails?.accountNo || getVendorField(v, 'ACCOUNT NUMBER', 'ACCOUNT NO'), false, true)}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">IFSC Code</td>
                <td className="px-4 py-2.5">{renderValue(v.bankDetails?.ifscCode || getVendorField(v, 'IFSC CODE', 'IFSC'), false, true)}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">Branch Name</td>
                <td className="px-4 py-2.5">{renderValue(v.bankDetails?.branchName || v.bankDetails?.branch || getVendorField(v, 'BRANCH NAME', 'BRANCH'))}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">UPI ID</td>
                <td className="px-4 py-2.5">{renderValue(v.bankDetails?.upiId || v.upiId || getVendorField(v, 'UPI ID', 'UPI'))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 6: TRANSPORT & LOGISTICS */}
        <div>
          <div className="bg-[#471277] text-white px-4 py-2.5 text-xs md:text-sm font-black uppercase tracking-wider flex items-center gap-2">
            <Tag className="w-4 h-4" /> TRANSPORT & LOGISTICS
          </div>
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b border-slate-200 hover:bg-purple-50/20">
                <td className="w-1/3 md:w-60 bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">Preferred Transport</td>
                <td className="px-4 py-2.5">{renderValue(v.transport || getVendorField(v, 'PREFERRED TRANSPORT', 'TRANSPORT', 'Transport'))}</td>
              </tr>
              <tr className="hover:bg-purple-50/20">
                <td className="bg-slate-50/60 text-slate-700 font-medium px-4 py-2.5 text-xs md:text-sm border-r border-slate-200">Booking Station / Delivery Hub</td>
                <td className="px-4 py-2.5">{renderValue(v.station || getVendorField(v, 'STATION', 'Destination', 'Station'))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN VENDOR COMMUNICATION CARD VIEW ───────────────────────────────────────
export default function VendorCommunicationCard({ currentUser }) {
  const [vendorList, setVendorList] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [hubData, setHubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'detail'
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);

  // Add / Edit Vendor Modal State
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [isEditingVendor, setIsEditingVendor] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [newVendorForm, setNewVendorForm] = useState({
    name: '',
    businessName: '',
    phone: '',
    landline: '',
    email: '',
    website: '',
    gstin: '',
    panNumber: '',
    businessType: '',
    rating: 0,
    brandsSuppliedStr: '',
    address: '',
    city: '',
    state: '',
    stateCode: '',
    pincode: '',
    bankName: '',
    accountHolder: '',
    accountNo: '',
    ifscCode: '',
    branch: '',
    upiId: '',
    outstandingBalance: 0,
    transport: '',
    station: ''
  });

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Fetch Vendors from MongoDB API
  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/vendors`);
      const data = res.data;
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setVendorList(data.data);
        setSelectedVendorId(prev => prev || data.data[0]._id);
      } else {
        setVendorList([]);
        setSelectedVendorId(null);
      }
    } catch (err) {
      console.error('fetchVendors failed:', err);
      setVendorList([]);
      setSelectedVendorId(null);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Selected Vendor Communication Record
  const fetchVendorHub = async (vId) => {
    if (!vId) {
      setHubData(null);
      return;
    }
    const currentVendorDoc = vendorList.find(v => String(v._id) === String(vId)) || {};

    try {
      const res = await api.get(`/vendors/${vId}`);
      if (res.ok || res.status === 200) {
        const data = res.data;
        if (data.success && data.data) {
          setHubData({
            ...data.data,
            vendor: { ...currentVendorDoc, ...(data.data.vendor || data.data) }
          });
          return;
        }
      }
    } catch (err) { }

    setHubData({
      vendor: currentVendorDoc
    });
  };

  const handleSelectVendor = (vId) => {
    const directDoc = vendorList.find(v => String(v._id) === String(vId));
    setSelectedVendorId(vId);
    if (directDoc) {
      setHubData({ vendor: directDoc });
    } else {
      setHubData(null);
    }
    setViewMode('detail');
    fetchVendorHub(vId);
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (selectedVendorId) {
      fetchVendorHub(selectedVendorId);
    }
  }, [selectedVendorId]);

  // Handle Direct Share / Call / WhatsApp / Email
  const handleOpenShareModal = (channel) => {
    const selectedVendorDoc = vendorList.find(v => String(v._id) === String(selectedVendorId));
    const v = (hubData?.vendor && String(hubData.vendor._id || hubData.vendor.id) === String(selectedVendorId))
      ? { ...(selectedVendorDoc || {}), ...hubData.vendor }
      : (selectedVendorDoc || vendorList[0] || {});
    const phone = v.phone || v.contacts?.salesContact || '';
    const email = v.email || v.emails?.primaryEmail || '';

    if (channel === 'Call') {
      if (!phone) {
        showToast('No phone number on record for this vendor', 'error');
        return;
      }
      window.open(`tel:${phone.replace(/[^0-9+]/g, '')}`, '_self');
      showToast(`Calling ${v.name}: ${phone}`);
    } else if (channel === 'WhatsApp Message') {
      if (!phone) {
        showToast('No WhatsApp / phone number on record', 'error');
        return;
      }
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      const text = `Hello ${v.name},\n\nThis is regarding our vendor communication record from Vastra ERP.`;
      window.open(`https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(text)}`, '_blank');
      showToast(`Opened WhatsApp chat with ${v.name}`);
    } else if (channel === 'Email') {
      if (!email) {
        showToast('No email address on record for this vendor', 'error');
        return;
      }
      window.open(`mailto:${email}?subject=Vendor Inquiry - ${encodeURIComponent(v.name)}`, '_self');
      showToast(`Opened email client for ${email}`);
    }
  };

  // Create or Update Vendor in MongoDB
  const handleCreateNewVendor = async (e) => {
    e.preventDefault();
    if (!newVendorForm.name || !newVendorForm.phone) {
      showToast('Please enter vendor name and phone number', 'error');
      return;
    }

    const payload = {
      name: newVendorForm.name,
      companyName: newVendorForm.businessName,
      brand: newVendorForm.brandsSuppliedStr ? newVendorForm.brandsSuppliedStr.split(',')[0].trim() : undefined,
      brandNames: newVendorForm.brandsSuppliedStr
        ? newVendorForm.brandsSuppliedStr.split(',').map(b => b.trim()).filter(Boolean)
        : [],
      brandsSupplied: newVendorForm.brandsSuppliedStr
        ? newVendorForm.brandsSuppliedStr.split(',').map(b => b.trim()).filter(Boolean)
        : [],
      phone: newVendorForm.phone,
      landline: newVendorForm.landline,
      email: newVendorForm.email,
      website: newVendorForm.website,
      gstin: newVendorForm.gstin,
      panNumber: newVendorForm.panNumber,
      businessType: newVendorForm.businessType,
      rating: newVendorForm.rating,
      address: newVendorForm.address,
      city: newVendorForm.city,
      state: newVendorForm.state,
      stateCode: newVendorForm.stateCode,
      pincode: newVendorForm.pincode,
      contacts: {
        salesContact: newVendorForm.phone,
        landlineContact: newVendorForm.landline
      },
      emails: {
        primaryEmail: newVendorForm.email,
        website: newVendorForm.website
      },
      transport: newVendorForm.transport,
      station: newVendorForm.station,
      bankDetails: {
        bankName: newVendorForm.bankName,
        accountNumber: newVendorForm.accountNo,
        ifscCode: newVendorForm.ifscCode,
        branchName: newVendorForm.branch || `${newVendorForm.city || ''} Branch`.trim(),
        upiId: newVendorForm.upiId
      }
    };

    try {
      let res;
      if (isEditingVendor && editingVendorId) {
        res = await api.put(`/vendors/${editingVendorId}`, payload);
      } else {
        res = await api.post(`/vendors`, payload);
      }

      const data = res.data;
      if (data.success && data.data) {
        showToast(`✅ Vendor "${data.data.name}" ${isEditingVendor ? 'updated' : 'created'} successfully!`);
        setShowAddVendorModal(false);
        setIsEditingVendor(false);
        setEditingVendorId(null);
        setNewVendorForm({
          name: '', businessName: '', phone: '', landline: '', email: '', website: '', gstin: '', panNumber: '',
          businessType: '', rating: 0,
          brandsSuppliedStr: '', address: '', city: '', state: '', stateCode: '', pincode: '',
          bankName: '', accountHolder: '', accountNo: '', ifscCode: '', branch: '', upiId: '',
          outstandingBalance: 0,
          transport: '', station: ''
        });
        await fetchVendors();
        setSelectedVendorId(data.data._id);
        setViewMode('detail');
      } else {
        console.error('createVendor API error:', data);
        showToast(data.message || 'Error creating vendor', 'error');
      }
    } catch (err) {
      console.error('createVendor network error:', err);
      showToast('Network error — is the backend server running?', 'error');
    }
  };

  const handleEditVendorClick = (e, vendorToEdit) => {
    e.stopPropagation();
    setIsEditingVendor(true);
    setEditingVendorId(vendorToEdit._id);
    setNewVendorForm({
      name: vendorToEdit.name || '',
      businessName: vendorToEdit.companyName || vendorToEdit.businessName || '',
      phone: vendorToEdit.phone || vendorToEdit.contacts?.salesContact || '',
      landline: vendorToEdit.landline || vendorToEdit.contacts?.landlineContact || getVendorField(vendorToEdit, 'LANDLINE CONTACT', 'Landline') || '',
      email: vendorToEdit.email || vendorToEdit.emails?.primaryEmail || '',
      website: vendorToEdit.website || vendorToEdit.emails?.website || getVendorField(vendorToEdit, 'WEBSITE', 'Web Address', 'Website') || '',
      gstin: vendorToEdit.gstin || getVendorField(vendorToEdit, 'GST NUMBER', 'GSTIN') || '',
      panNumber: vendorToEdit.panNumber || getVendorField(vendorToEdit, 'PAN NUMBER', 'PAN') || '',
      businessType: vendorToEdit.businessType || '',
      rating: vendorToEdit.rating || 4.5,
      brandsSuppliedStr: getVendorBrand(vendorToEdit),
      address: vendorToEdit.address || getVendorField(vendorToEdit, 'OFFICE ADDRESS', 'Address') || '',
      city: vendorToEdit.city || getVendorField(vendorToEdit, 'CITY', 'City') || '',
      state: vendorToEdit.state || getVendorField(vendorToEdit, 'STATE', 'State') || '',
      stateCode: vendorToEdit.stateCode || getVendorField(vendorToEdit, 'STATE CODE', 'State Code') || '',
      pincode: vendorToEdit.pincode || getVendorField(vendorToEdit, 'PINCODE', 'Pincode') || '',
      bankName: vendorToEdit.bankDetails?.bankName || getVendorField(vendorToEdit, 'BANK NAME', 'Bank') || '',
      accountNo: vendorToEdit.bankDetails?.accountNumber || vendorToEdit.bankDetails?.accountNo || getVendorField(vendorToEdit, 'ACCOUNT NUMBER') || '',
      ifscCode: vendorToEdit.bankDetails?.ifscCode || getVendorField(vendorToEdit, 'IFSC CODE') || '',
      branch: vendorToEdit.bankDetails?.branchName || vendorToEdit.bankDetails?.branch || '',
      upiId: vendorToEdit.bankDetails?.upiId || vendorToEdit.upiId || '',
      outstandingBalance: vendorToEdit.openingBalance || 0,
      transport: vendorToEdit.transport || getVendorField(vendorToEdit, 'PREFERRED TRANSPORT', 'TRANSPORT') || '',
      station: vendorToEdit.station || getVendorField(vendorToEdit, 'STATION') || ''
    });
    setShowAddVendorModal(true);
  };

  const handleDeleteVendor = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this vendor? This cannot be undone.')) return;
    try {
      const res = await api.delete(`/vendors/${id}`);
      if (res.data.success) {
        showToast('Vendor deleted successfully', 'success');
        setVendorList(vendorList.filter(v => v._id !== id));
        if (selectedVendorId === id) {
          setViewMode('list');
          setSelectedVendorId(null);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to delete vendor', 'error');
    }
  };

  const selectedVendorDoc = vendorList.find(v => String(v._id) === String(selectedVendorId));
  const activeVendor = (hubData?.vendor && String(hubData.vendor._id || hubData.vendor.id) === String(selectedVendorId))
    ? { ...(selectedVendorDoc || {}), ...hubData.vendor }
    : (selectedVendorDoc || vendorList[0] || {});

  const filteredVendors = vendorList.filter(v =>
    (v.name && v.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (v.vendorCode && v.vendorCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (v.companyName && v.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (v.businessName && v.businessName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (v.brand && v.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (v.gstin && v.gstin.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (getVendorBrand(v).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12 animate-fade-in bg-slate-50/60 p-4 md:p-6 rounded-2xl min-h-screen text-slate-800">

      {/* Toast Alert */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-bold border no-print ${notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
          <AlertCircle className="w-4 h-4" />
          <span>{notification.msg}</span>
        </div>
      )}

      {/* TOP HEADER BAR */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-[#471277]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                Vendor Communication Card
              </h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#471277] border border-purple-200 uppercase tracking-wide">
                Master Card
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Unified vendor information master combining Vendor Card and Vendor Data
            </p>
          </div>
        </div>

        {/* Global Search, Selector & Add Vendor */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendor name, code, brand, GST..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <button
            onClick={() => {
              setIsEditingVendor(false);
              setEditingVendorId(null);
              setNewVendorForm({
                name: '', businessName: '', phone: '', landline: '', email: '', website: '', gstin: '', panNumber: '',
                businessType: '', rating: 0,
                brandsSuppliedStr: '', address: '', city: '', state: '', stateCode: '', pincode: '',
                bankName: '', accountHolder: '', accountNo: '', ifscCode: '', branch: '', upiId: '',
                outstandingBalance: 0,
                transport: '', station: ''
              });
              setShowAddVendorModal(true);
            }}
            className="bg-[#471277] hover:bg-[#3b0764] text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Add New Vendor
          </button>
        </div>
      </div>

      {/* ─── DIRECTORY LIST MODE ─── */}
      {viewMode === 'list' ? (
        <div className="space-y-4 animate-fade-in text-sm">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-800">Vendor Master Directory</h2>
                <p className="text-slate-500 font-medium text-xs">
                  Click on any vendor to view their unified Vendor Card.
                </p>
              </div>
              <div className="text-xs font-bold text-slate-500">
                Total Vendors: <strong className="text-[#471277] font-mono">{filteredVendors.length}</strong>
              </div>
            </div>
          </div>

          {/* Directory Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                    <th className="p-4 w-28">Vendor Code</th>
                    <th className="p-4 w-56">Supplier Name</th>
                    <th className="p-4 w-40">Brand Name(s)</th>
                    <th className="p-4 w-48">GSTIN / PAN</th>
                    <th className="p-4 w-52">Primary Contact</th>
                    <th className="p-4">Office Address</th>
                    <th className="p-4 text-center w-44">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-16 text-center text-[#471277] font-bold">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <RefreshCw className="w-8 h-8 animate-spin text-[#471277]" />
                          <span className="text-sm font-semibold text-slate-600">Loading Vendor Cards...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredVendors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400 italic font-bold">
                        {searchQuery ? "No vendors found matching your search." : "No vendor communication cards present."}
                      </td>
                    </tr>
                  ) : (
                    filteredVendors.map((v) => {
                      const brandText = getVendorBrand(v);
                      return (
                        <tr
                          key={v._id}
                          onClick={() => handleSelectVendor(v._id)}
                          className="hover:bg-purple-50/40 transition cursor-pointer group"
                        >
                          <td className="p-4 font-mono font-bold text-slate-500">{v.vendorCode || '—'}</td>
                          <td className="p-4 font-bold text-[#3b0764] group-hover:underline text-[15px]">
                            {v.name}
                          </td>
                          <td className="p-4 text-slate-800 font-bold text-xs">
                            {brandText ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-[#471277] font-bold border border-purple-200">
                                {brandText}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic font-normal">—</span>
                            )}
                          </td>
                          <td className="p-4 font-mono text-xs">
                            <div className="font-bold text-[#471277]">{v.gstin || getVendorField(v, 'GST NUMBER', 'GSTIN') || '—'}</div>
                            <div className="text-slate-400 font-normal">{v.panNumber || getVendorField(v, 'PAN NUMBER', 'PAN') || '—'}</div>
                          </td>
                          <td className="p-4 text-slate-600 text-xs">
                            <div className="font-bold text-slate-800">{v.phone || v.contacts?.salesContact || '—'}</div>
                            <div className="text-slate-400 font-normal">{v.email || v.emails?.primaryEmail || '—'}</div>
                          </td>
                          <td className="p-4 text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[240px] text-xs" title={v.address}>
                            {v.address || '—'}
                          </td>
                          <td className="p-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleSelectVendor(v._id)}
                                className="px-3 py-1.5 bg-[#471277] hover:bg-[#3b0764] text-white font-black rounded-xl transition text-xs flex items-center gap-1.5 shadow-sm"
                                title="View Vendor Card"
                              >
                                <Eye className="w-3.5 h-3.5" /> View Card ➜
                              </button>
                              <button
                                onClick={(e) => handleEditVendorClick(e, v)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition shadow-sm border border-transparent hover:border-indigo-100"
                                title="Edit Vendor"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteVendor(e, v._id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition shadow-sm border border-transparent hover:border-red-100"
                                title="Delete Vendor"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ─── DETAIL VIEW MODE (SINGLE UNIFIED VENDOR CARD) ─── */
        <UnifiedVendorCard
          vendor={activeVendor}
          onBack={() => setViewMode('list')}
          onEdit={(e) => handleEditVendorClick(e, activeVendor)}
          onShare={handleOpenShareModal}
          showToast={showToast}
        />
      )}

      {/* MODAL: ADD / EDIT VENDOR */}
      {showAddVendorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-2xl space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 text-[#471277] rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-800">
                  {isEditingVendor ? 'Edit Vendor Details' : 'Add New Vendor'}
                </h3>
              </div>
              <button onClick={() => { setShowAddVendorModal(false); setIsEditingVendor(false); setEditingVendorId(null); }} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewVendor} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 font-bold block mb-1">Vendor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rangoli Enterprises"
                    value={newVendorForm.name}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rangoli Enterprises Pvt. Ltd."
                    value={newVendorForm.businessName}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, businessName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">Brand Name(s)</label>
                  <input
                    type="text"
                    placeholder="e.g. Rangoli"
                    value={newVendorForm.brandsSuppliedStr}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, brandsSuppliedStr: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">Mobile / Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={newVendorForm.phone}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">Landline Contact</label>
                  <input
                    type="text"
                    placeholder="e.g. 011-45033202"
                    value={newVendorForm.landline}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, landline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">Primary Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. orders@rangoli.com"
                    value={newVendorForm.email}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">Website / Web Address</label>
                  <input
                    type="text"
                    placeholder="e.g. www.rangolienterprises.com"
                    value={newVendorForm.website}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, website: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="md:col-span-2 lg:col-span-4">
                  <label className="text-slate-500 font-bold block mb-1">Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 671, Gali Ghanteshwar, Katra Neel, Chandni Chowk"
                    value={newVendorForm.address}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="text-slate-500 font-bold block mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Delhi"
                    value={newVendorForm.city}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Delhi"
                    value={newVendorForm.state}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, state: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">State Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 07"
                    value={newVendorForm.stateCode}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, stateCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">Pincode</label>
                  <input
                    type="text"
                    placeholder="e.g. 110006"
                    value={newVendorForm.pincode}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, pincode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <div>
                  <label className="text-slate-500 font-bold block mb-1">GST Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 07ADRPA1640C1Z2"
                    value={newVendorForm.gstin}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, gstin: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-purple-500 uppercase"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">PAN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. ADRPA1640C"
                    value={newVendorForm.panNumber}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, panNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-purple-500 uppercase"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank"
                    value={newVendorForm.bankName}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, bankName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">Account Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 50200061941770"
                    value={newVendorForm.accountNo}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, accountNo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC0000217"
                    value={newVendorForm.ifscCode}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, ifscCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">Branch Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Chandni Chowk"
                    value={newVendorForm.branch}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, branch: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">UPI ID</label>
                  <input
                    type="text"
                    placeholder="e.g. vendor@upi"
                    value={newVendorForm.upiId}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, upiId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">Preferred Transport</label>
                  <input
                    type="text"
                    placeholder="e.g. Jaipur Golden Transport"
                    value={newVendorForm.transport}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, transport: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">Booking Station / Hub</label>
                  <input
                    type="text"
                    placeholder="e.g. Delhi Hub"
                    value={newVendorForm.station}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, station: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => { setShowAddVendorModal(false); setIsEditingVendor(false); setEditingVendorId(null); }} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-[#471277] text-white rounded-xl font-black hover:bg-[#3b0764] shadow-sm">
                  {isEditingVendor ? 'Save Changes' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
