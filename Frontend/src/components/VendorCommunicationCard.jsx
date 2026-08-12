import api from '../api/axios';
import React, { useState, useEffect } from 'react';
import {
  Building2, Phone, Mail, MessageSquare, FileText, Calendar, DollarSign,
  Star, ShieldCheck, Copy, ExternalLink, Download, Eye, Plus, CheckCircle2,
  Clock, AlertCircle, Search, Filter, Share2, Upload, Trash2, Edit3,
  UserCheck, MapPin, CreditCard, FileCheck, Tag, ArrowRight, RefreshCw,
  Send, Lock, Bookmark, Paperclip, ChevronRight, X, Printer, ArrowLeft
} from 'lucide-react';

const DEFAULT_FALLBACK_VENDORS = [];


// ─── OutstandingTab Sub-Component ──────────────────────────────────────────
const DEMO_INVOICES = [];

const INV_STATUS_STYLE = {
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Partial: 'bg-amber-50 text-amber-700 border-amber-200',
  Unpaid: 'bg-red-50 text-red-700 border-red-200',
};

function OutstandingTab({ vendor, hubData, showToast, handleOpenShareModal }) {
  // Detect if this is a real MongoDB vendor (ObjectId) or a local demo fallback
  const isRealVendor = vendor?._id && !String(vendor._id).startsWith('demo-');
  // hubData !== null means the API has responded (even if empty)
  const hubLoaded = hubData !== null;

  const mapInvoices = (list) => (list || []).map(inv => ({
    id: inv.invoiceNo || inv._id,
    date: inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    billAmount: inv.grandTotal || 0,
    amountPaid: inv.amountPaid || 0,
    outstanding: inv.outstandingAmount ?? Math.max(0, (inv.grandTotal || 0) - (inv.amountPaid || 0)),
    status: inv.paymentStatus || (inv.amountPaid >= inv.grandTotal ? 'Paid' : inv.amountPaid > 0 ? 'Partial' : 'Unpaid'),
    dueDate: inv.dueDate,
    _id: inv._id
  }));

  // Initial state: demo data for demo vendors, real data for real vendors
  const [invoices, setInvoices] = useState([]);
  const [payModal, setPayModal] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', mode: 'Bank Transfer', referenceNo: '', remarks: '' });

  // Sync whenever hubData changes (API responds)
  useEffect(() => {
    if (!hubLoaded) return;
    const mapped = mapInvoices(hubData?.purchaseHistory?.invoices);
    if (mapped.length > 0) {
      setInvoices(mapped);
    } else if (isRealVendor) {
      setInvoices([]); // Real vendor with no invoices → show empty state
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hubData]);

  const totalOutstanding = invoices.reduce((s, inv) => s + inv.outstanding, 0);

  const openPayModal = (inv) => {
    setPayModal(inv);
    setPayForm({ amount: inv.outstanding, mode: 'Bank Transfer', referenceNo: '', remarks: '' });
  };

  const handleConfirmPayment = (e) => {
    e.preventDefault();
    const paid = Number(payForm.amount);
    if (!paid || paid <= 0) { showToast('Enter a valid payment amount', 'error'); return; }
    if (paid > payModal.outstanding) { showToast('Amount exceeds outstanding balance', 'error'); return; }

    setInvoices(prev => prev.map(inv => {
      if (inv.id !== payModal.id) return inv;
      const newPaid = inv.amountPaid + paid;
      const newOutstanding = inv.billAmount - newPaid;
      const newStatus = newOutstanding <= 0 ? 'Paid' : 'Partial';
      return { ...inv, amountPaid: newPaid, outstanding: Math.max(0, newOutstanding), status: newStatus };
    }));

    showToast(`✅ Payment of ₹${paid.toLocaleString('en-IN')} recorded for ${payModal.id}!`);
    setPayModal(null);
  };

  return (
    <div className="space-y-5 animate-fade-in text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-2">
        <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider">
          Financial Outstanding & Settlement Ledger
        </h3>
        <button
          onClick={() => handleOpenShareModal('Ledger Statement', 'STMT-2026-001')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1 shadow-sm"
        >
          <FileCheck className="w-3.5 h-3.5" /> Share Ledger Statement
        </button>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-1">
          <span className="text-red-500 font-bold block">Total Outstanding</span>
          <span className="text-xl font-black text-red-600 font-mono">₹{(hubData?.outstanding?.totalOutstanding ?? totalOutstanding).toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
          <span className="text-slate-400 font-bold block">Credit Limit</span>
          <span className="text-lg font-black text-slate-800 font-mono">₹{(vendor?.creditLimit || hubData?.outstanding?.creditLimit || 0).toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
          <span className="text-slate-400 font-bold block">Credit Terms</span>
          <span className="text-lg font-bold text-slate-700">{vendor?.paymentTerms || hubData?.outstanding?.paymentTerms || 'Net 30'} ({vendor?.creditDays || hubData?.outstanding?.creditDays || 30} Days)</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-1">
          <span className="text-emerald-600 font-bold block">Last Payment</span>
          <span className="text-sm font-bold text-emerald-700">
            {hubData?.outstanding?.lastPaymentDate
              ? new Date(hubData.outstanding.lastPaymentDate).toLocaleDateString('en-IN')
              : 'No payments yet'}
          </span>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="space-y-2">
        <span className="font-bold text-slate-700 block">Pending Vendor Invoices & Payment Ledger:</span>
        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-100 text-slate-500 font-mono text-[11px] uppercase">
              <tr>
                <th className="p-3">Invoice #</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Bill Amount</th>
                <th className="p-3 text-right">Paid Amount</th>
                <th className="p-3 text-right">Outstanding</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <FileCheck className="w-8 h-8 opacity-30" />
                      <span className="font-bold text-sm">No purchase invoices yet</span>
                      <span className="text-xs">Invoices from the Purchase module will appear here automatically</span>
                    </div>
                  </td>
                </tr>
              ) : invoices.map((inv) => (
                <tr key={inv.id} className={`hover:bg-white transition-colors ${inv.status === 'Unpaid' ? 'bg-red-50/20' : ''}`}>
                  <td className="p-3 font-mono font-bold text-indigo-600">{inv.id}</td>
                  <td className="p-3 font-mono text-slate-500">{inv.date}</td>
                  <td className="p-3 text-right font-mono font-bold">₹{inv.billAmount.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right font-mono text-emerald-600 font-bold">₹{inv.amountPaid.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right font-mono font-black text-red-600">₹{inv.outstanding.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${INV_STATUS_STYLE[inv.status]}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {inv.status !== 'Paid' ? (
                      <button
                        onClick={() => openPayModal(inv)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg shadow-sm transition flex items-center gap-1 mx-auto"
                      >
                        <DollarSign className="w-3 h-3" /> Pay
                      </button>
                    ) : (
                      <span className="text-emerald-600 font-bold text-[10px] flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 border-t-2 border-slate-200">
              <tr>
                <td colSpan={4} className="p-3 text-right font-black text-slate-700">Total Outstanding Balance:</td>
                <td className="p-3 text-right font-black text-red-600 font-mono">₹{totalOutstanding.toLocaleString('en-IN')}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {payModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Record Payment</h3>
                  <p className="text-[10px] font-mono text-indigo-600 font-bold">{payModal.id} — {vendor?.name}</p>
                </div>
              </div>
              <button onClick={() => setPayModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Invoice Summary */}
            <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div>
                <span className="text-slate-400 block font-medium">Bill Amount</span>
                <span className="font-black text-slate-800 text-sm">₹{payModal.billAmount.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Already Paid</span>
                <span className="font-black text-emerald-600 text-sm">₹{payModal.amountPaid.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Outstanding</span>
                <span className="font-black text-red-600 text-sm">₹{payModal.outstanding.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handleConfirmPayment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={payModal.outstanding}
                  step="0.01"
                  value={payForm.amount}
                  onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-mono font-black text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Enter amount"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Payment Mode *</label>
                  <select
                    value={payForm.mode}
                    onChange={e => setPayForm(p => ({ ...p, mode: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    {['Bank Transfer', 'NEFT', 'RTGS', 'UPI', 'Cheque', 'Cash', 'Other'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Reference / UTR No.</label>
                  <input
                    type="text"
                    value={payForm.referenceNo}
                    onChange={e => setPayForm(p => ({ ...p, referenceNo: e.target.value }))}
                    placeholder="UTR / Cheque / UPI Ref"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Remarks</label>
                <input
                  type="text"
                  value={payForm.remarks}
                  onChange={e => setPayForm(p => ({ ...p, remarks: e.target.value }))}
                  placeholder="Optional payment remarks..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Live remaining balance preview */}
              {payForm.amount > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                  <span className="font-bold text-emerald-700">Remaining after this payment:</span>
                  <span className="text-lg font-black text-emerald-700 font-mono">
                    ₹{Math.max(0, payModal.outstanding - Number(payForm.amount)).toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setPayModal(null)} className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-sm flex items-center gap-2 transition"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PurchaseTab Sub-Component ─────────────────────────────────────────────
const DEMO_PURCHASE_ORDERS = [
  { id: 'PO-2026-081', date: '2026-07-20', items: 'Cotton Fabric 500M, Linen Shirting 200M', qty: 700, unit: 'Meters', rate: 120, amount: 84000, status: 'Received', grnStatus: 'GRN Done', invoiceNo: 'INV-2026-081' },
  { id: 'PO-2026-074', date: '2026-07-10', items: 'Raymond Suiting 300M', qty: 300, unit: 'Meters', rate: 180, amount: 54000, status: 'Partially Received', grnStatus: 'Pending', invoiceNo: 'INV-2026-074' },
  { id: 'PO-2026-068', date: '2026-06-28', items: 'Linen Club Fabric 400M', qty: 400, unit: 'Meters', rate: 160, amount: 64000, status: 'Received', grnStatus: 'GRN Done', invoiceNo: 'INV-2026-068' },
  { id: 'PO-2026-059', date: '2026-06-15', items: 'Cotton Bale 20 Units', qty: 20, unit: 'Bales', rate: 1500, amount: 30000, status: 'Cancelled', grnStatus: '—', invoiceNo: '—' },
];

const STATUS_COLORS = {
  'Received': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Partially Received': 'bg-amber-50 text-amber-700 border-amber-200',
  'Pending': 'bg-blue-50 text-blue-700 border-blue-200',
  'Cancelled': 'bg-red-50 text-red-700 border-red-200',
};

function PurchaseTab({ vendor, showToast, handleOpenShareModal, hubData }) {
  const isRealVendor = vendor?._id && !String(vendor._id).startsWith('demo-');
  const hubLoaded = hubData !== null;

  const mapOrders = (list) => (list || []).map(po => ({
    id: po.poNo || po._id,
    date: po.date ? new Date(po.date).toISOString().split('T')[0] : new Date(po.createdAt).toISOString().split('T')[0],
    items: po.items?.map(i => `${i.name}${i.quantity ? ' ' + i.quantity : ''}`).join(', ') || '—',
    qty: po.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0,
    unit: 'Units',
    rate: po.items?.length > 0 ? Math.round((po.grandTotal || 0) / (po.items.reduce((s, i) => s + (i.quantity || 0), 1))) : 0,
    amount: po.grandTotal || po.subTotal || 0,
    status: po.status || 'Pending',
    grnStatus: po.status === 'Completed' ? 'GRN Done' : 'Pending',
    invoiceNo: po.invoiceNo || '—',
    _id: po._id
  }));

  const [orders, setOrders] = useState(isRealVendor ? [] : DEMO_PURCHASE_ORDERS);
  const [showNewPOModal, setShowNewPOModal] = useState(false);

  // Sync whenever hubData changes (API responds)
  useEffect(() => {
    if (!hubLoaded) return;
    const mapped = mapOrders(hubData?.purchaseHistory?.orders);
    if (mapped.length > 0) {
      setOrders(mapped);
    } else if (isRealVendor) {
      setOrders([]); // Real vendor with no POs → show empty state
    }
    // Demo vendor → keep DEMO_PURCHASE_ORDERS
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hubData]);
  const [newPO, setNewPO] = useState({
    items: '',
    qty: '',
    unit: 'Meters',
    rate: '',
    expectedDelivery: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    remarks: '',
    paymentTerms: vendor?.paymentTerms || 'Net 30',
  });

  const totalValue = orders.reduce((s, o) => s + o.amount, 0);
  const receivedCount = orders.filter(o => o.status === 'Received').length;
  const pendingCount = orders.filter(o => o.status === 'Partially Received' || o.status === 'Pending').length;

  const handleCreatePO = (e) => {
    e.preventDefault();
    const amount = Number(newPO.qty) * Number(newPO.rate);
    const poId = `PO-2026-${Math.floor(100 + Math.random() * 900)}`;
    const created = {
      id: poId,
      date: new Date().toISOString().split('T')[0],
      items: newPO.items,
      qty: Number(newPO.qty),
      unit: newPO.unit,
      rate: Number(newPO.rate),
      amount,
      status: 'Pending',
      grnStatus: 'Pending',
      invoiceNo: '—',
    };
    setOrders(prev => [created, ...prev]);
    setShowNewPOModal(false);
    showToast(`Purchase Order ${poId} created for ₹${amount.toLocaleString('en-IN')}!`);
  };

  return (
    <div className="space-y-5 animate-fade-in text-xs">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-1">
          <span className="text-indigo-500 font-bold block">Total Purchase Value</span>
          <span className="text-xl font-black text-indigo-700 font-mono">₹{totalValue.toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
          <span className="text-slate-400 font-bold block">Total Orders</span>
          <span className="text-xl font-black text-slate-800">{orders.length}</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-1">
          <span className="text-emerald-600 font-bold block">Received</span>
          <span className="text-xl font-black text-emerald-700">{receivedCount}</span>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-1">
          <span className="text-amber-600 font-bold block">Pending / Partial</span>
          <span className="text-xl font-black text-amber-700">{pendingCount}</span>
        </div>
      </div>

      {/* Header with + Create PO */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider">
          Purchase Orders & History — {vendor?.name}
        </h3>
        <button
          onClick={() => setShowNewPOModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" /> Create New Purchase
        </button>
      </div>

      {/* Detailed PO Table */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-100 text-slate-500 font-mono text-[11px] uppercase">
              <tr>
                <th className="p-3">PO Number</th>
                <th className="p-3">Date</th>
                <th className="p-3">Items</th>
                <th className="p-3 text-right">Qty</th>
                <th className="p-3 text-right">Rate</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center">GRN</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <FileText className="w-8 h-8 opacity-30" />
                      <span className="font-bold text-sm">No purchase orders yet</span>
                      <span className="text-xs">Create a purchase order using the Purchase module — it will appear here automatically</span>
                    </div>
                  </td>
                </tr>
              ) : orders.map((o, i) => (
                <tr key={i} className="hover:bg-white transition-colors">
                  <td className="p-3 font-mono font-black text-indigo-600">{o.id}</td>
                  <td className="p-3 font-mono text-slate-500">{o.date}</td>
                  <td className="p-3 font-medium text-slate-700 max-w-[180px]">{o.items}</td>
                  <td className="p-3 text-right font-mono font-bold">{o.qty} {o.unit}</td>
                  <td className="p-3 text-right font-mono text-slate-600">₹{o.rate}</td>
                  <td className="p-3 text-right font-mono font-black text-slate-800">₹{o.amount.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${o.grnStatus === 'GRN Done' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {o.grnStatus}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_COLORS[o.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenShareModal('Purchase Order', o.id)}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-200"
                      >
                        Share PO
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot className="bg-slate-100 border-t-2 border-slate-200">
              <tr>
                <td colSpan={5} className="p-3 font-black text-slate-700 text-right">Grand Total:</td>
                <td className="p-3 text-right font-black text-indigo-700 font-mono">₹{totalValue.toLocaleString('en-IN')}</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* CREATE NEW PURCHASE MODAL */}
      {showNewPOModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><FileText className="w-5 h-5" /></div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Create New Purchase Order</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Vendor: {vendor?.name}</p>
                </div>
              </div>
              <button onClick={() => setShowNewPOModal(false)} className="text-slate-400 hover:text-slate-700 p-1"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Items / Product Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cotton Fabric 500M, Linen Shirting 200M"
                  value={newPO.items}
                  onChange={e => setNewPO(p => ({ ...p, items: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="500"
                    value={newPO.qty}
                    onChange={e => setNewPO(p => ({ ...p, qty: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Unit</label>
                  <select
                    value={newPO.unit}
                    onChange={e => setNewPO(p => ({ ...p, unit: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:outline-none focus:border-indigo-500"
                  >
                    {['Meters', 'Yards', 'Kg', 'Bales', 'Pieces', 'Rolls', 'Sets'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Rate per Unit (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="120"
                    value={newPO.rate}
                    onChange={e => setNewPO(p => ({ ...p, rate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {newPO.qty && newPO.rate && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex justify-between items-center">
                  <span className="font-bold text-indigo-700">Estimated Total Order Value:</span>
                  <span className="text-lg font-black text-indigo-700 font-mono">₹{(Number(newPO.qty) * Number(newPO.rate)).toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Expected Delivery</label>
                  <input
                    type="date"
                    value={newPO.expectedDelivery}
                    onChange={e => setNewPO(p => ({ ...p, expectedDelivery: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Payment Terms</label>
                  <select
                    value={newPO.paymentTerms}
                    onChange={e => setNewPO(p => ({ ...p, paymentTerms: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:outline-none focus:border-indigo-500"
                  >
                    {['Net 7', 'Net 15', 'Net 30', 'Net 45', 'Advance', 'COD'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Remarks / Special Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Any special delivery instructions or quality notes..."
                  value={newPO.remarks}
                  onChange={e => setNewPO(p => ({ ...p, remarks: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowNewPOModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 shadow-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Create Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VendorCommunicationCard({ currentUser }) {
  const [vendorList, setVendorList] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [hubData, setHubData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);

  // Document View / Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null);

  // Share Document Modal State (Share PO, Goods Return, Payment Advice, Ledger)
  const [shareModalData, setShareModalData] = useState(null);

  // Modals
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [newVendorForm, setNewVendorForm] = useState({
    name: '',
    businessName: '',
    phone: '',
    email: '',
    gstin: '',
    panNumber: '',
    category: 'Fabric & Materials',
    businessType: 'Manufacturer',
    rating: 4.5,
    brandsSuppliedStr: 'Raymond, Linen Club',
    address: '',
    city: 'Surat',
    state: 'Gujarat',
    pinCode: '395002',
    bankName: 'HDFC Bank',
    accountHolder: '',
    accountNo: '',
    ifscCode: '',
    upiId: '',
    paymentTerms: 'Net 30',
    creditDays: 30,
    creditLimit: 100000,
    outstandingBalance: 0
  });

  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({
    title: '',
    followUpType: 'Pending Vendor Call',
    expectedDate: new Date().toISOString().split('T')[0],
    priority: 'Medium',
    assignedEmployeeName: currentUser?.name || 'Admin',
    remarks: ''
  });

  const [showDocModal, setShowDocModal] = useState(false);
  const [docForm, setDocForm] = useState({
    title: '',
    documentType: 'GST Certificate',
    fileUrl: '',
    fileSize: '1.4 MB'
  });

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState({
    content: '',
    noteType: 'Internal Note',
    isPinned: false,
    isPrivate: false
  });

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Fetch Vendors from MongoDB API
  const fetchVendors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');
      const res = await api.get(`/vendors/${vId}`);
      if (res.ok || res.status === 200) {
        const data = res.data;
        if (data.success && data.data) {
          setHubData({
            ...data.data,
            vendor: { ...currentVendorDoc, ...data.data.vendor }
          });
          return;
        }
      }
    } catch (err) { }

    // Fallback Hub State synced 1:1 with Vendor Document without dummy data
    setHubData({
      vendor: currentVendorDoc,
      timeline: [],
      followUps: [],
      documents: [],
      notes: [],
      purchaseHistory: {
        totalPurchaseValue: 0,
        lastPurchaseDate: null,
        purchaseOrdersCount: 0,
        purchaseInvoicesCount: 0,
        returnsCount: 0,
        grnCount: 0,
        orders: []
      },
      outstanding: {
        totalOutstanding: currentVendorDoc.currentOutstanding || 0,
        creditLimit: currentVendorDoc.creditLimit || 0,
        creditDays: currentVendorDoc.creditDays || 30,
        paymentTerms: currentVendorDoc.paymentTerms || 'Net 30',
        lastPaymentDate: null
      }
    });
  };

  const handleSelectVendor = (vId) => {
    setSelectedVendorId(vId);
    fetchVendorHub(vId);
    setViewMode('detail');
    setActiveTab('overview');
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (selectedVendorId) {
      fetchVendorHub(selectedVendorId);
    }
  }, [selectedVendorId]);

  // Helper function to generate professional HTML Document / Invoice files
  const generateHTMLDocument = ({ title, docNumber, documentType, vendor, summaryText }) => {
    const v = vendor || {};
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = new Date().toLocaleTimeString('en-IN');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${v.name || 'Vendor'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    body { background-color: #f8fafc; color: #1e293b; padding: 40px 20px; min-height: 100vh; display: flex; justify-content: center; }
    .page-container { background: #ffffff; width: 100%; max-width: 800px; padding: 40px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #4f46e5; margin-bottom: 24px; }
    .brand-title { font-size: 22px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.5px; }
    .brand-subtitle { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 2px; }
    .doc-badge { background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; font-family: 'JetBrains Mono', monospace; }
    .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px; font-size: 13px; }
    .meta-item { display: flex; flex-direction: column; gap: 2px; }
    .meta-label { color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .meta-value { font-weight: 700; color: #0f172a; }
    .meta-mono { font-family: 'JetBrains Mono', monospace; color: #4f46e5; font-weight: 700; }
    .content-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px; font-size: 13px; line-height: 1.6; color: #334155; }
    .content-box h3 { color: #0f172a; font-size: 14px; font-weight: 800; margin-bottom: 12px; text-transform: uppercase; }
    .footer { display: flex; justify-content: space-between; align-items: center; padding-top: 20px; border-top: 1px solid #e2e8f0; margin-top: 32px; font-size: 11px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; }
    .btn-print { background: #4f46e5; color: #ffffff; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25); transition: background 0.2s; }
    .btn-print:hover { background: #4338ca; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .page-container { border: none; box-shadow: none; max-width: 100%; padding: 0; }
      .btn-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="header">
      <div>
        <div class="brand-title">Vastra ERP Enterprise</div>
        <div class="brand-subtitle">Garment ERP Official Document</div>
      </div>
      <div style="text-align: right;">
        <span class="doc-badge">${documentType || title}</span>
        <div style="font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #64748b; margin-top: 6px;">Doc ID: #${docNumber || 'DOC-2026-001'}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">Vendor / Supplier Name</span>
        <span class="meta-value">${v.name || 'N/A'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Vendor Code</span>
        <span class="meta-mono">${v.vendorCode || 'VND-001'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">GSTIN Number</span>
        <span class="meta-mono">${v.gstin || '27AABCU9603R1ZM'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Date & Time</span>
        <span class="meta-value">${dateStr} | ${timeStr}</span>
      </div>
      <div class="meta-item" style="grid-column: span 2;">
        <span class="meta-label">Facility Address</span>
        <span class="meta-value">${v.address || 'Surat Textile Industrial Market, Gujarat - 395002'}</span>
      </div>
    </div>

    <div class="content-box">
      <h3>${title} Details</h3>
      <p style="white-space: pre-line;">${summaryText || 'Official document record verified and issued from Vastra ERP Repository.'}</p>
    </div>

    <div style="text-align: right; margin-top: 20px;">
      <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
    </div>

    <div class="footer">
      <span>Verified by Vastra ERP Systems</span>
      <span>Page 1 of 1</span>
    </div>
  </div>
</body>
</html>`;
  };

  // 3. Document Repository: VIEW handler
  const handleViewDocument = (doc) => {
    setPreviewDoc(doc);
  };

  // 4. Document Repository: DOWNLOAD handler (Generates HTML file)
  const handleDownloadDocument = (doc) => {
    const v = hubData?.vendor || vendorList.find(x => String(x._id) === String(selectedVendorId)) || DEFAULT_FALLBACK_VENDORS[0];
    const htmlContent = generateHTMLDocument({
      title: doc.title,
      docNumber: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
      documentType: doc.documentType,
      vendor: v,
      summaryText: `This is an official copy of ${doc.title} (${doc.documentType}) registered under Vendor Code ${v.vendorCode}.\nFile Size: ${doc.fileSize || '1.2 MB'}\nUpload Timestamp: ${new Date(doc.uploadedAt || Date.now()).toLocaleString()}`
    });

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded HTML document: ${doc.title}`);
  };

  // 5. Open Share Modal (Share PO, Goods Return, Payment Advice, Ledger Statement)
  const handleOpenShareModal = (docCategory, defaultDocNumber = '') => {
    const v = hubData?.vendor || vendorList.find(x => String(x._id) === String(selectedVendorId)) || DEFAULT_FALLBACK_VENDORS[0];
    const docNo = defaultDocNumber || `${docCategory.substring(0, 2).toUpperCase()}-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const outstanding = hubData?.outstanding?.totalOutstanding || v.currentOutstanding || 45000;

    let summaryText = '';
    if (docCategory.includes('Purchase Order') || docCategory.includes('PO')) {
      summaryText = `Greetings ${v.name},\n\nPlease find attached Purchase Order #${docNo} from Vastra ERP for 500 Meters Cotton/Linen Fabric.\nTotal Order Value: ₹45,000.\nPayment Terms: ${v.paymentTerms || 'Net 30'}.`;
    } else if (docCategory.includes('Goods Return')) {
      summaryText = `Greetings ${v.name},\n\nPlease find attached Goods Return Note #${docNo} for 25 Meters Defective Fabric Roll.\nReturn Credit Value: ₹8,500.`;
    } else if (docCategory.includes('Payment Advice')) {
      summaryText = `Greetings ${v.name},\n\nPayment Advice #${docNo}: Payment of ₹25,000 has been credited to your Bank A/C ${v.bankDetails?.accountNo || '50200049281920'} via NEFT/UPI.`;
    } else {
      summaryText = `Greetings ${v.name},\n\nPlease review your Outstanding Ledger Statement #${docNo} as of ${new Date().toLocaleDateString()}.\nCurrent Balance Due: ₹${outstanding.toLocaleString('en-IN')}.`;
    }

    setShareModalData({
      category: docCategory,
      docNumber: docNo,
      vendor: v,
      summaryText,
      recipientPhone: v.whatsappNumber || v.phone || '9876543210',
      recipientEmail: v.email || 'orders@textilevendor.com'
    });
  };

  // 6. Execute Share (WhatsApp, Email, or HTML File Download)
  const handleExecuteShare = async (channel) => {
    if (!shareModalData) return;
    const { category, docNumber, recipientPhone, recipientEmail, summaryText, vendor } = shareModalData;

    const activityType = `${category} Shared`;
    const remarks = `Shared ${category} #${docNumber} via ${channel}`;

    // Log activity to MongoDB
    try {
      const token = localStorage.getItem('token');
      await api.post(`/vendor-communication/${selectedVendorId}/log-activity`, {
          activityType,
          channel,
          remarks,
          documentNumber: docNumber,
          employeeName: currentUser?.name || 'Admin',
          status: 'Completed'
        });
    } catch (e) { }

    // Update local Timeline
    setHubData(prev => prev ? {
      ...prev,
      timeline: [{ activityType, channel, remarks, employeeName: currentUser?.name || 'Admin', createdAt: new Date() }, ...(prev.timeline || [])]
    } : prev);

    if (channel === 'WhatsApp') {
      const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
      const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      const waUrl = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(summaryText)}`;
      window.open(waUrl, '_blank');
      showToast(`Opened WhatsApp chat to share ${category}!`);
    } else if (channel === 'Email') {
      const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(`Vastra ERP - ${category} #${docNumber}`)}&body=${encodeURIComponent(summaryText)}`;
      window.open(mailtoUrl, '_self');
      showToast(`Opened email client to share ${category}!`);
    } else if (channel === 'Download') {
      const htmlContent = generateHTMLDocument({
        title: category,
        docNumber,
        documentType: category,
        vendor,
        summaryText
      });

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${category.replace(/\s+/g, '_')}_${docNumber}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Downloaded HTML invoice: ${category}`);
    }

    setShareModalData(null);
  };

  // 7. Create New Vendor in MongoDB
  const handleCreateNewVendor = async (e) => {
    e.preventDefault();
    if (!newVendorForm.name || !newVendorForm.phone) {
      showToast('Please enter vendor name and phone number', 'error');
      return;
    }

    // Build a clean payload matching the Vendor model schema
    const payload = {
      name: newVendorForm.name,
      businessName: newVendorForm.businessName,
      phone: newVendorForm.phone,
      email: newVendorForm.email,
      gstin: newVendorForm.gstin,
      panNumber: newVendorForm.panNumber,
      category: newVendorForm.category,
      businessType: newVendorForm.businessType,
      rating: newVendorForm.rating,
      address: newVendorForm.address,
      city: newVendorForm.city,
      state: newVendorForm.state,
      pinCode: newVendorForm.pinCode,
      upiId: newVendorForm.upiId,
      paymentTerms: newVendorForm.paymentTerms,
      creditDays: newVendorForm.creditDays,
      creditLimit: newVendorForm.creditLimit,
      outstandingBalance: newVendorForm.outstandingBalance,
      brandsSupplied: newVendorForm.brandsSuppliedStr
        ? newVendorForm.brandsSuppliedStr.split(',').map(b => b.trim()).filter(Boolean)
        : [],
      bankDetails: {
        bankName: newVendorForm.bankName,
        accountHolder: newVendorForm.accountHolder || newVendorForm.name,
        accountNo: newVendorForm.accountNo,
        ifscCode: newVendorForm.ifscCode,
        branch: `${newVendorForm.city || ''} Branch`
      }
    };

    try {
      const token = localStorage.getItem('token');
      const res = await api.post(`/vendor-communication`, payload);
      const data = res.data;
      if (data.success && data.data) {
        showToast(`✅ Vendor "${data.data.name}" created successfully!`);
        setShowAddVendorModal(false);
        setNewVendorForm({
          name: '', businessName: '', phone: '', email: '', gstin: '', panNumber: '',
          category: 'Fabric & Materials', businessType: 'Manufacturer', rating: 4.5,
          brandsSuppliedStr: '', address: '', city: '', state: 'Gujarat', pinCode: '',
          bankName: '', accountHolder: '', accountNo: '', ifscCode: '', upiId: '',
          paymentTerms: 'Net 30', creditDays: 30, creditLimit: 100000, outstandingBalance: 0
        });
        await fetchVendors();
        setSelectedVendorId(data.data._id);
        setViewMode('detail');
        setActiveTab('overview');
      } else {
        console.error('createVendor API error:', data);
        showToast(data.message || 'Error creating vendor — check browser console', 'error');
      }
    } catch (err) {
      console.error('createVendor network error:', err);
      showToast('Network error — is the backend server running?', 'error');
    }
  };

  const handleCreateFollowUp = (e) => {
    e.preventDefault();
    const newFollowUp = {
      _id: `f-${Date.now()}`,
      ...followUpForm,
      status: 'Pending',
      createdAt: new Date()
    };

    setHubData(prev => prev ? {
      ...prev,
      followUps: [newFollowUp, ...(prev.followUps || [])],
      timeline: [{ activityType: 'Follow-up Created', channel: 'System', remarks: `Created follow-up: ${followUpForm.title}`, employeeName: currentUser?.name || 'Admin', createdAt: new Date() }, ...(prev.timeline || [])]
    } : prev);

    setShowFollowUpModal(false);
    showToast('Follow-up created successfully!');
  };

  const handleCompleteFollowUp = (fId) => {
    setHubData(prev => prev ? {
      ...prev,
      followUps: (prev.followUps || []).map(f => f._id === fId ? { ...f, status: 'Completed' } : f),
      timeline: [{ activityType: 'Follow-up Completed', channel: 'System', remarks: `Completed follow-up item`, employeeName: currentUser?.name || 'Admin', createdAt: new Date() }, ...(prev.timeline || [])]
    } : prev);
    showToast('Follow-up marked as completed!');
  };

  const handleAddDocument = (e) => {
    e.preventDefault();
    const newDoc = {
      _id: `d-${Date.now()}`,
      ...docForm,
      uploadedBy: currentUser?.name || 'Admin',
      uploadedAt: new Date()
    };

    setHubData(prev => prev ? {
      ...prev,
      documents: [newDoc, ...(prev.documents || [])],
      timeline: [{ activityType: 'Document Uploaded', channel: 'System', remarks: `Uploaded ${docForm.documentType}: ${docForm.title}`, employeeName: currentUser?.name || 'Admin', createdAt: new Date() }, ...(prev.timeline || [])]
    } : prev);

    setShowDocModal(false);
    showToast('Document uploaded successfully!');
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    const newNote = {
      _id: `n-${Date.now()}`,
      ...noteForm,
      employeeName: currentUser?.name || 'Admin',
      createdAt: new Date()
    };

    setHubData(prev => prev ? {
      ...prev,
      notes: [newNote, ...(prev.notes || [])],
      timeline: [{ activityType: 'Internal Note Added', channel: 'System', remarks: `Added note: ${noteForm.content.substring(0, 50)}...`, employeeName: currentUser?.name || 'Admin', createdAt: new Date() }, ...(prev.timeline || [])]
    } : prev);

    setShowNoteModal(false);
    showToast('Internal note added!');
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`);
  };

  const vendor = hubData?.vendor || vendorList.find(v => String(v._id) === String(selectedVendorId)) || DEFAULT_FALLBACK_VENDORS[0];

  const filteredVendors = vendorList.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.vendorCode && v.vendorCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (v.businessName && v.businessName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12 animate-fade-in bg-slate-50/60 p-4 md:p-6 rounded-2xl min-h-screen text-slate-800">

      {/* Toast Alert */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-bold border ${notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
          <AlertCircle className="w-4 h-4" />
          <span>{notification.msg}</span>
        </div>
      )}

      {/* TOP HEADER BAR */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                Vendor Communication Card
              </h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wide">
                Enterprise Hub
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              360° Vendor Lifecycle, Document Repository, Timeline Automation & Financial Settlements
            </p>
          </div>
        </div>

        {/* Global Search, Selector & Add Vendor */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendor name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>



          <button
            onClick={() => setShowAddVendorModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Add New Vendor
          </button>
        </div>
      </div>

      {/* ─── STANDARD VENDOR DIRECTORY LIST MODE ─── */}
      {viewMode === 'list' ? (
        <div className="space-y-4 animate-fade-in text-sm">
          {/* Header Title info */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-1">
            <h2 className="text-lg font-black text-slate-800">Vendor Master Directory</h2>
            <p className="text-slate-500 font-medium text-xs">
              Select any vendor from the list below to view and manage their full profile card, timeline history, financials and settlement ledger.
            </p>
          </div>

          {/* Clean Directory Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                    <th className="p-4 w-28">Vendor Code</th>
                    <th className="p-4 w-56">Supplier Name</th>
                    <th className="p-4 w-44">Category</th>
                    <th className="p-4 w-52">Primary Contact</th>
                    <th className="p-4">Registered Office Address</th>
                    <th className="p-4 text-center w-36">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium text-sm">
                  {filteredVendors.map((v) => (
                    <tr
                      key={v._id}
                      onClick={() => handleSelectVendor(v._id)}
                      className="hover:bg-indigo-50/30 transition cursor-pointer group"
                    >
                      <td className="p-4 font-mono font-bold text-slate-500">{v.vendorCode}</td>
                      <td className="p-4 font-bold text-indigo-600 group-hover:text-indigo-800 group-hover:underline text-[15px]">
                        {v.name}
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded border border-slate-200 uppercase">
                          {v.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">
                        <div>{v.phone}</div>
                        <div className="text-xs text-slate-400 font-normal">{v.email}</div>
                      </td>
                      <td className="p-4 text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px]" title={v.address}>
                        {v.address}
                      </td>
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleSelectVendor(v._id)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition text-xs flex items-center gap-1 mx-auto"
                        >
                          Open Profile ➜
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredVendors.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400 italic font-bold">
                        No vendors found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ─── DETAILED VIEW MODE (PAGE INSIDE PAGE) ─── */
        <div className="space-y-4 animate-fade-in">

          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Vendor Directory Grid
            </button>
            <div className="text-xs font-bold text-slate-500 font-mono">
              Editing Profile: <span className="text-indigo-600 font-black">{vendor.name} ({vendor.vendorCode})</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">

            {/* 11-Tab Header */}
            <div className="bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center gap-1 p-2">
              {[
                { id: 'overview', label: '1. Overview' },
                { id: 'contacts', label: '2. Contacts' },
                { id: 'addresses', label: '3. Addresses' },
                { id: 'banking', label: '4. Banking' },
                { id: 'documents', label: '5. Documents' },
                { id: 'timeline', label: '6. Timeline' },
                { id: 'followups', label: '7. Follow-ups' },
                { id: 'purchase_history', label: '8. Purchases' },
                { id: 'outstanding', label: '9. Outstanding' },
                { id: 'internal', label: '10. Internal Info' },
                { id: 'primary_uses', label: '11. Uses & Actions' },
                { id: 'notes', label: '12. Notes' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-3 text-xs font-black rounded-xl transition-all ${activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-transparent text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="p-5 md:p-6 space-y-6">



              {/* TAB 1: OVERVIEW — includes inline vendor profile card */}
              {activeTab === 'overview' && (
                <div className="space-y-5 animate-fade-in">

                  {/* INLINE VENDOR PROFILE CARD (only shown here) */}
                  <div className="bg-gradient-to-r from-indigo-50 to-slate-50 border border-indigo-100 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-xl font-black text-white shadow-md border border-indigo-200 flex-shrink-0">
                      {vendor.name ? vendor.name.substring(0, 2).toUpperCase() : 'VN'}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-black text-slate-800">{vendor.name}</h2>
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{vendor.vendorCode || 'VND-2026-001'}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${vendor.isActive !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {vendor.isActive !== false ? 'Active Supplier' : 'Inactive'}
                        </span>
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {vendor.rating || 4.8}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{vendor.businessName || 'Garment Manufacturing & Supply Co.'}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(vendor.brandsSupplied && vendor.brandsSupplied.length > 0 ? vendor.brandsSupplied : ['Raymond', 'Linen Club']).map((b, i) => (
                          <span key={i} className="bg-white text-slate-700 border border-slate-200 text-[10px] px-2 py-0.5 rounded font-bold font-mono">{b}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                      <button onClick={() => handleOpenShareModal('Call')} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center gap-1.5 shadow-sm transition">
                        <Phone className="w-3.5 h-3.5" /> Call
                      </button>
                      <button onClick={() => handleOpenShareModal('WhatsApp Message')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center gap-1.5 shadow-sm transition">
                        <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
                    <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider">
                      Vendor Profile Master Record
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <button onClick={() => handleOpenShareModal('Purchase Order', 'PO-2026-9810')} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold flex items-center gap-1 border border-indigo-200">
                        <FileText className="w-3.5 h-3.5" /> Share PO
                      </button>
                      <button onClick={() => handleOpenShareModal('Goods Return', 'GRN-2026-042')} className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold flex items-center gap-1 border border-amber-200">
                        <RefreshCw className="w-3.5 h-3.5" /> Goods Return
                      </button>
                      <button onClick={() => handleOpenShareModal('Payment Advice', 'PAY-2026-118')} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1 border border-emerald-200">
                        <DollarSign className="w-3.5 h-3.5" /> Payment Advice
                      </button>
                      <button onClick={() => handleOpenShareModal('Ledger Statement', 'STMT-2026-001')} className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold flex items-center gap-1 border border-red-200">
                        <FileCheck className="w-3.5 h-3.5" /> Ledger Statement
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-slate-400 font-medium">Category</span>
                      <span className="font-bold text-slate-800 block">{vendor.category || 'Fabric & Materials'}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-slate-400 font-medium">Business Type</span>
                      <span className="font-bold text-slate-800 block">{vendor.businessType || 'Manufacturer'}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-slate-400 font-medium">GSTIN</span>
                      <span className="font-mono font-bold text-indigo-600 flex items-center gap-1 cursor-pointer" onClick={() => copyToClipboard(vendor.gstin || '27AABCU9603R1ZM', 'GSTIN')}>{vendor.gstin || '27AABCU9603R1ZM'} <Copy className="w-3 h-3" /></span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-slate-400 font-medium">PAN Number</span>
                      <span className="font-mono font-bold text-indigo-600 flex items-center gap-1 cursor-pointer" onClick={() => copyToClipboard(vendor.panNumber || 'AABCU9603R', 'PAN')}>{vendor.panNumber || 'AABCU9603R'} <Copy className="w-3 h-3" /></span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-slate-400 font-medium">Supplied Brands</span>
                      <span className="font-bold text-slate-700 block">{(vendor.brandsSupplied || ['Raymond', 'Linen Club']).join(', ')}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-slate-400 font-medium">Preferred Contact</span>
                      <span className="font-bold text-slate-700 block">{vendor.preferredContactPerson || 'Mr. Ramesh Shah (Sales Head)'}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1 col-span-2">
                      <span className="text-slate-400 font-medium">Calling Window</span>
                      <span className="font-bold text-emerald-600 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {vendor.preferredCallingTime || '10:00 AM - 06:00 PM'}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Quality & Performance Remarks:</span>
                    <p className="text-xs text-slate-600 italic bg-white p-3 rounded-lg border border-slate-200">
                      "{vendor.qualityRemarks || 'Vendor maintains 98% quality compliance and on-time order fulfillment.'}"
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: CONTACTS */}
              {activeTab === 'contacts' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider border-b border-slate-100 pb-2">
                    Vendor Contact Directory & Channels
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block font-medium">Primary Mobile</span>
                        <span className="font-mono font-bold text-slate-800 text-sm">{vendor.phone || '9876543210'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => copyToClipboard(vendor.phone || '9876543210', 'Mobile')} className="p-2 bg-white text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100"><Copy className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleOpenShareModal('Call')} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Call</button>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block font-medium">WhatsApp Number</span>
                        <span className="font-mono font-bold text-emerald-600 text-sm">{vendor.whatsappNumber || vendor.phone || '9876543210'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => copyToClipboard(vendor.whatsappNumber || vendor.phone || '9876543210', 'WhatsApp')} className="p-2 bg-white text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100"><Copy className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleOpenShareModal('WhatsApp Message')} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Message</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ADDRESSES */}
              {activeTab === 'addresses' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider">
                      Vendor Facility & Shipping Addresses
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">Click address to copy</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">

                    {/* Office Address */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><MapPin className="w-4 h-4" /></div>
                          <span className="font-black text-slate-800">Office Address</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(vendor.address || 'Plot 45, Textile Industrial Park, Ring Road, Surat, Gujarat - 395002', 'Office Address')}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        ><Copy className="w-3.5 h-3.5" /></button>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-medium pl-1">
                        {vendor.address || 'Plot 45, Textile Industrial Park, Ring Road, Surat, Gujarat - 395002'}
                      </p>
                      <a
                        href={`https://maps.google.com?q=${encodeURIComponent(vendor.address || 'Plot 45, Textile Industrial Park, Ring Road, Surat, Gujarat - 395002')}`}
                        target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:underline text-[11px]"
                      >
                        <ExternalLink className="w-3 h-3" /> Open in Google Maps
                      </a>
                    </div>

                    {/* Factory Address */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-amber-50 rounded-xl text-amber-600"><Building2 className="w-4 h-4" /></div>
                          <span className="font-black text-slate-800">Factory Address</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(vendor.factoryAddress || 'Survey No. 112, GIDC Estate, Pandesara, Surat, Gujarat - 394221', 'Factory Address')}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        ><Copy className="w-3.5 h-3.5" /></button>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-medium pl-1">
                        {vendor.factoryAddress || 'Survey No. 112, GIDC Industrial Estate, Pandesara, Surat, Gujarat - 394221'}
                      </p>
                      <a
                        href={`https://maps.google.com?q=${encodeURIComponent(vendor.factoryAddress || 'Survey No. 112, GIDC Industrial Estate, Pandesara, Surat')}`}
                        target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-amber-600 font-bold hover:underline text-[11px]"
                      >
                        <ExternalLink className="w-3 h-3" /> Open in Google Maps
                      </a>
                    </div>

                    {/* Warehouse Address */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><Bookmark className="w-4 h-4" /></div>
                          <span className="font-black text-slate-800">Warehouse Address</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(vendor.warehouseAddress || 'Warehouse No. 7-B, Logistics Park, Kosamba Road, Surat, Gujarat - 394120', 'Warehouse Address')}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        ><Copy className="w-3.5 h-3.5" /></button>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-medium pl-1">
                        {vendor.warehouseAddress || 'Warehouse No. 7-B, Logistics Park, Kosamba Road, Surat, Gujarat - 394120'}
                      </p>
                      <a
                        href={`https://maps.google.com?q=${encodeURIComponent(vendor.warehouseAddress || 'Warehouse No. 7-B, Logistics Park, Kosamba Road, Surat')}`}
                        target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-600 font-bold hover:underline text-[11px]"
                      >
                        <ExternalLink className="w-3 h-3" /> Open in Google Maps
                      </a>
                    </div>

                    {/* Pickup Address */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-purple-50 rounded-xl text-purple-600"><Paperclip className="w-4 h-4" /></div>
                          <span className="font-black text-slate-800">Pickup Address</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(vendor.pickupAddress || 'Gate 3, GIDC Phase-2, Sachin, Surat, Gujarat - 394230', 'Pickup Address')}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                        ><Copy className="w-3.5 h-3.5" /></button>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-medium pl-1">
                        {vendor.pickupAddress || 'Gate 3, GIDC Phase-2, Sachin Industrial Area, Surat, Gujarat - 394230'}
                      </p>
                      <a
                        href={`https://maps.google.com?q=${encodeURIComponent(vendor.pickupAddress || 'Gate 3, GIDC Phase-2, Sachin Industrial Area, Surat')}`}
                        target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-purple-600 font-bold hover:underline text-[11px]"
                      >
                        <ExternalLink className="w-3 h-3" /> Open in Google Maps
                      </a>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 4: BANKING & FINANCIAL INFORMATION */}
              {activeTab === 'banking' && (
                <div className="space-y-6 animate-fade-in">
                  <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider border-b border-slate-100 pb-2">
                    Banking & Financial Information
                  </h3>

                  {/* Bank Account Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><CreditCard className="w-4 h-4" /></div>
                      <span className="font-black text-slate-800 text-sm">Bank Account Details</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium block mb-1">Bank Name</span>
                        <span className="font-black text-slate-800 text-sm">{vendor.bankDetails?.bankName || 'HDFC Bank Ltd.'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block mb-1">Account Holder Name</span>
                        <span className="font-bold text-slate-700">{vendor.bankDetails?.accountHolder || vendor.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block mb-1">Branch Name</span>
                        <span className="font-bold text-slate-700">{vendor.bankDetails?.branch || 'Ring Road, Surat Branch'}</span>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-slate-400 font-medium block mb-1">Account Number</span>
                        <span className="font-mono font-black text-indigo-700 text-sm flex items-center gap-2">
                          {vendor.bankDetails?.accountNo || '50200049281920'}
                          <button onClick={() => copyToClipboard(vendor.bankDetails?.accountNo || '50200049281920', 'Account Number')} className="text-slate-400 hover:text-indigo-600">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block mb-1">IFSC Code</span>
                        <span className="font-mono font-black text-indigo-700 flex items-center gap-2">
                          {vendor.bankDetails?.ifscCode || 'HDFC0001234'}
                          <button onClick={() => copyToClipboard(vendor.bankDetails?.ifscCode || 'HDFC0001234', 'IFSC Code')} className="text-slate-400 hover:text-indigo-600">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block mb-1">UPI ID <span className="text-[10px] font-normal">(Optional)</span></span>
                        <span className="font-mono font-bold text-slate-700 flex items-center gap-2">
                          {vendor.bankDetails?.upiId || vendor.upiId || 'raymond@hdfcbank'}
                          <button onClick={() => copyToClipboard(vendor.bankDetails?.upiId || 'raymond@hdfcbank', 'UPI ID')} className="text-slate-400 hover:text-indigo-600">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Terms Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><DollarSign className="w-4 h-4" /></div>
                      <span className="font-black text-slate-800 text-sm">Financial & Payment Terms</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-slate-400 font-medium block">Payment Terms</span>
                        <span className="font-black text-slate-800 text-sm">{vendor.paymentTerms || 'Net 30'}</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-slate-400 font-medium block">Credit Days</span>
                        <span className="font-black text-indigo-700 text-xl font-mono">{vendor.creditDays || 30}<span className="text-xs ml-1 font-bold text-slate-500">days</span></span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-slate-400 font-medium block">Credit Limit</span>
                        <span className="font-black text-emerald-700 text-sm font-mono">₹{(vendor.creditLimit || 250000).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-slate-400 font-medium block">Current Outstanding</span>
                        <span className="font-black text-red-600 text-sm font-mono">₹{(vendor.currentOutstanding || 45000).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                        <div>
                          <span className="text-indigo-500 font-bold block">GSTIN</span>
                          <span className="font-mono font-black text-indigo-700 flex items-center gap-1">
                            {vendor.gstin || '24AABCR1234F1ZX'}
                            <button onClick={() => copyToClipboard(vendor.gstin || '24AABCR1234F1ZX', 'GSTIN')} className="text-indigo-400 hover:text-indigo-700"><Copy className="w-3 h-3" /></button>
                          </span>
                        </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                        <FileCheck className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <div>
                          <span className="text-slate-400 font-bold block">PAN Number</span>
                          <span className="font-mono font-black text-slate-700 flex items-center gap-1">
                            {vendor.panNumber || 'AABCR1234F'}
                            <button onClick={() => copyToClipboard(vendor.panNumber || 'AABCR1234F', 'PAN')} className="text-slate-400 hover:text-slate-700"><Copy className="w-3 h-3" /></button>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 5: DOCUMENTS (FULLY FUNCTIONAL VIEW & DOWNLOAD!) */}
              {activeTab === 'documents' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider">
                      Vendor Document Repository
                    </h3>
                    <button
                      onClick={() => setShowDocModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-3.5 rounded-xl flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Upload Document
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {(hubData?.documents || []).map((doc, idx) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold border border-indigo-200">
                            {doc.documentType}
                          </span>
                          <h4 className="font-bold text-slate-800">{doc.title}</h4>
                          <p className="text-[11px] text-slate-400 font-mono">{doc.fileSize || '1.2 MB'} • {new Date(doc.uploadedAt || Date.now()).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {/* VIEW BUTTON FUNCTIONAL */}
                          <button
                            onClick={() => handleViewDocument(doc)}
                            title="View Document Preview"
                            className="p-2 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition font-bold flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" /> View
                          </button>
                          {/* DOWNLOAD BUTTON FUNCTIONAL */}
                          <button
                            onClick={() => handleDownloadDocument(doc)}
                            title="Download Document"
                            className="p-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-xs transition font-bold flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" /> Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: COMMUNICATION TIMELINE */}
              {activeTab === 'timeline' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider border-b border-slate-100 pb-2">
                    Automated Activity Stream
                  </h3>

                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                    {(hubData?.timeline || []).map((item, index) => (
                      <div key={index} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-start justify-between text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{item.activityType}</span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px] font-bold">
                              {item.channel || 'System'}
                            </span>
                          </div>
                          <p className="text-slate-600 font-medium">{item.remarks}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Logged by: {item.employeeName || 'Admin'}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: FOLLOW-UPS */}
              {activeTab === 'followups' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider">
                      Pending Vendor Follow-ups
                    </h3>
                    <button
                      onClick={() => setShowFollowUpModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-3.5 rounded-xl flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Create Follow-up
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(hubData?.followUps || []).map((f) => (
                      <div key={f._id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${f.priority === 'Urgent' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                              {f.priority} Priority
                            </span>
                            <h4 className="font-bold text-slate-800">{f.title}</h4>
                          </div>
                          <p className="text-slate-500">Assigned To: {f.assignedEmployeeName} • Due: {new Date(f.expectedDate).toLocaleDateString()}</p>
                        </div>

                        <div>
                          {f.status === 'Completed' ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-1 text-xs">
                              <CheckCircle2 className="w-4 h-4" /> Completed
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCompleteFollowUp(f._id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 8: PURCHASES — Full Detail + Create New PO */}
              {activeTab === 'purchase_history' && (
                <PurchaseTab vendor={vendor} showToast={showToast} handleOpenShareModal={handleOpenShareModal} hubData={hubData} />
              )}

              {/* TAB 9: OUTSTANDING */}
              {activeTab === 'outstanding' && (
                <OutstandingTab
                  vendor={vendor}
                  hubData={hubData}
                  showToast={showToast}
                  handleOpenShareModal={handleOpenShareModal}
                />
              )}

              {/* TAB 10: INTERNAL INFORMATION */}
              {activeTab === 'internal' && (
                <div className="space-y-6 animate-fade-in">
                  <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider border-b border-slate-100 pb-2">
                    Internal Information — {vendor.name}
                  </h3>

                  {/* Contact & Calling Preferences */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><UserCheck className="w-4 h-4" /></div>
                      <span className="font-black text-slate-800 text-sm">Contact Preferences</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-slate-400 font-medium block">Preferred Contact Person</span>
                        <span className="font-black text-slate-800">{vendor.preferredContactPerson || 'Mr. Ramesh Shah (Sales Head)'}</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-slate-400 font-medium block">Preferred Calling Time</span>
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {vendor.preferredCallingTime || '10:00 AM – 06:00 PM'}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-slate-400 font-medium block">Vendor Rating</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-amber-600 font-mono">{vendor.rating || 4.8}</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} className={`w-4 h-4 ${star <= Math.round(vendor.rating || 4.8) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quality Remarks */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><ShieldCheck className="w-4 h-4" /></div>
                      <span className="font-black text-slate-800 text-sm">Quality & Performance Remarks</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
                      <p className="text-slate-700 font-medium italic leading-relaxed">
                        &ldquo;{vendor.qualityRemarks || 'Vendor maintains 98% quality compliance and on-time order fulfillment. Fabric quality is excellent with no returns in the last 6 months. Recommended for premium garment production.'}&rdquo;
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-lg font-bold">✓ Quality Compliant</span>
                      <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1 rounded-lg font-bold">✓ On-time Delivery</span>
                      <span className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-lg font-bold">★ Preferred Vendor</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 11: PRIMARY USES & ACTIONS */}
              {activeTab === 'primary_uses' && (
                <div className="space-y-6 animate-fade-in">
                  <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider border-b border-slate-100 pb-2">
                    Primary Uses & Actions — Vendor Communication Card
                  </h3>

                  {/* Communication Actions */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><MessageSquare className="w-4 h-4" /></div>
                      <span className="font-black text-slate-800 text-sm">Communication</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {[
                        { label: 'Call Vendor', icon: Phone, bg: 'bg-indigo-600', text: 'text-white', action: () => handleOpenShareModal('Call') },
                        { label: 'Send WhatsApp', icon: MessageSquare, bg: 'bg-emerald-600', text: 'text-white', action: () => handleOpenShareModal('WhatsApp Message') },
                        { label: 'Send Email', icon: Mail, bg: 'bg-sky-600', text: 'text-white', action: () => handleOpenShareModal('Email') },
                      ].map((item, i) => (
                        <button key={i} onClick={item.action} className={`flex items-center gap-2 p-3 ${item.bg} ${item.text} rounded-xl font-black transition hover:opacity-90 shadow-sm`}>
                          <item.icon className="w-4 h-4" /> {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Document Sharing */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="p-2 bg-amber-50 rounded-xl text-amber-600"><FileText className="w-4 h-4" /></div>
                      <span className="font-black text-slate-800 text-sm">Document Sharing</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {[
                        { label: 'Share Purchase Order', icon: FileText, action: () => handleOpenShareModal('Purchase Order', 'PO-2026-9810') },
                        { label: 'Share Goods Return', icon: RefreshCw, action: () => handleOpenShareModal('Goods Return', 'GRN-2026-042') },
                        { label: 'Send Payment Advice', icon: DollarSign, action: () => handleOpenShareModal('Payment Advice', 'PAY-2026-118') },
                        { label: 'Share Debit Note', icon: ArrowRight, action: () => handleOpenShareModal('Debit Note', 'DN-2026-001') },
                        { label: 'Share Credit Note', icon: ArrowRight, action: () => handleOpenShareModal('Credit Note', 'CN-2026-001') },
                        { label: 'Share Rate Enquiry', icon: Send, action: () => handleOpenShareModal('Rate Enquiry', 'RFQ-2026-001') },
                        { label: 'Share Product Images', icon: Paperclip, action: () => setActiveTab('documents') },
                        { label: 'Share Agreements', icon: Lock, action: () => setActiveTab('documents') },
                      ].map((item, i) => (
                        <button key={i} onClick={item.action} className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-amber-50 border border-slate-100 hover:border-amber-200 rounded-xl text-left font-bold text-slate-700 hover:text-amber-700 transition">
                          <item.icon className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" /> {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Financial Statements */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><DollarSign className="w-4 h-4" /></div>
                      <span className="font-black text-slate-800 text-sm">Financial Statements</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {[
                        { label: 'Send Outstanding Statement', icon: FileCheck, action: () => setActiveTab('outstanding') },
                        { label: 'Send Purchase Statement', icon: Paperclip, action: () => setActiveTab('purchase_history') },
                        { label: 'Share Ledger Statement', icon: FileCheck, action: () => handleOpenShareModal('Ledger Statement', 'STMT-2026-001') },
                      ].map((item, i) => (
                        <button key={i} onClick={item.action} className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-xl text-left font-bold text-slate-700 hover:text-emerald-700 transition">
                          <item.icon className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" /> {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tracking */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="p-2 bg-slate-100 rounded-xl text-slate-600"><ArrowRight className="w-4 h-4" /></div>
                      <span className="font-black text-slate-800 text-sm">Tracking & Follow-ups</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {[
                        { label: 'View Communication Timeline', icon: Calendar, action: () => setActiveTab('timeline') },
                        { label: 'View Shared Documents', icon: Eye, action: () => setActiveTab('documents') },
                        { label: 'Track LR & Dispatch', icon: ArrowRight, action: () => setActiveTab('timeline') },
                        { label: 'Track Goods Return', icon: RefreshCw, action: () => setActiveTab('followups') },
                        { label: 'Track Replacement Status', icon: ArrowRight, action: () => setActiveTab('followups') },
                        { label: 'Track Credit Note Status', icon: ArrowRight, action: () => setActiveTab('followups') },
                        { label: 'Track Vendor Payment', icon: DollarSign, action: () => setActiveTab('followups') },
                      ].map((item, i) => (
                        <button key={i} onClick={item.action} className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-left font-bold text-slate-700 transition">
                          <item.icon className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" /> {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 11: NOTES */}
              {activeTab === 'notes' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider">
                      Internal Vendor Notes
                    </h3>
                    <button
                      onClick={() => setShowNoteModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-3.5 rounded-xl flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Note
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    {(hubData?.notes || []).length === 0 && (
                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center text-slate-400 font-medium">
                        No internal notes yet. Click &ldquo;Add Note&rdquo; to add the first one.
                      </div>
                    )}
                    {(hubData?.notes || []).map((n, i) => (
                      <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5 shadow-sm">
                        <p className="text-slate-800 font-medium leading-relaxed">{n.content}</p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                          <span>By: <span className="font-bold text-slate-600">{n.employeeName}</span></span>
                          <span>•</span>
                          <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* ⚡ BOTTOM QUICK ACTION TAB BAR */}
            <div className="border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <div className="flex items-stretch w-full">
                {[
                  { label: 'Call', icon: Phone, bg: 'bg-indigo-600', text: 'text-white', hoverBg: 'hover:bg-indigo-700', action: () => handleOpenShareModal('Call') },
                  { label: 'WhatsApp', icon: MessageSquare, bg: 'bg-emerald-600', text: 'text-white', hoverBg: 'hover:bg-emerald-700', action: () => handleOpenShareModal('WhatsApp Message') },
                  { label: 'Email', icon: Mail, bg: 'bg-sky-600', text: 'text-white', hoverBg: 'hover:bg-sky-700', action: () => handleOpenShareModal('Email') },
                  { label: 'Share PO', icon: FileText, bg: 'bg-white', text: 'text-slate-700', hoverBg: 'hover:bg-indigo-50', border: true, action: () => handleOpenShareModal('Purchase Order', 'PO-2026-9810') },
                  { label: 'Share GR', icon: RefreshCw, bg: 'bg-white', text: 'text-slate-700', hoverBg: 'hover:bg-amber-50', border: true, action: () => handleOpenShareModal('Goods Return', 'GRN-2026-042') },
                  { label: 'Pmt Advice', icon: DollarSign, bg: 'bg-white', text: 'text-slate-700', hoverBg: 'hover:bg-emerald-50', border: true, action: () => handleOpenShareModal('Payment Advice', 'PAY-2026-118') },
                  { label: 'Statement', icon: FileCheck, bg: 'bg-white', text: 'text-slate-700', hoverBg: 'hover:bg-red-50', border: true, action: () => handleOpenShareModal('Ledger Statement', 'STMT-2026-001') },
                  { label: 'Documents', icon: Paperclip, bg: 'bg-white', text: 'text-slate-700', hoverBg: 'hover:bg-slate-100', border: true, action: () => setActiveTab('documents') },
                  { label: 'Add Note', icon: Edit3, bg: 'bg-white', text: 'text-slate-700', hoverBg: 'hover:bg-slate-100', border: true, action: () => { setActiveTab('notes'); setShowNoteModal(true); } },
                ].map((btn, i) => (
                  <button
                    key={i}
                    onClick={btn.action}
                    className={`flex flex-col items-center justify-center gap-1 py-3 flex-1 ${btn.bg} ${btn.text} ${btn.hoverBg} transition ${btn.border ? 'border-l border-slate-200' : ''
                      } text-[10px] font-black`}
                  >
                    <btn.icon className="w-4 h-4" />
                    <span>{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 1: VIEW DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Eye className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-800">{previewDoc.title}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono uppercase">
                    {previewDoc.documentType}
                  </span>
                </div>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Vendor Name:</span>
                <span className="font-bold text-slate-800">{vendor.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Vendor Code:</span>
                <span className="font-mono font-bold text-indigo-600">{vendor.vendorCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">GSTIN:</span>
                <span className="font-mono font-bold text-slate-800">{vendor.gstin || '27AABCU9603R1ZM'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Upload Date:</span>
                <span className="font-mono text-slate-700">{new Date(previewDoc.uploadedAt || Date.now()).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Uploaded By:</span>
                <span className="font-bold text-slate-800">{previewDoc.uploadedBy || 'Admin'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button onClick={() => setPreviewDoc(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs">Close</button>
              <button onClick={() => { handleDownloadDocument(previewDoc); setPreviewDoc(null); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 flex items-center gap-1">
                <Download className="w-3.5 h-3.5" /> Download File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: INTERACTIVE SHARE DOCUMENT MODAL (Share PO, Goods Return, Payment Advice, Ledger) */}
      {shareModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Share2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-800">Share {shareModalData.category}</h3>
                  <span className="text-[10px] font-mono font-bold text-indigo-600">Document #{shareModalData.docNumber}</span>
                </div>
              </div>
              <button onClick={() => setShareModalData(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Generated Statement Summary:</span>
              <p className="text-slate-700 font-medium leading-relaxed bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-line">
                {shareModalData.summaryText}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-slate-700 block">Select Sharing Channel:</span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  onClick={() => handleExecuteShare('WhatsApp')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-3 rounded-xl flex flex-col items-center gap-1 shadow-sm transition"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => handleExecuteShare('Email')}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold p-3 rounded-xl flex flex-col items-center gap-1 shadow-sm transition"
                >
                  <Mail className="w-5 h-5" />
                  <span>Email</span>
                </button>
                <button
                  onClick={() => handleExecuteShare('Download')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 rounded-xl flex flex-col items-center gap-1 shadow-sm transition"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Statement</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD NEW VENDOR */}
      {showAddVendorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-2xl space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-800">Add New Vendor to MongoDB</h3>
              </div>
              <button onClick={() => setShowAddVendorModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
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
                    placeholder="e.g. Vardhman Textiles"
                    value={newVendorForm.name}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Vardhman Spinning Mills Ltd."
                    value={newVendorForm.businessName}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, businessName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. orders@vardhman.com"
                    value={newVendorForm.email}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddVendorModal(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 shadow-sm">Save to MongoDB</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CREATE FOLLOW-UP */}
      {showFollowUpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-800 flex items-center justify-between">
              Create Vendor Follow-up
              <button onClick={() => setShowFollowUpModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </h3>

            <form onSubmit={handleCreateFollowUp} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 font-medium block mb-1">Follow-up Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call regarding fabric replacement..."
                  value={followUpForm.title}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowFollowUpModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Save Follow-up</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: UPLOAD DOCUMENT */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-800 flex items-center justify-between">
              Upload Vendor Document
              <button onClick={() => setShowDocModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </h3>

            <form onSubmit={handleAddDocument} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 font-medium block mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GST Certificate 2026"
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowDocModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Upload & Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: ADD NOTE */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-800 flex items-center justify-between">
              Add Internal Vendor Note
              <button onClick={() => setShowNoteModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </h3>

            <form onSubmit={handleAddNote} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 font-medium block mb-1">Note Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter internal note remarks..."
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowNoteModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Save Note</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
