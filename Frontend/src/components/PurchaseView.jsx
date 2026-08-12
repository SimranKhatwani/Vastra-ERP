import api from '../api/axios';
import React, { useState, useCallback, useMemo } from "react";
import {
  Building2, Package, FileText, RotateCcw, Clock, BarChart3, Wallet,
  Plus, Search, Filter, Download, Printer, Eye, Pencil, Trash2,
  CheckCircle2, XCircle, AlertTriangle, TrendingUp, TrendingDown,
  ChevronDown, ChevronUp, X, Save, RefreshCw, IndianRupee,
  ShoppingBag, Truck, ClipboardList, Users, Star, Phone, Mail,
  MapPin, CreditCard, Calendar, ArrowUpRight, ArrowDownRight,
  FileSpreadsheet, UploadCloud, FilePlus, PackageCheck
} from "lucide-react";
import { PTImporter, InvoiceViewer } from "./PTImporter";
import { ManualPurchaseEntry } from "./ManualPurchaseEntry";

const API = "/purchase";
const getToken = () => localStorage.getItem("token");
const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
const fmtDate = (d) => {
  if (!d) return "—";
  let dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) {
    const serial = parseFloat(d);
    if (!isNaN(serial) && serial > 10000) {
      dateObj = new Date((Math.floor(serial - 25569)) * 86400 * 1000);
    } else {
      return String(d);
    }
  }
  if (dateObj.getFullYear() <= 1970) return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  return dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const Badge = ({ label, color = "slate" }) => {
  const map = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${map[color] || map.slate}`}>
      {label}
    </span>
  );
};

const KPICard = ({ icon: Icon, label, value, sub, color = "indigo", trend }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4">
    <div className={`p-3 rounded-xl bg-${color}-50`}>
      <Icon className={`w-5 h-5 text-${color}-600`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide truncate">{label}</p>
      <p className="text-xl font-black text-slate-800 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
    {trend !== undefined && (
      <div className={`flex items-center gap-0.5 text-xs font-bold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
        {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        {Math.abs(trend)}%
      </div>
    )}
  </div>
);

const Modal = ({ title, onClose, children, wide = false }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
    <div className={`bg-white rounded-2xl shadow-2xl border border-slate-100 w-full ${wide ? "max-w-4xl" : "max-w-lg"} max-h-[90vh] flex flex-col`}>
      <div className="flex items-center justify-between p-5 border-b border-slate-100">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">{title}</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
      </div>
      <div className="overflow-y-auto flex-1 p-5">{children}</div>
    </div>
  </div>
);

const InputRow = ({ label, children, required }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] uppercase font-bold text-slate-500">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    {children}
  </div>
);

const inputClass = "w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition-all bg-white";

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1: VENDOR MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
const VendorManagement = ({ vendors, setVendors, onAddNotification }) => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [viewVendor, setViewVendor] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [history, setHistory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const emptyForm = { name: "", businessName: "", gstin: "", panNumber: "", contactPerson: "", phone: "", email: "", address: "", city: "", state: "", country: "India", pinCode: "", paymentTerms: "Net 30", creditDays: 30, creditLimit: 100000, openingBalance: 0, category: "General", isPreferred: false, isActive: true, remarks: "" };
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => vendors.filter(v => {
    const q = search.toLowerCase();
    const matchQ = !q || v.name?.toLowerCase().includes(q) || v.phone?.includes(q) || v.gstin?.toLowerCase().includes(q) || v.businessName?.toLowerCase().includes(q);
    const matchS = filterStatus === "all" || (filterStatus === "active" ? v.isActive : !v.isActive);
    return matchQ && matchS;
  }), [vendors, search, filterStatus]);

  const openAdd = () => { setForm(emptyForm); setEditVendor(null); setShowModal(true); };
  const openEdit = (v) => { setForm({ ...emptyForm, ...v }); setEditVendor(v); setShowModal(true); };

  const openView = async (v) => {
    setViewVendor(v);
    try {
      const r = await fetch(`${API}/vendors/${v._id}/ledger`, { headers: authHeaders() });
      const d = r.data;
      if (d.success) setLedger(d.data);
    } catch { setLedger([]); }
    try {
      const r2 = await fetch(`${API}/vendors/${v._id}/history`, { headers: authHeaders() });
      const d2 = r2.data;
      if (d2.success) setHistory(d2);
    } catch { setHistory(null); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const url = editVendor ? `${API}/vendors/${editVendor._id}` : `${API}/vendors`;
      const method = editVendor ? "PUT" : "POST";
      const r = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
      const d = r.data;
      if (d.success) {
        if (editVendor) {
          setVendors(prev => prev.map(v => v._id === editVendor._id ? { ...d.data, id: d.data._id } : v));
          onAddNotification("Vendor Updated", `${form.name} updated successfully.`, "success");
        } else {
          setVendors(prev => [{ ...d.data, id: d.data._id }, ...prev]);
          onAddNotification("Vendor Added", `${form.name} registered successfully.`, "success");
        }
        setShowModal(false);
      } else {
        onAddNotification("Error", d.message, "danger");
      }
    } catch (err) { onAddNotification("Error", err.message, "danger"); }
    setIsLoading(false);
  };

  const handleDelete = async (v) => {
    if (!window.confirm(`Delete vendor "${v.name}"? This cannot be undone.`)) return;
    try {
      const r = await fetch(`${API}/vendors/${v._id}`, { method: "DELETE", headers: authHeaders() });
      const d = r.data;
      if (d.success) { setVendors(prev => prev.filter(x => x._id !== v._id)); onAddNotification("Vendor Deleted", `${v.name} removed.`, "success"); }
      else onAddNotification("Error", d.message, "danger");
    } catch (err) { onAddNotification("Error", err.message, "danger"); }
  };

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard icon={Building2} label="Total Vendors" value={vendors.length} color="indigo" />
        <KPICard icon={CheckCircle2} label="Active" value={vendors.filter(v => v.isActive).length} color="green" />
        <KPICard icon={Star} label="Preferred" value={vendors.filter(v => v.isPreferred).length} color="amber" />
        <KPICard icon={IndianRupee} label="Total Outstanding" value={`₹${fmt(vendors.reduce((s, v) => s + (v.currentOutstanding || 0), 0))}`} color="red" />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors..." className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-indigo-400 outline-none" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus className="w-3.5 h-3.5" /> Add Vendor
        </button>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <th className="p-3.5 text-left">Vendor</th>
                <th className="p-3.5 text-left">Contact</th>
                <th className="p-3.5 text-left">GSTIN</th>
                <th className="p-3.5 text-left">Category</th>
                <th className="p-3.5 text-right">Outstanding</th>
                <th className="p-3.5 text-right">Credit Limit</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="p-12 text-center text-slate-400">No vendors found. Add your first vendor.</td></tr>
              ) : filtered.map(v => (
                <tr key={v._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-black text-xs">{(v.name || "V")[0].toUpperCase()}</div>
                      <div>
                        <p className="font-bold text-slate-800 flex items-center gap-1">{v.name}{v.isPreferred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}</p>
                        <p className="text-slate-400">{v.businessName || v.vendorCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-1 text-slate-600"><Phone className="w-3 h-3" />{v.phone}</div>
                    <div className="flex items-center gap-1 text-slate-400 mt-0.5"><Mail className="w-3 h-3" />{v.email || "—"}</div>
                  </td>
                  <td className="p-3.5 font-mono text-slate-600 font-bold">{v.gstin || "—"}</td>
                  <td className="p-3.5"><Badge label={v.category || "General"} color="indigo" /></td>
                  <td className="p-3.5 text-right font-mono font-bold text-red-600">₹{fmt(v.currentOutstanding)}</td>
                  <td className="p-3.5 text-right font-mono text-slate-500">₹{fmt(v.creditLimit)}</td>
                  <td className="p-3.5 text-center"><Badge label={v.isActive ? "Active" : "Inactive"} color={v.isActive ? "green" : "red"} /></td>
                  <td className="p-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openView(v)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg" title="View Ledger"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => openEdit(v)} className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(v)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal title={editVendor ? "Edit Vendor" : "Add New Vendor"} onClose={() => setShowModal(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InputRow label="Vendor Name" required><input required className={inputClass} value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} /></InputRow>
              <InputRow label="Business Name"><input className={inputClass} value={form.businessName} onChange={e => setForm(p => ({...p, businessName: e.target.value}))} /></InputRow>
              <InputRow label="GSTIN"><input className={inputClass} value={form.gstin} onChange={e => setForm(p => ({...p, gstin: e.target.value}))} /></InputRow>
              <InputRow label="PAN Number"><input className={inputClass} value={form.panNumber} onChange={e => setForm(p => ({...p, panNumber: e.target.value}))} /></InputRow>
              <InputRow label="Contact Person"><input className={inputClass} value={form.contactPerson} onChange={e => setForm(p => ({...p, contactPerson: e.target.value}))} /></InputRow>
              <InputRow label="Mobile Number" required><input required className={inputClass} value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} /></InputRow>
              <InputRow label="Email"><input type="email" className={inputClass} value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} /></InputRow>
              <InputRow label="Category">
                <select className={inputClass} value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))}>
                  {["General","Fabric","Yarn","Accessories","Packaging","Other"].map(c => <option key={c}>{c}</option>)}
                </select>
              </InputRow>
              <InputRow label="Payment Terms">
                <select className={inputClass} value={form.paymentTerms} onChange={e => setForm(p => ({...p, paymentTerms: e.target.value}))}>
                  {["Net 7","Net 15","Net 30","Net 60","Advance","COD"].map(t => <option key={t}>{t}</option>)}
                </select>
              </InputRow>
              <InputRow label="Credit Days"><input type="number" className={inputClass} value={form.creditDays} onChange={e => setForm(p => ({...p, creditDays: Number(e.target.value)}))} /></InputRow>
              <InputRow label="Credit Limit (₹)"><input type="number" className={inputClass} value={form.creditLimit} onChange={e => setForm(p => ({...p, creditLimit: Number(e.target.value)}))} /></InputRow>
              <InputRow label="Opening Balance (₹)"><input type="number" className={inputClass} value={form.openingBalance} onChange={e => setForm(p => ({...p, openingBalance: Number(e.target.value)}))} /></InputRow>
              <InputRow label="City"><input className={inputClass} value={form.city} onChange={e => setForm(p => ({...p, city: e.target.value}))} /></InputRow>
              <InputRow label="State"><input className={inputClass} value={form.state} onChange={e => setForm(p => ({...p, state: e.target.value}))} /></InputRow>
              <div className="col-span-2"><InputRow label="Address"><input className={inputClass} value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))} /></InputRow></div>
              <div className="col-span-2"><InputRow label="Remarks"><textarea rows={2} className={inputClass} value={form.remarks} onChange={e => setForm(p => ({...p, remarks: e.target.value}))} /></InputRow></div>
            </div>
            <div className="flex gap-3 items-center">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                <input type="checkbox" checked={form.isPreferred} onChange={e => setForm(p => ({...p, isPreferred: e.target.checked}))} className="rounded" /> Preferred Supplier
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({...p, isActive: e.target.checked}))} className="rounded" /> Active
              </label>
            </div>
            <div className="flex gap-3 justify-end border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-xs font-bold bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
              <button type="submit" disabled={isLoading} className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50">
                <Save className="w-3.5 h-3.5" /> {isLoading ? "Saving..." : editVendor ? "Update Vendor" : "Create Vendor"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Vendor Detail / Ledger Modal */}
      {viewVendor && (
        <Modal title={`Vendor Ledger — ${viewVendor.name}`} onClose={() => setViewVendor(null)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 rounded-xl p-3"><p className="text-slate-400">Outstanding</p><p className="font-black text-red-600 text-lg">₹{fmt(viewVendor.currentOutstanding)}</p></div>
              <div className="bg-slate-50 rounded-xl p-3"><p className="text-slate-400">Credit Limit</p><p className="font-black text-slate-800 text-lg">₹{fmt(viewVendor.creditLimit)}</p></div>
              <div className="bg-slate-50 rounded-xl p-3"><p className="text-slate-400">Payment Terms</p><p className="font-black text-slate-800 text-lg">{viewVendor.paymentTerms}</p></div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Transaction Ledger</h4>
              {ledger.length === 0 ? <p className="text-xs text-slate-400 text-center py-6">No transactions yet.</p> : (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold">
                      <th className="p-2.5">Date</th><th className="p-2.5">Type</th><th className="p-2.5">Ref No</th><th className="p-2.5 text-right">Debit</th><th className="p-2.5 text-right">Credit</th><th className="p-2.5 text-right">Balance</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {ledger.map((e, i) => (
                        <tr key={i} className="hover:bg-slate-50/60">
                          <td className="p-2.5">{fmtDate(e.date)}</td>
                          <td className="p-2.5"><Badge label={e.type} color={e.type === "Invoice" ? "red" : e.type === "Payment" ? "green" : "amber"} /></td>
                          <td className="p-2.5 font-mono font-bold text-indigo-600">{e.refNo}</td>
                          <td className="p-2.5 text-right font-mono text-red-600">{e.debit > 0 ? `₹${fmt(e.debit)}` : "—"}</td>
                          <td className="p-2.5 text-right font-mono text-emerald-600">{e.credit > 0 ? `₹${fmt(e.credit)}` : "—"}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-800">₹{fmt(e.runningBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {history && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Recent Purchase Invoices</h4>
                {(!history.invoices || history.invoices.length === 0) ? <p className="text-xs text-slate-400 text-center py-4">No invoices yet.</p> : (
                  <div className="space-y-1.5">
                    {history.invoices.slice(0, 5).map((inv, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-xs">
                        <span className="font-mono font-bold text-indigo-600">{inv.invoiceNo}</span>
                        <span className="text-slate-500">{fmtDate(inv.invoiceDate)}</span>
                        <span className="font-bold text-slate-800">₹{fmt(inv.grandTotal)}</span>
                        <Badge label={inv.paymentStatus} color={inv.paymentStatus === "Paid" ? "green" : inv.paymentStatus === "Partial" ? "amber" : "red"} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2: GRN ENTRY
// ─────────────────────────────────────────────────────────────────────────────
const GRNEntry = ({ grns, setGrns, vendors, products, onAddNotification }) => {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ vendorId: "", referenceNo: "", receiveDate: new Date().toISOString().split("T")[0], warehouseId: "w-1", rackLocation: "", remarks: "", items: [] });
  const [grnItems, setGrnItems] = useState([{ productId: "", name: "", sku: "", color: "", size: "", batchNo: "", receivedQty: 1, acceptedQty: 1, rejectedQty: 0, damagedQty: 0, remarks: "" }]);

  const filtered = useMemo(() => grns.filter(g => {
    const q = search.toLowerCase();
    return !q || g.grnNo?.toLowerCase().includes(q) || g.vendorName?.toLowerCase().includes(q) || g.referenceNo?.toLowerCase().includes(q);
  }), [grns, search]);

  const addItem = () => setGrnItems(prev => [...prev, { productId: "", name: "", sku: "", color: "", size: "", batchNo: "", receivedQty: 1, acceptedQty: 1, rejectedQty: 0, damagedQty: 0, remarks: "" }]);
  const removeItem = (i) => setGrnItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => setGrnItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  const selectProduct = (i, pid) => {
    const p = products.find(x => x._id === pid || x.id === pid);
    if (p) updateItem(i, "productId", p._id || p.id);
    else updateItem(i, "productId", pid);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = grnItems.filter(it => it.productId);
    if (!form.vendorId || validItems.length === 0) { onAddNotification("Validation", "Select a vendor and at least one product.", "warning"); return; }
    setIsLoading(true);
    try {
      const payload = { ...form, items: validItems };
      const r = await fetch(`${API}/grn`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
      const d = r.data;
      if (d.success) {
        setGrns(prev => [{ ...d.data, id: d.data._id }, ...prev]);
        onAddNotification("GRN Created", `Goods Receipt Note ${d.data.grnNo} saved. Stock updated.`, "success");
        setShowModal(false);
        setGrnItems([{ productId: "", name: "", sku: "", color: "", size: "", batchNo: "", receivedQty: 1, acceptedQty: 1, rejectedQty: 0, damagedQty: 0, remarks: "" }]);
        setForm({ vendorId: "", referenceNo: "", receiveDate: new Date().toISOString().split("T")[0], warehouseId: "w-1", rackLocation: "", remarks: "", items: [] });
      } else { onAddNotification("Error", d.message, "danger"); }
    } catch (err) { onAddNotification("Error", err.message, "danger"); }
    setIsLoading(false);
  };

  const totalRecv = grns.reduce((s, g) => s + (g.items || []).reduce((ss, it) => ss + (it.receivedQty || 0), 0), 0);
  const totalAccept = grns.reduce((s, g) => s + (g.items || []).reduce((ss, it) => ss + (it.acceptedQty || 0), 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard icon={ClipboardList} label="Total GRNs" value={grns.length} color="indigo" />
        <KPICard icon={Package} label="Units Received" value={fmt(totalRecv)} color="blue" />
        <KPICard icon={CheckCircle2} label="Units Accepted" value={fmt(totalAccept)} color="green" />
        <KPICard icon={XCircle} label="Units Rejected" value={fmt(totalRecv - totalAccept)} color="red" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-3 items-center justify-between flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search GRN, vendor, ref..." className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-indigo-400 outline-none" />
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 shadow-sm">
          <Plus className="w-3.5 h-3.5" /> New GRN Entry
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <th className="p-3.5 text-left">GRN No</th><th className="p-3.5 text-left">Vendor</th><th className="p-3.5 text-left">Reference</th><th className="p-3.5 text-left">Date</th><th className="p-3.5 text-center">Items</th><th className="p-3.5 text-right">Received</th><th className="p-3.5 text-right">Accepted</th><th className="p-3.5 text-right">Rejected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? <tr><td colSpan={8} className="p-12 text-center text-slate-400">No GRN entries yet. Click "New GRN Entry" to start.</td></tr> :
                filtered.map(g => {
                  const recv = (g.items || []).reduce((s, it) => s + (it.receivedQty || 0), 0);
                  const acc = (g.items || []).reduce((s, it) => s + (it.acceptedQty || 0), 0);
                  const rej = (g.items || []).reduce((s, it) => s + (it.rejectedQty || 0) + (it.damagedQty || 0), 0);
                  return (
                    <tr key={g._id} className="hover:bg-slate-50/60">
                      <td className="p-3.5 font-mono font-bold text-indigo-600">{g.grnNo}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{g.vendorName}</td>
                      <td className="p-3.5 text-slate-500">{g.referenceNo || "—"}</td>
                      <td className="p-3.5 text-slate-500">{fmtDate(g.receiveDate)}</td>
                      <td className="p-3.5 text-center"><Badge label={`${(g.items || []).length} items`} color="indigo" /></td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-800">{recv}</td>
                      <td className="p-3.5 text-right font-mono text-emerald-600">{acc}</td>
                      <td className="p-3.5 text-right font-mono text-red-500">{rej || "—"}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title="New Goods Receipt Entry (GRN)" onClose={() => setShowModal(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InputRow label="Vendor" required>
                <select required className={inputClass} value={form.vendorId} onChange={e => setForm(p => ({...p, vendorId: e.target.value}))}>
                  <option value="">Select Vendor...</option>
                  {vendors.filter(v => v.isActive).map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                </select>
              </InputRow>
              <InputRow label="Reference No"><input className={inputClass} value={form.referenceNo} onChange={e => setForm(p => ({...p, referenceNo: e.target.value}))} /></InputRow>
              <InputRow label="Receive Date"><input type="date" className={inputClass} value={form.receiveDate} onChange={e => setForm(p => ({...p, receiveDate: e.target.value}))} /></InputRow>
              <InputRow label="Rack Location"><input className={inputClass} value={form.rackLocation} onChange={e => setForm(p => ({...p, rackLocation: e.target.value}))} placeholder="e.g. RCK-A-3" /></InputRow>
              <div className="col-span-2"><InputRow label="Remarks"><input className={inputClass} value={form.remarks} onChange={e => setForm(p => ({...p, remarks: e.target.value}))} /></InputRow></div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">Items Received</span>
                <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-500"><Plus className="w-3 h-3" />Add Row</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-100">
                    <th className="p-2.5 text-left">Product</th><th className="p-2.5 text-left">SKU</th><th className="p-2.5 text-left">Batch No</th><th className="p-2.5 text-right">Received</th><th className="p-2.5 text-right">Accepted</th><th className="p-2.5 text-right">Rejected</th><th className="p-2.5 text-right">Damaged</th><th className="p-2.5"></th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {grnItems.map((item, i) => (
                      <tr key={i}>
                        <td className="p-2">
                          <select className={`${inputClass} min-w-[160px]`} value={item.productId} onChange={e => selectProduct(i, e.target.value)}>
                            <option value="">Select Product...</option>
                            {products.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.name} ({p.sku})</option>)}
                          </select>
                        </td>
                        <td className="p-2"><input className={`${inputClass} w-24`} value={item.sku} onChange={e => updateItem(i, "sku", e.target.value)} placeholder="SKU" /></td>
                        <td className="p-2"><input className={`${inputClass} w-24`} value={item.batchNo} onChange={e => updateItem(i, "batchNo", e.target.value)} placeholder="BAT-001" /></td>
                        <td className="p-2"><input type="number" min={0} className={`${inputClass} w-20 text-right`} value={item.receivedQty} onChange={e => updateItem(i, "receivedQty", Number(e.target.value))} /></td>
                        <td className="p-2"><input type="number" min={0} className={`${inputClass} w-20 text-right`} value={item.acceptedQty} onChange={e => updateItem(i, "acceptedQty", Number(e.target.value))} /></td>
                        <td className="p-2"><input type="number" min={0} className={`${inputClass} w-20 text-right`} value={item.rejectedQty} onChange={e => updateItem(i, "rejectedQty", Number(e.target.value))} /></td>
                        <td className="p-2"><input type="number" min={0} className={`${inputClass} w-20 text-right`} value={item.damagedQty} onChange={e => updateItem(i, "damagedQty", Number(e.target.value))} /></td>
                        <td className="p-2"><button type="button" onClick={() => removeItem(i)} disabled={grnItems.length === 1} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30"><Trash2 className="w-3.5 h-3.5" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-xs font-bold bg-slate-100 rounded-xl">Cancel</button>
              <button type="submit" disabled={isLoading} className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50">
                <Save className="w-3.5 h-3.5" /> {isLoading ? "Processing..." : "Save GRN & Update Stock"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3: PURCHASE INVOICE MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
const PurchaseInvoiceManager = ({ purchaseInvoices, setPurchaseInvoices, vendors, products, onAddNotification }) => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCustomVendor, setIsCustomVendor] = useState(false);
  const [form, setForm] = useState({ vendorId: "", vendorName: "", invoiceNo: "", invoiceDate: new Date().toISOString().split("T")[0], dueDate: "", referenceNo: "", subTotal: 0, cgst: 0, sgst: 0, igst: 0, discount: 0, freight: 0, otherCharges: 0, grandTotal: 0, paymentTerms: "Net 30", amountPaid: 0, remarks: "", items: [] });
  const [invItems, setInvItems] = useState([{ productId: "", name: "", sku: "", quantity: 1, price: 0, taxPercent: 12, total: 0 }]);

  const filtered = useMemo(() => purchaseInvoices.filter(inv => {
    const q = search.toLowerCase();
    const matchQ = !q || inv.invoiceNo?.toLowerCase().includes(q) || inv.vendorName?.toLowerCase().includes(q) || inv.referenceNo?.toLowerCase().includes(q);
    const matchS = filterStatus === "all" || inv.paymentStatus === filterStatus;
    return matchQ && matchS;
  }), [purchaseInvoices, search, filterStatus]);

  const computeTotals = useCallback(() => {
    const sub = invItems.reduce((s, it) => s + (it.price || 0) * (it.quantity || 0), 0);
    const tax = invItems.reduce((s, it) => s + (it.price || 0) * (it.quantity || 0) * ((it.taxPercent || 0) / 100), 0);
    const grand = sub + tax + (form.freight || 0) + (form.otherCharges || 0) - (form.discount || 0) + (form.cgst || 0) + (form.sgst || 0) + (form.igst || 0);
    setForm(p => ({ ...p, subTotal: Math.round(sub), grandTotal: Math.round(grand) }));
    setInvItems(prev => prev.map(it => ({ ...it, total: Math.round(it.price * it.quantity + it.price * it.quantity * (it.taxPercent / 100)) })));
  }, [invItems, form.freight, form.otherCharges, form.discount, form.cgst, form.sgst, form.igst]);

  const updateInvItem = (i, field, val) => {
    setInvItems(prev => {
      const next = prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasVendor = form.vendorId || (form.vendorName && form.vendorName.trim());
    if (!hasVendor || !form.invoiceNo) { onAddNotification("Validation", "Vendor Name and Invoice No are required.", "warning"); return; }
    setIsLoading(true);
    const sub = invItems.reduce((s, it) => s + (it.price || 0) * (it.quantity || 0), 0);
    const grand = sub + (form.freight || 0) + (form.otherCharges || 0) + (form.cgst || 0) + (form.sgst || 0) + (form.igst || 0) - (form.discount || 0);
    try {
      const payload = { ...form, subTotal: sub, grandTotal: grand, items: invItems };
      const r = await fetch(`${API}/invoice`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
      const d = r.data;
      if (d.success) {
        setPurchaseInvoices(prev => [{ ...d.data, id: d.data._id }, ...prev]);
        onAddNotification("Invoice Created", `Purchase Invoice ${d.data.invoiceNo} saved. Vendor outstanding updated.`, "success");
        setShowModal(false);
      } else { onAddNotification("Error", d.message, "danger"); }
    } catch (err) { onAddNotification("Error", err.message, "danger"); }
    setIsLoading(false);
  };

  const totalBill = purchaseInvoices.reduce((s, inv) => s + (inv.grandTotal || 0), 0);
  const totalOut = purchaseInvoices.filter(inv => inv.paymentStatus !== "Paid").reduce((s, inv) => s + (inv.outstandingAmount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard icon={FileText} label="Total Invoices" value={purchaseInvoices.length} color="indigo" />
        <KPICard icon={IndianRupee} label="Total Billed" value={`₹${fmt(totalBill)}`} color="blue" />
        <KPICard icon={CheckCircle2} label="Paid" value={purchaseInvoices.filter(i => i.paymentStatus === "Paid").length} color="green" />
        <KPICard icon={AlertTriangle} label="Outstanding" value={`₹${fmt(totalOut)}`} color="red" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-3 items-center justify-between flex-wrap">
        <div className="flex gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices..." className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-indigo-400 outline-none" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none">
            <option value="all">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 shadow-sm">
          <Plus className="w-3.5 h-3.5" /> New Invoice
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <th className="p-3.5 text-left">Invoice No</th><th className="p-3.5 text-left">Vendor</th><th className="p-3.5 text-left">Invoice Date</th><th className="p-3.5 text-left">Due Date</th><th className="p-3.5 text-right">Grand Total</th><th className="p-3.5 text-right">Amount Paid</th><th className="p-3.5 text-right">Outstanding</th><th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? <tr><td colSpan={8} className="p-12 text-center text-slate-400">No purchase invoices yet.</td></tr> :
                filtered.map(inv => (
                  <tr key={inv._id} className="hover:bg-slate-50/60">
                    <td className="p-3.5 font-mono font-bold text-indigo-600">{inv.invoiceNo}</td>
                    <td className="p-3.5 font-semibold text-slate-800">{inv.vendorName}</td>
                    <td className="p-3.5 text-slate-500">{fmtDate(inv.invoiceDate)}</td>
                    <td className="p-3.5 text-slate-500">{fmtDate(inv.dueDate)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-800">₹{fmt(inv.grandTotal)}</td>
                    <td className="p-3.5 text-right font-mono text-emerald-600">₹{fmt(inv.amountPaid)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-red-600">₹{fmt(inv.outstandingAmount)}</td>
                    <td className="p-3.5 text-center"><Badge label={inv.paymentStatus} color={inv.paymentStatus === "Paid" ? "green" : inv.paymentStatus === "Partial" ? "amber" : "red"} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title="New Purchase Invoice" onClose={() => setShowModal(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <InputRow label="Vendor" required>
                {!isCustomVendor ? (
                  <select
                    required={!isCustomVendor}
                    className={inputClass}
                    value={form.vendorId}
                    onChange={(e) => {
                      if (e.target.value === "__MANUAL__") {
                        setIsCustomVendor(true);
                        setForm((p) => ({ ...p, vendorId: "", vendorName: "" }));
                      } else {
                        const selected = vendors.find((v) => v._id === e.target.value);
                        setForm((p) => ({
                          ...p,
                          vendorId: e.target.value,
                          vendorName: selected ? selected.name : "",
                        }));
                      }
                    }}
                  >
                    <option value="">Select Vendor...</option>
                    {vendors.filter((v) => v.isActive).map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.name}
                      </option>
                    ))}
                    <option value="__MANUAL__">✏️ Enter Custom Vendor Name...</option>
                  </select>
                ) : (
                  <div className="flex gap-1 w-full">
                    <input
                      required
                      className={inputClass}
                      placeholder="Enter vendor name manually..."
                      value={form.vendorName}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, vendorId: "", vendorName: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomVendor(false);
                        setForm((p) => ({ ...p, vendorId: "", vendorName: "" }));
                      }}
                      className="px-2 py-1 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 whitespace-nowrap cursor-pointer"
                      title="Switch back to vendor list"
                    >
                      List
                    </button>
                  </div>
                )}
              </InputRow>
              <InputRow label="Invoice No" required><input required className={inputClass} value={form.invoiceNo} onChange={e => setForm(p => ({...p, invoiceNo: e.target.value}))} /></InputRow>
              <InputRow label="Reference No"><input className={inputClass} value={form.referenceNo} onChange={e => setForm(p => ({...p, referenceNo: e.target.value}))} /></InputRow>
              <InputRow label="Invoice Date"><input type="date" className={inputClass} value={form.invoiceDate} onChange={e => setForm(p => ({...p, invoiceDate: e.target.value}))} /></InputRow>
              <InputRow label="Due Date"><input type="date" className={inputClass} value={form.dueDate} onChange={e => setForm(p => ({...p, dueDate: e.target.value}))} /></InputRow>
              <InputRow label="Payment Terms">
                <select className={inputClass} value={form.paymentTerms} onChange={e => setForm(p => ({...p, paymentTerms: e.target.value}))}>
                  {["Net 7","Net 15","Net 30","Net 60","Advance","COD"].map(t => <option key={t}>{t}</option>)}
                </select>
              </InputRow>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase">Invoice Items</span>
                <button type="button" onClick={() => setInvItems(p => [...p, { productId: "", name: "", sku: "", quantity: 1, price: 0, taxPercent: 12, total: 0 }])} className="flex items-center gap-1 text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg"><Plus className="w-3 h-3" />Add Row</button>
              </div>
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-100">
                  <th className="p-2.5 text-left">Product</th><th className="p-2.5 text-right">Qty</th><th className="p-2.5 text-right">Price</th><th className="p-2.5 text-right">Tax%</th><th className="p-2.5 text-right">Total</th><th className="p-2.5"></th>
                </tr></thead>
                <tbody>
                  {invItems.map((it, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="p-2"><select className={`${inputClass} min-w-[180px]`} value={it.productId} onChange={e => {
                        const p = products.find(x => (x._id || x.id) === e.target.value);
                        updateInvItem(i, "productId", e.target.value);
                        if (p) { updateInvItem(i, "name", p.name); updateInvItem(i, "sku", p.sku); updateInvItem(i, "price", p.purchasePrice || 0); }
                      }}>
                        <option value="">Select Product...</option>
                        {products.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>)}
                      </select></td>
                      <td className="p-2"><input type="number" min={1} className={`${inputClass} w-20 text-right`} value={it.quantity} onChange={e => updateInvItem(i, "quantity", Number(e.target.value))} /></td>
                      <td className="p-2"><input type="number" min={0} className={`${inputClass} w-24 text-right`} value={it.price} onChange={e => updateInvItem(i, "price", Number(e.target.value))} /></td>
                      <td className="p-2"><input type="number" min={0} className={`${inputClass} w-16 text-right`} value={it.taxPercent} onChange={e => updateInvItem(i, "taxPercent", Number(e.target.value))} /></td>
                      <td className="p-2 text-right font-mono font-bold text-slate-700">₹{fmt(it.price * it.quantity)}</td>
                      <td className="p-2"><button type="button" onClick={() => setInvItems(p => p.filter((_, j) => j !== i))} disabled={invItems.length === 1} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30"><Trash2 className="w-3.5 h-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <InputRow label="CGST (₹)"><input type="number" className={inputClass} value={form.cgst} onChange={e => setForm(p => ({...p, cgst: Number(e.target.value)}))} /></InputRow>
              <InputRow label="SGST (₹)"><input type="number" className={inputClass} value={form.sgst} onChange={e => setForm(p => ({...p, sgst: Number(e.target.value)}))} /></InputRow>
              <InputRow label="IGST (₹)"><input type="number" className={inputClass} value={form.igst} onChange={e => setForm(p => ({...p, igst: Number(e.target.value)}))} /></InputRow>
              <InputRow label="Discount (₹)"><input type="number" className={inputClass} value={form.discount} onChange={e => setForm(p => ({...p, discount: Number(e.target.value)}))} /></InputRow>
              <InputRow label="Freight (₹)"><input type="number" className={inputClass} value={form.freight} onChange={e => setForm(p => ({...p, freight: Number(e.target.value)}))} /></InputRow>
              <InputRow label="Other Charges (₹)"><input type="number" className={inputClass} value={form.otherCharges} onChange={e => setForm(p => ({...p, otherCharges: Number(e.target.value)}))} /></InputRow>
              <InputRow label="Amount Paid (₹)"><input type="number" className={inputClass} value={form.amountPaid} onChange={e => setForm(p => ({...p, amountPaid: Number(e.target.value)}))} /></InputRow>
              <div className="col-span-2"><InputRow label="Remarks"><input className={inputClass} value={form.remarks} onChange={e => setForm(p => ({...p, remarks: e.target.value}))} /></InputRow></div>
            </div>

            <div className="bg-indigo-50 rounded-xl p-3 flex justify-between items-center text-xs font-bold text-indigo-800">
              <span>Grand Total (Computed):</span>
              <span className="text-lg font-black">₹{fmt(invItems.reduce((s, it) => s + it.price * it.quantity, 0) + (form.cgst || 0) + (form.sgst || 0) + (form.igst || 0) + (form.freight || 0) + (form.otherCharges || 0) - (form.discount || 0))}</span>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-xs font-bold bg-slate-100 rounded-xl">Cancel</button>
              <button type="submit" disabled={isLoading} className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50">
                <Save className="w-3.5 h-3.5" /> {isLoading ? "Saving..." : "Save Purchase Invoice"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB 4: PURCHASE RETURNS
// ─────────────────────────────────────────────────────────────────────────────
const PurchaseReturns = ({ purchaseReturns, setPurchaseReturns, vendors, products, purchaseInvoices, onAddNotification }) => {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCustomVendor, setIsCustomVendor] = useState(false);
  const [isCustomInvRef, setIsCustomInvRef] = useState(false);
  const [form, setForm] = useState({ vendorId: "", vendorName: "", invoiceRef: "", productId: "", productName: "", sku: "", quantity: 1, reason: "", actionRequired: "Refund", remarks: "" });

  const filtered = useMemo(() => purchaseReturns.filter(r => {
    const q = search.toLowerCase();
    return !q || r.returnNo?.toLowerCase().includes(q) || r.vendorName?.toLowerCase().includes(q) || r.productName?.toLowerCase().includes(q);
  }), [purchaseReturns, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasVendor = form.vendorId || (form.vendorName && form.vendorName.trim());
    if (!hasVendor || !form.productId || form.quantity < 1) { onAddNotification("Validation", "Vendor, product and quantity are required.", "warning"); return; }
    setIsLoading(true);
    try {
      const r = await fetch(`${API}/return`, { method: "POST", headers: authHeaders(), body: JSON.stringify(form) });
      const d = r.data;
      if (d.success) {
        setPurchaseReturns(prev => [{ ...d.data, id: d.data._id }, ...prev]);
        onAddNotification("Return Created", `Purchase Return ${d.data.returnNo} dispatched. Inventory updated.`, "success");
        setShowModal(false);
        setForm({ vendorId: "", vendorName: "", invoiceRef: "", productId: "", productName: "", sku: "", quantity: 1, reason: "", actionRequired: "Refund", remarks: "" });
      } else { onAddNotification("Error", d.message, "danger"); }
    } catch (err) { onAddNotification("Error", err.message, "danger"); }
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard icon={RotateCcw} label="Total Returns" value={purchaseReturns.length} color="amber" />
        <KPICard icon={CheckCircle2} label="Approved" value={purchaseReturns.filter(r => r.status === "Approved").length} color="green" />
        <KPICard icon={RefreshCw} label="Replacements" value={purchaseReturns.filter(r => r.actionRequired === "Replacement").length} color="blue" />
        <KPICard icon={IndianRupee} label="Refunds" value={purchaseReturns.filter(r => r.actionRequired === "Refund").length} color="red" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search returns..." className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-indigo-400 outline-none" />
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-amber-700 shadow-sm">
          <Plus className="w-3.5 h-3.5" /> New Return
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <th className="p-3.5 text-left">Return No</th><th className="p-3.5 text-left">Vendor</th><th className="p-3.5 text-left">Product</th><th className="p-3.5 text-left">Inv Ref</th><th className="p-3.5 text-right">Qty</th><th className="p-3.5 text-left">Reason</th><th className="p-3.5 text-center">Action</th><th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? <tr><td colSpan={8} className="p-12 text-center text-slate-400">No purchase returns yet.</td></tr> :
                filtered.map(r => (
                  <tr key={r._id} className="hover:bg-slate-50/60">
                    <td className="p-3.5 font-mono font-bold text-amber-600">{r.returnNo}</td>
                    <td className="p-3.5 font-semibold text-slate-800">{r.vendorName}</td>
                    <td className="p-3.5 text-slate-600">{r.productName}</td>
                    <td className="p-3.5 text-slate-500">{r.invoiceRef || "—"}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-800">{r.quantity}</td>
                    <td className="p-3.5 text-slate-500 max-w-[150px] truncate">{r.reason}</td>
                    <td className="p-3.5 text-center"><Badge label={r.actionRequired} color={r.actionRequired === "Refund" ? "red" : "blue"} /></td>
                    <td className="p-3.5 text-center"><Badge label={r.status} color={r.status === "Approved" ? "green" : r.status === "Completed" ? "indigo" : "amber"} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title="Create Purchase Return" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <InputRow label="Vendor" required>
              {!isCustomVendor ? (
                <select
                  required={!isCustomVendor}
                  className={inputClass}
                  value={form.vendorId}
                  onChange={(e) => {
                    if (e.target.value === "__MANUAL__") {
                      setIsCustomVendor(true);
                      setForm((p) => ({ ...p, vendorId: "", vendorName: "" }));
                    } else {
                      const selected = vendors.find((v) => v._id === e.target.value);
                      setForm((p) => ({
                        ...p,
                        vendorId: e.target.value,
                        vendorName: selected ? selected.name : "",
                      }));
                    }
                  }}
                >
                  <option value="">Select Vendor...</option>
                  {vendors.filter((v) => v.isActive).map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name}
                    </option>
                  ))}
                  <option value="__MANUAL__">✏️ Enter Custom Vendor Name...</option>
                </select>
              ) : (
                <div className="flex gap-1 w-full">
                  <input
                    required
                    className={inputClass}
                    placeholder="Enter vendor name manually..."
                    value={form.vendorName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, vendorId: "", vendorName: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomVendor(false);
                      setForm((p) => ({ ...p, vendorId: "", vendorName: "" }));
                    }}
                    className="px-2 py-1 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 whitespace-nowrap cursor-pointer"
                    title="Switch back to vendor list"
                  >
                    List
                  </button>
                </div>
              )}
            </InputRow>
            <InputRow label="Invoice Reference">
              {!isCustomInvRef ? (
                <select
                  className={inputClass}
                  value={form.invoiceRef}
                  onChange={(e) => {
                    if (e.target.value === "__MANUAL__") {
                      setIsCustomInvRef(true);
                      setForm((p) => ({ ...p, invoiceRef: "" }));
                    } else {
                      setForm((p) => ({ ...p, invoiceRef: e.target.value }));
                    }
                  }}
                >
                  <option value="">Select Invoice (optional)...</option>
                  {purchaseInvoices
                    .filter((inv) => !form.vendorId || inv.vendorId === form.vendorId)
                    .map((inv) => (
                      <option key={inv._id} value={inv.invoiceNo}>
                        {inv.invoiceNo} — ₹{fmt(inv.grandTotal)} ({inv.vendorName})
                      </option>
                    ))}
                  <option value="__MANUAL__">✏️ Enter Custom Invoice Ref...</option>
                </select>
              ) : (
                <div className="flex gap-1 w-full">
                  <input
                    className={inputClass}
                    placeholder="Enter custom invoice ref (e.g. INV-9901)..."
                    value={form.invoiceRef}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, invoiceRef: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomInvRef(false);
                      setForm((p) => ({ ...p, invoiceRef: "" }));
                    }}
                    className="px-2 py-1 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 whitespace-nowrap cursor-pointer"
                    title="Switch back to invoice list"
                  >
                    List
                  </button>
                </div>
              )}
            </InputRow>
            <InputRow label="Product" required>
              <select required className={inputClass} value={form.productId} onChange={e => {
                const p = products.find(x => (x._id || x.id) === e.target.value);
                setForm(prev => ({...prev, productId: e.target.value, productName: p?.name || "", sku: p?.sku || ""}));
              }}>
                <option value="">Select Product...</option>
                {products.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </InputRow>
            <InputRow label="Quantity Returned" required>
              <input type="number" min={1} required className={inputClass} value={form.quantity} onChange={e => setForm(p => ({...p, quantity: Number(e.target.value)}))} />
            </InputRow>
            <InputRow label="Return Reason"><textarea rows={2} className={inputClass} value={form.reason} onChange={e => setForm(p => ({...p, reason: e.target.value}))} /></InputRow>
            <InputRow label="Action Required">
              <select className={inputClass} value={form.actionRequired} onChange={e => setForm(p => ({...p, actionRequired: e.target.value}))}>
                <option value="Refund">Refund</option>
                <option value="Replacement">Replacement</option>
              </select>
            </InputRow>
            <InputRow label="Remarks"><input className={inputClass} value={form.remarks} onChange={e => setForm(p => ({...p, remarks: e.target.value}))} /></InputRow>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-xs font-bold bg-slate-100 rounded-xl">Cancel</button>
              <button type="submit" disabled={isLoading} className="px-5 py-2 text-xs font-bold bg-amber-600 text-white rounded-xl hover:bg-amber-700 flex items-center gap-2 disabled:opacity-50">
                <Save className="w-3.5 h-3.5" /> {isLoading ? "Dispatching..." : "Dispatch Return"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB 5: PENDING PURCHASE TRACKING
// ─────────────────────────────────────────────────────────────────────────────
const PendingTracking = ({ pendingPurchases, setPendingPurchases, onAddNotification }) => {
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      const r = await fetch(`${API}/pending-tracking`, { headers: authHeaders() });
      const d = r.data;
      if (d.success) setPendingPurchases(d.data);
    } catch { }
    setIsRefreshing(false);
  };

  const filtered = useMemo(() => pendingPurchases.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !q || p.vendorName?.toLowerCase().includes(q) || p.productName?.toLowerCase().includes(q) || p.referenceNo?.toLowerCase().includes(q);
    const matchP = filterPriority === "all" || p.priority === filterPriority;
    return matchQ && matchP;
  }), [pendingPurchases, search, filterPriority]);

  const delayed = filtered.filter(p => p.delayDays > 0).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard icon={Clock} label="Pending Items" value={filtered.length} color="amber" />
        <KPICard icon={AlertTriangle} label="Delayed" value={delayed} color="red" />
        <KPICard icon={Truck} label="High Priority" value={filtered.filter(p => p.priority === "High").length} color="red" />
        <KPICard icon={CheckCircle2} label="On Time" value={filtered.filter(p => p.status === "On Time").length} color="green" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-3 items-center justify-between flex-wrap">
        <div className="flex gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by vendor, product..." className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-indigo-400 outline-none" />
          </div>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none">
            <option value="all">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <button onClick={refresh} className="flex items-center gap-1.5 bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-700 shadow-sm">
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <th className="p-3.5 text-left">Vendor</th><th className="p-3.5 text-left">Product</th><th className="p-3.5 text-left">PO Ref</th><th className="p-3.5 text-right">Ordered</th><th className="p-3.5 text-right">Received</th><th className="p-3.5 text-right">Pending</th><th className="p-3.5 text-left">Expected</th><th className="p-3.5 text-right">Delay</th><th className="p-3.5 text-center">Priority</th><th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? <tr><td colSpan={10} className="p-12 text-center text-slate-400">No pending purchases. All orders are fulfilled.</td></tr> :
                filtered.map((p, i) => (
                  <tr key={i} className={`hover:bg-slate-50/60 ${p.delayDays > 0 ? "bg-red-50/20" : ""}`}>
                    <td className="p-3.5 font-semibold text-slate-800">{p.vendorName}</td>
                    <td className="p-3.5 text-slate-600">{p.productName}</td>
                    <td className="p-3.5 font-mono text-indigo-600">{p.referenceNo}</td>
                    <td className="p-3.5 text-right font-mono">{p.orderedQty}</td>
                    <td className="p-3.5 text-right font-mono text-emerald-600">{p.receivedQty}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-amber-600">{p.pendingQty}</td>
                    <td className="p-3.5 text-slate-500">{fmtDate(p.expectedDeliveryDate)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-red-600">{p.delayDays > 0 ? `${p.delayDays}d` : "—"}</td>
                    <td className="p-3.5 text-center"><Badge label={p.priority} color={p.priority === "High" ? "red" : p.priority === "Medium" ? "amber" : "green"} /></td>
                    <td className="p-3.5 text-center"><Badge label={p.status} color={p.status === "Delayed" ? "red" : "green"} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB 6: PURCHASE REPORTS
// ─────────────────────────────────────────────────────────────────────────────
const PurchaseReportsTab = ({ purchaseReports, setPurchaseReports, onAddNotification }) => {
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split("T")[0]; });
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState("vendor");

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const r = await fetch(`${API}/reports?startDate=${startDate}&endDate=${endDate}`, { headers: authHeaders() });
      const d = r.data;
      if (d.success) { setPurchaseReports(d); onAddNotification("Reports Loaded", "Purchase reports generated successfully.", "success"); }
    } catch (err) { onAddNotification("Error", err.message, "danger"); }
    setIsLoading(false);
  };

  const exportExcel = (data, filename) => {
    try {
      const XLSX = window.XLSX || (typeof require !== "undefined" ? require("xlsx") : null);
      if (!XLSX) { onAddNotification("Export", "Please use the download button for Excel export.", "warning"); return; }
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch { onAddNotification("Export", "Export feature requires XLSX library.", "warning"); }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-slate-400">From Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-slate-400">To Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none" />
        </div>
        <button onClick={fetchReports} disabled={isLoading} className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50">
          <BarChart3 className={`w-3.5 h-3.5 ${isLoading ? "animate-pulse" : ""}`} /> {isLoading ? "Generating..." : "Generate Reports"}
        </button>
      </div>

      {purchaseReports && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard icon={IndianRupee} label="Total Purchase" value={`₹${fmt(purchaseReports.summary?.totalPurchase)}`} color="indigo" />
            <KPICard icon={FileText} label="Invoices" value={purchaseReports.summary?.invoiceCount || 0} color="blue" />
            <KPICard icon={TrendingUp} label="Total Tax" value={`₹${fmt(purchaseReports.summary?.totalTax)}`} color="amber" />
            <KPICard icon={RotateCcw} label="Returns Value" value={`₹${fmt(purchaseReports.summary?.totalReturns)}`} color="red" />
          </div>

          {/* View toggle */}
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
            {[["vendor","Vendor-wise"],["product","Product-wise"],["daily","Daily"],["monthly","Monthly"],["gst","GST Register"],["returns","Returns"]].map(([v,l]) => (
              <button key={v} onClick={() => setActiveView(v)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeView === v ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{l}</button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase">
                {activeView === "vendor" && "Vendor-wise Purchase Summary"}
                {activeView === "product" && "Product-wise Purchase Summary"}
                {activeView === "daily" && "Daily Purchase Summary"}
                {activeView === "monthly" && "Monthly Purchase Summary"}
                {activeView === "gst" && "GST Purchase Register"}
                {activeView === "returns" && "Purchase Returns Report"}
              </h4>
              <button onClick={() => {
                const dataMap = { vendor: purchaseReports.vendorWise, product: purchaseReports.productWise, daily: purchaseReports.daily, monthly: purchaseReports.monthly, gst: purchaseReports.gstRegister, returns: purchaseReports.returns };
                exportExcel(dataMap[activeView] || [], `purchase_${activeView}_report`);
              }} className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100">
                <Download className="w-3.5 h-3.5" /> Export Excel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                {activeView === "vendor" && (<>
                  <thead><tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-100"><th className="p-3.5 text-left">Vendor</th><th className="p-3.5 text-right">Amount</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">{(purchaseReports.vendorWise || []).map((r, i) => <tr key={i} className="hover:bg-slate-50/60"><td className="p-3.5 font-semibold text-slate-800">{r.vendor}</td><td className="p-3.5 text-right font-mono font-bold text-slate-800">₹{fmt(r.amount)}</td></tr>)}</tbody>
                </>)}
                {activeView === "product" && (<>
                  <thead><tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-100"><th className="p-3.5 text-left">Product</th><th className="p-3.5 text-right">Amount</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">{(purchaseReports.productWise || []).map((r, i) => <tr key={i} className="hover:bg-slate-50/60"><td className="p-3.5 font-semibold text-slate-800">{r.product}</td><td className="p-3.5 text-right font-mono font-bold text-slate-800">₹{fmt(r.amount)}</td></tr>)}</tbody>
                </>)}
                {activeView === "daily" && (<>
                  <thead><tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-100"><th className="p-3.5 text-left">Date</th><th className="p-3.5 text-right">Amount</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">{(purchaseReports.daily || []).map((r, i) => <tr key={i} className="hover:bg-slate-50/60"><td className="p-3.5 font-mono text-slate-600">{r.date}</td><td className="p-3.5 text-right font-mono font-bold text-slate-800">₹{fmt(r.amount)}</td></tr>)}</tbody>
                </>)}
                {activeView === "monthly" && (<>
                  <thead><tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-100"><th className="p-3.5 text-left">Month</th><th className="p-3.5 text-right">Amount</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">{(purchaseReports.monthly || []).map((r, i) => <tr key={i} className="hover:bg-slate-50/60"><td className="p-3.5 font-mono text-slate-600">{r.month}</td><td className="p-3.5 text-right font-mono font-bold text-slate-800">₹{fmt(r.amount)}</td></tr>)}</tbody>
                </>)}
                {activeView === "gst" && (<>
                  <thead><tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-100"><th className="p-3.5 text-left">Invoice No</th><th className="p-3.5 text-left">Date</th><th className="p-3.5 text-left">Vendor</th><th className="p-3.5 text-right">Taxable</th><th className="p-3.5 text-right">CGST</th><th className="p-3.5 text-right">SGST</th><th className="p-3.5 text-right">IGST</th><th className="p-3.5 text-right">Total GST</th><th className="p-3.5 text-right">Grand Total</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">{(purchaseReports.gstRegister || []).map((r, i) => <tr key={i} className="hover:bg-slate-50/60">
                    <td className="p-3.5 font-mono font-bold text-indigo-600">{r.invoiceNo}</td><td className="p-3.5 text-slate-500">{fmtDate(r.invoiceDate)}</td><td className="p-3.5">{r.vendorName}</td>
                    <td className="p-3.5 text-right font-mono">₹{fmt(r.taxableAmount)}</td><td className="p-3.5 text-right font-mono">₹{fmt(r.cgst)}</td><td className="p-3.5 text-right font-mono">₹{fmt(r.sgst)}</td><td className="p-3.5 text-right font-mono">₹{fmt(r.igst)}</td><td className="p-3.5 text-right font-mono font-bold text-amber-600">₹{fmt(r.totalGst)}</td><td className="p-3.5 text-right font-mono font-bold text-slate-800">₹{fmt(r.grandTotal)}</td>
                  </tr>)}</tbody>
                </>)}
                {activeView === "returns" && (<>
                  <thead><tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-100"><th className="p-3.5 text-left">Return No</th><th className="p-3.5 text-left">Vendor</th><th className="p-3.5 text-left">Product</th><th className="p-3.5 text-right">Qty</th><th className="p-3.5 text-center">Action</th><th className="p-3.5 text-center">Status</th><th className="p-3.5 text-right">Refund Amt</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">{(purchaseReports.returns || []).map((r, i) => <tr key={i} className="hover:bg-slate-50/60">
                    <td className="p-3.5 font-mono font-bold text-amber-600">{r.returnNo}</td><td className="p-3.5">{r.vendorName}</td><td className="p-3.5 text-slate-600">{r.productName}</td><td className="p-3.5 text-right font-mono">{r.quantity}</td>
                    <td className="p-3.5 text-center"><Badge label={r.action} color={r.action === "Refund" ? "red" : "blue"} /></td><td className="p-3.5 text-center"><Badge label={r.status} color="green" /></td><td className="p-3.5 text-right font-mono font-bold text-red-600">₹{fmt(r.refundAmount)}</td>
                  </tr>)}</tbody>
                </>)}
              </table>
              {!purchaseReports[activeView === "vendor" ? "vendorWise" : activeView === "product" ? "productWise" : activeView === "gst" ? "gstRegister" : activeView]?.length && (
                <p className="text-xs text-slate-400 text-center py-6">No data for selected period.</p>
              )}
            </div>
          </div>
        </>
      )}
      {!purchaseReports && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <BarChart3 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-400">Select date range and click "Generate Reports"</p>
          <p className="text-xs text-slate-300 mt-1">Vendor-wise, Product-wise, GST Register and more.</p>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB 7: VENDOR OUTSTANDING REPORTS
// ─────────────────────────────────────────────────────────────────────────────
const VendorOutstandingReports = ({ vendorOutstanding, setVendorOutstanding, onAddNotification }) => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [payModal, setPayModal] = useState(null);
  const [payForm, setPayForm] = useState({ amount: 0, paymentMode: "Cash", referenceNo: "", remarks: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [histModal, setHistModal] = useState(null);

  const filtered = useMemo(() => vendorOutstanding.filter(o => {
    const q = search.toLowerCase();
    const matchQ = !q || o.invoiceNo?.toLowerCase().includes(q) || o.vendorId?.name?.toLowerCase().includes(q);
    const matchS = filterStatus === "all" || o.paymentStatus === filterStatus;
    return matchQ && matchS;
  }), [vendorOutstanding, search, filterStatus]);

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!payModal || payForm.amount <= 0) { onAddNotification("Validation", "Payment amount must be greater than 0.", "warning"); return; }
    setIsLoading(true);
    try {
      const r = await fetch(`${API}/payment`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ invoiceId: payModal.purchaseInvoiceId, amount: payForm.amount, paymentMode: payForm.paymentMode, referenceNo: payForm.referenceNo, remarks: payForm.remarks }) });
      const d = r.data;
      if (d.success) {
        // Refresh outstanding list
        const r2 = await fetch(`${API}/outstanding`, { headers: authHeaders() });
        const d2 = r2.data;
        if (d2.success) setVendorOutstanding(d2.data.map(o => ({...o, id: o._id})));
        onAddNotification("Payment Recorded", `₹${fmt(payForm.amount)} paid against ${payModal.invoiceNo}.`, "success");
        setPayModal(null);
        setPayForm({ amount: 0, paymentMode: "Cash", referenceNo: "", remarks: "" });
      } else { onAddNotification("Error", d.message, "danger"); }
    } catch (err) { onAddNotification("Error", err.message, "danger"); }
    setIsLoading(false);
  };

  const totalOutstanding = vendorOutstanding.filter(o => o.paymentStatus !== "Paid").reduce((s, o) => s + (o.outstandingAmount || 0), 0);
  const overdue = vendorOutstanding.filter(o => o.overdueDays > 0 && o.paymentStatus !== "Paid").length;

  // Ageing buckets
  const buckets = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
  vendorOutstanding.filter(o => o.paymentStatus !== "Paid").forEach(o => {
    const d = o.daysOutstanding || 0;
    if (d <= 30) buckets["0-30"] += o.outstandingAmount || 0;
    else if (d <= 60) buckets["31-60"] += o.outstandingAmount || 0;
    else if (d <= 90) buckets["61-90"] += o.outstandingAmount || 0;
    else buckets["90+"] += o.outstandingAmount || 0;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard icon={Wallet} label="Total Outstanding" value={`₹${fmt(totalOutstanding)}`} color="red" />
        <KPICard icon={AlertTriangle} label="Overdue Invoices" value={overdue} color="amber" />
        <KPICard icon={CheckCircle2} label="Paid Invoices" value={vendorOutstanding.filter(o => o.paymentStatus === "Paid").length} color="green" />
        <KPICard icon={FileText} label="Total Invoices" value={vendorOutstanding.length} color="indigo" />
      </div>

      {/* Ageing Analysis */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Ageing Analysis</h4>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(buckets).map(([range, amt]) => (
            <div key={range} className={`rounded-xl p-3 border ${range === "90+" ? "bg-red-50 border-red-200" : range === "61-90" ? "bg-orange-50 border-orange-200" : range === "31-60" ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"}`}>
              <p className="text-[10px] font-bold text-slate-500 uppercase">{range} Days</p>
              <p className={`text-lg font-black ${range === "90+" ? "text-red-700" : range === "61-90" ? "text-orange-700" : range === "31-60" ? "text-amber-700" : "text-slate-700"}`}>₹{fmt(amt)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-3 items-center justify-between flex-wrap">
        <div className="flex gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoice, vendor..." className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-indigo-400 outline-none" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none">
            <option value="all">All Status</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partial">Partial</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <th className="p-3.5 text-left">Invoice No</th><th className="p-3.5 text-left">Invoice Date</th><th className="p-3.5 text-right">Bill Amount</th><th className="p-3.5 text-right">Paid</th><th className="p-3.5 text-right">Outstanding</th><th className="p-3.5 text-left">Due Date</th><th className="p-3.5 text-right">Days Out</th><th className="p-3.5 text-right">Overdue</th><th className="p-3.5 text-center">Status</th><th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? <tr><td colSpan={10} className="p-12 text-center text-slate-400">No outstanding invoices.</td></tr> :
                filtered.map(o => (
                  <tr key={o._id} className={`hover:bg-slate-50/60 ${o.overdueDays > 0 && o.paymentStatus !== "Paid" ? "bg-red-50/20" : ""}`}>
                    <td className="p-3.5 font-mono font-bold text-indigo-600">{o.invoiceNo}</td>
                    <td className="p-3.5 text-slate-500">{fmtDate(o.invoiceDate)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-800">₹{fmt(o.billAmount)}</td>
                    <td className="p-3.5 text-right font-mono text-emerald-600">₹{fmt(o.amountPaid)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-red-600">₹{fmt(o.outstandingAmount)}</td>
                    <td className="p-3.5 text-slate-500">{fmtDate(o.dueDate)}</td>
                    <td className="p-3.5 text-right font-mono text-slate-600">{o.daysOutstanding}d</td>
                    <td className="p-3.5 text-right font-mono font-bold text-red-600">{o.overdueDays > 0 ? `${o.overdueDays}d` : "—"}</td>
                    <td className="p-3.5 text-center"><Badge label={o.paymentStatus} color={o.paymentStatus === "Paid" ? "green" : o.paymentStatus === "Partial" ? "amber" : "red"} /></td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-1">
                        {o.paymentStatus !== "Paid" && (
                          <button onClick={() => { setPayModal(o); setPayForm({ amount: o.outstandingAmount, paymentMode: "Cash", referenceNo: "", remarks: "" }); }} className="px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-[10px] font-bold flex items-center gap-1">
                            <IndianRupee className="w-3 h-3" /> Pay
                          </button>
                        )}
                        {o.paymentHistory?.length > 0 && (
                          <button onClick={() => setHistModal(o)} className="px-2.5 py-1 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-[10px] font-bold flex items-center gap-1">
                            <Eye className="w-3 h-3" /> History
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {payModal && (
        <Modal title={`Record Payment — ${payModal.invoiceNo}`} onClose={() => setPayModal(null)}>
          <div className="mb-4 bg-slate-50 rounded-xl p-3 grid grid-cols-3 gap-2 text-xs">
            <div><p className="text-slate-400">Bill Amount</p><p className="font-black text-slate-800">₹{fmt(payModal.billAmount)}</p></div>
            <div><p className="text-slate-400">Already Paid</p><p className="font-black text-emerald-600">₹{fmt(payModal.amountPaid)}</p></div>
            <div><p className="text-slate-400">Outstanding</p><p className="font-black text-red-600">₹{fmt(payModal.outstandingAmount)}</p></div>
          </div>
          <form onSubmit={handlePayment} className="space-y-3">
            <InputRow label="Payment Amount (₹)" required>
              <input type="number" required min={0.01} max={payModal.outstandingAmount} step="0.01" className={inputClass} value={payForm.amount} onChange={e => setPayForm(p => ({...p, amount: Number(e.target.value)}))} />
            </InputRow>
            <InputRow label="Payment Mode">
              <select className={inputClass} value={payForm.paymentMode} onChange={e => setPayForm(p => ({...p, paymentMode: e.target.value}))}>
                {["Cash","Bank Transfer","UPI","Cheque","Credit Card","Other"].map(m => <option key={m}>{m}</option>)}
              </select>
            </InputRow>
            <InputRow label="Reference / Transaction No"><input className={inputClass} value={payForm.referenceNo} onChange={e => setPayForm(p => ({...p, referenceNo: e.target.value}))} placeholder="UTR / Cheque / UPI Ref" /></InputRow>
            <InputRow label="Remarks"><input className={inputClass} value={payForm.remarks} onChange={e => setPayForm(p => ({...p, remarks: e.target.value}))} /></InputRow>
            <div className="bg-indigo-50 rounded-xl p-3 text-xs font-bold text-indigo-800 flex justify-between">
              <span>Remaining after payment:</span>
              <span>₹{fmt(Math.max(0, payModal.outstandingAmount - payForm.amount))}</span>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setPayModal(null)} className="px-5 py-2 text-xs font-bold bg-slate-100 rounded-xl">Cancel</button>
              <button type="submit" disabled={isLoading} className="px-5 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50">
                <CheckCircle2 className="w-3.5 h-3.5" /> {isLoading ? "Processing..." : "Record Payment"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Payment History Modal */}
      {histModal && (
        <Modal title={`Payment History — ${histModal.invoiceNo}`} onClose={() => setHistModal(null)}>
          <div className="space-y-2">
            {(histModal.paymentHistory || []).length === 0 ? <p className="text-xs text-slate-400 text-center py-6">No payment history found.</p> :
              histModal.paymentHistory.map((p, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 text-xs">
                  <div>
                    <p className="font-bold text-slate-800">₹{fmt(p.amount)}</p>
                    <p className="text-slate-400">{p.paymentMode} {p.referenceNo ? `· ${p.referenceNo}` : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-600">{fmtDate(p.date)}</p>
                    {p.remarks && <p className="text-slate-400">{p.remarks}</p>}
                  </div>
                </div>
              ))}
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PURCHASE VIEW
// ─────────────────────────────────────────────────────────────────────────────
export const PurchaseView = ({
  vendors = [], setVendors,
  grns = [], setGrns,
  purchaseInvoices = [], setPurchaseInvoices,
  purchaseReturns = [], setPurchaseReturns,
  pendingPurchases = [], setPendingPurchases,
  vendorOutstanding = [], setVendorOutstanding,
  purchaseReports, setPurchaseReports,
  products = [], setProducts,
  suppliers = [], setSuppliers,
  purchaseOrders = [], setPurchaseOrders,
  onAddPurchaseOrder,
  onUpdatePurchaseOrder,
  onDeletePurchaseOrder,
  onAddNotification,
}) => {
  const [activeTab, setActiveTab] = useState("pos");
  const [showImporter, setShowImporter] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [editingPO, setEditingPO] = useState(null);
  const [viewingPO, setViewingPO] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Permanently sync & fetch PT Import History and Purchase Bills directly from Database on mount
  React.useEffect(() => {
    const fetchPOHistory = async () => {
      try {
        const res = await api.get('/purchase-orders');
        const dataOrBills = Array.isArray(res.data?.data)
          ? res.data.data
          : (Array.isArray(res.data?.data?.bills) ? res.data.data.bills : []);
        if (dataOrBills.length > 0 && setPurchaseOrders) {
          setPurchaseOrders(dataOrBills.map(p => ({ ...p, id: p._id || p.id })));
        }
      } catch (err) {
        console.warn("Could not refetch purchase orders on PurchaseView mount:", err);
      }
    };
    fetchPOHistory();
  }, [setPurchaseOrders]);

  // Quick Draft PO Modal State
  const [showPOModal, setShowPOModal] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState("");
  const [poProductId, setPoProductId] = useState("");
  const [poQty, setPoQty] = useState(100);

  const tabs = [
    { id: "pos",         label: "Procurement & Purchase Orders (PO)", icon: FileText },
    { id: "grn",         label: "Goods Receipt (GRN)",     icon: ClipboardList },
    { id: "invoice",     label: "Purchase Invoices",       icon: FileText },
    { id: "returns",     label: "Purchase Returns",        icon: RotateCcw },
    { id: "pending",     label: "Pending Tracking",        icon: Clock },
    { id: "reports",     label: "Purchase Reports",        icon: BarChart3 },
  ];

  const handleCreatePOSubmit = async (e) => {
    e.preventDefault();
    if (!poSupplierId || !poProductId) return;

    const matchedSupplier = (suppliers || []).find((s) => (s._id || s.id) === poSupplierId);
    const matchedProduct = (products || []).find((p) => (p._id || p.id) === poProductId);

    if (!matchedSupplier || !matchedProduct) return;

    const subTotal = (matchedProduct.purchasePrice || 0) * poQty;
    const gstTotal = Math.floor(subTotal * ((matchedProduct.gstPercent || 12) / 100));
    const grandTotal = subTotal + gstTotal;

    const newPO = {
      id: `po-${Date.now()}`,
      poNo: `PO-${20260000 + (purchaseOrders?.length || 0) + 1}`,
      date: new Date().toISOString().split("T")[0],
      supplierId: poSupplierId,
      supplierName: matchedSupplier.name,
      items: [
        {
          productId: poProductId,
          name: matchedProduct.name,
          quantity: poQty,
          purchasePrice: matchedProduct.purchasePrice || 0,
          totalPrice: subTotal,
        },
      ],
      subTotal,
      gstTotal,
      grandTotal,
      status: "Pending",
      outstandingPaid: 0,
    };

    if (onAddPurchaseOrder) {
      await onAddPurchaseOrder(newPO);
    } else if (setPurchaseOrders) {
      setPurchaseOrders((prev) => [newPO, ...prev]);
    }

    if (onAddNotification) {
      onAddNotification(
        "Supply Chain Ledger",
        `Created Purchase Order ${newPO.poNo} for ₹${newPO.grandTotal.toLocaleString("en-IN")}`,
        "success"
      );
    }
    setShowPOModal(false);
    setPoSupplierId("");
    setPoProductId("");
    setPoQty(100);
  };

  const handleViewVoucher = async (po) => {
    setViewingPO(po);
    const poId = po._id || po.id;
    if (poId) {
      try {
        const res = await api.get(`/purchase-orders/${poId}`);
        const data = res.data;
        if (data?.success && data.data) {
          const fullVoucher = data.data;
          setViewingPO(prev => ({
            ...prev,
            ...fullVoucher,
            items: (Array.isArray(fullVoucher.items) && fullVoucher.items.length > 0)
              ? fullVoucher.items
              : (prev?.items || prev?.billItems || prev?.products || [])
          }));
        }
      } catch (err) {
        console.warn("Could not fetch detailed PO from API, using cached voucher:", err);
      }
    }
  };

  const filteredPOs = useMemo(() => {
    if (!searchTerm) return purchaseOrders;
    const term = searchTerm.toLowerCase();
    return (purchaseOrders || []).filter((po) => {
      const poNo = (po.poNo || po.invoiceNo || po.id || "").toLowerCase();
      const sup = (po.supplierName || po.vendorName || "").toLowerCase();
      const items = (Array.isArray(po.items)
        ? po.items.map((i) => i.name || i.itemName || "").join(" ")
        : (po.items || "")
      ).toLowerCase();
      return poNo.includes(term) || sup.includes(term) || items.includes(term);
    });
  }, [purchaseOrders, searchTerm]);

  if (showImporter) {
    return (
      <div className="animate-fade-in pb-12">
        <PTImporter
          products={products}
          setProducts={setProducts}
          suppliers={suppliers}
          setSuppliers={setSuppliers}
          purchaseOrders={purchaseOrders}
          onAddPurchaseOrder={onAddPurchaseOrder}
          onAddNotification={onAddNotification}
          onClose={() => setShowImporter(false)}
        />
      </div>
    );
  }

  if (showManualEntry || editingPO) {
    return (
      <div className="animate-fade-in pb-12">
        <ManualPurchaseEntry
          initialPO={editingPO}
          isEditMode={!!editingPO}
          onAddPurchaseOrder={onAddPurchaseOrder}
          onUpdatePurchaseOrder={onUpdatePurchaseOrder}
          onAddNotification={onAddNotification}
          onClose={() => {
            setShowManualEntry(false);
            setEditingPO(null);
          }}
        />
      </div>
    );
  }

  if (viewingPO) {
    // Wrapper with a proper ref so InvoiceViewer can access the DOM node for printing/downloading
    const ViewerWrapper = () => {
      const ivRef = React.useRef(null);
      const handleDownload = () => {
        if (!ivRef.current || !viewingPO) return;
        const htmlContent = `<!DOCTYPE html><html><head><title>Invoice - ${viewingPO.poNo || viewingPO.invoiceNo}</title><script src="https://cdn.tailwindcss.com"><\/script></head><body class="bg-white p-8">${ivRef.current.outerHTML}</body></html>`;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice-${viewingPO.poNo || viewingPO.invoiceNo}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      };
      const handleWA = () => {
        if (!viewingPO) return;
        const text = `*Purchase Voucher*\n\nVoucher No: ${viewingPO.poNo || viewingPO.invoiceNo}\nDate: ${viewingPO.date}\nVendor: ${viewingPO.supplierName}\nGrand Total: ₹${(viewingPO.grandTotal || 0).toFixed(2)}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
      };
      return (
        <InvoiceViewer
          createdVoucher={viewingPO}
          invoiceRef={ivRef}
          handlePrint={() => window.print()}
          handleDownloadHTML={handleDownload}
          handleWhatsAppShare={handleWA}
          onClose={() => setViewingPO(null)}
        />
      );
    };
    return (
      <div className="animate-fade-in pb-12">
        <ViewerWrapper />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-12" id="purchase-management-root">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-800">Procurement & Purchase Orders (PO)</h2>
          <p className="text-xs text-slate-400">Import 27-column PT Files, manage POs, GRNs, purchase invoices & returns.</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full font-semibold">
          <ShoppingBag className="w-3.5 h-3.5" /> {(purchaseOrders || []).length} POs / PT Vouchers · {grns.length} GRNs · {purchaseInvoices.length} Invoices
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeTab === t.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "pos" && (
          <div className="space-y-4">
            {/* Top Action Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">PT File & Purchase Voucher Hub</h3>
                  <p className="text-xs text-slate-400">Import 27-Column Excel PT Files or create manual purchase entry vouchers</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setShowImporter(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Import PT File (27 Cols)</span>
                </button>

                <button
                  onClick={() => setShowManualEntry(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <FilePlus className="w-4 h-4" />
                  <span>Manual Entry</span>
                </button>

                <button
                  onClick={() => setShowPOModal(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Draft PO</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search PO No, Vendor, Item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                <span>Total Procurement: <strong className="text-slate-800 font-mono">₹{(filteredPOs || []).reduce((acc, p) => acc + (p.grandTotal || p.subTotal || 0), 0).toLocaleString('en-IN')}</strong></span>
                <span>Records: <strong className="text-indigo-600">{(filteredPOs || []).length}</strong></span>
              </div>
            </div>

            {/* PO / PT Vouchers List Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-black tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="p-3.5">PO / Voucher No</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Wholesaler / Vendor</th>
                      <th className="p-3.5">Items Summary</th>
                      <th className="p-3.5 text-right">Qty</th>
                      <th className="p-3.5 text-right">Grand Total</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredPOs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-500" />
                          <p className="font-bold text-sm text-slate-600">No Procurement POs or PT Vouchers found</p>
                          <p className="text-xs mt-1">Import a 27-column PT File or click "Manual Entry" above to generate a new purchase voucher.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredPOs.map((po, idx) => {
                        const poNumber = po.poNo || po.invoiceNo || po.id || `PO-${idx + 1}`;
                        const vendor = po.supplierName || po.vendorName || "Wholesaler";
                        const itemSummary = Array.isArray(po.items)
                          ? po.items.map((i) => `${i.name || i.itemName || 'Item'} (${i.quantity || i.qty || 1})`).join(", ")
                          : (po.items || "Garments");
                        const totalQty = Array.isArray(po.items)
                          ? po.items.reduce((acc, i) => acc + (Number(i.quantity || i.qty) || 0), 0)
                          : (po.quantity || 1);
                        const amount = po.grandTotal || po.subTotal || 0;

                        return (
                          <tr key={po.id || po._id || idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-3.5 font-mono font-black text-indigo-600">{poNumber}</td>
                            <td className="p-3.5 font-mono text-slate-500">{fmtDate(po.date || po.createdAt)}</td>
                            <td className="p-3.5 font-bold text-slate-800">{vendor}</td>
                            <td className="p-3.5 text-slate-600 max-w-[220px] truncate" title={itemSummary}>{itemSummary}</td>
                            <td className="p-3.5 text-right font-mono font-bold">{totalQty}</td>
                            <td className="p-3.5 text-right font-mono font-black text-slate-900">₹{amount.toLocaleString('en-IN')}</td>
                            <td className="p-3.5 text-center">
                              <Badge label={po.status || "Compiled"} color={po.status === "Approved" || po.status === "Completed" ? "green" : "indigo"} />
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleViewVoucher(po)}
                                  className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                                  title="View Voucher Invoice"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingPO(po)}
                                  className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Purchase Voucher"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm("Are you sure you want to delete this Purchase Voucher?")) {
                                      if (onDeletePurchaseOrder) onDeletePurchaseOrder(po.id || po._id);
                                    }
                                  }}
                                  className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Purchase Voucher"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                {po.importBatchId && (
                                  <button
                                    onClick={async () => {
                                      if (window.confirm("CRITICAL WARNING: You are about to delete an entire PT Excel Import. This will atomically remove ALL associated Purchase Bills, Products, Vendors, and Inventory records.\n\nAre you absolutely sure?")) {
                                        try {
                                          const res = await api.delete(`/pt-import/${po.importBatchId}`, { headers: authHeaders() });
                                          if (res.data?.success) {
                                            alert("PT Import deleted successfully.");
                                            window.dispatchEvent(new Event("vastra-data-refresh"));
                                            if (setPurchaseOrders) {
                                              const refreshRes = await api.get('/purchase-orders');
                                              const dataOrBills = Array.isArray(refreshRes.data?.data) ? refreshRes.data.data : (Array.isArray(refreshRes.data?.data?.bills) ? refreshRes.data.data.bills : []);
                                              setPurchaseOrders(dataOrBills.map(p => ({ ...p, id: p._id || p.id })));
                                            }
                                          }
                                        } catch (err) {
                                          alert("Failed to delete PT Import: " + (err.response?.data?.message || err.message));
                                        }
                                      }
                                    }}
                                    className="p-1.5 text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors cursor-pointer border border-red-200 shadow-sm"
                                    title="Delete ENTIRE PT Import Batch"
                                  >
                                    <Trash2 className="w-4 h-4" /> PT
                                  </button>
                                )}
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

            {/* MODAL: CREATE QUICK DRAFT PO */}
            {showPOModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-scale-up">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                      Draft Procurement PO
                    </h4>
                    <button
                      onClick={() => setShowPOModal(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreatePOSubmit} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold">
                        Select Wholesaler *
                      </label>
                      <select
                        required
                        value={poSupplierId}
                        onChange={(e) => setPoSupplierId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700"
                      >
                        <option value="">Select Wholesaler...</option>
                        {(suppliers || vendors || []).map((s) => (
                          <option key={s._id || s.id} value={s._id || s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold">
                        Garment SKU Style *
                      </label>
                      <select
                        required
                        value={poProductId}
                        onChange={(e) => setPoProductId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700"
                      >
                        <option value="">Select SKU...</option>
                        {(products || []).slice(0, 50).map((p) => (
                          <option key={p._id || p.id} value={p._id || p.id}>
                            {p.name} (Cost: ₹{p.purchasePrice || 0})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold">
                        Procurement Quantity (Units)
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={poQty}
                        onChange={(e) => setPoQty(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono"
                      />
                    </div>

                    <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowPOModal(false)}
                        className="px-4 py-2 bg-slate-100 rounded-xl font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 cursor-pointer"
                      >
                        Submit PO
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "grn" && <GRNEntry grns={grns} setGrns={setGrns} vendors={vendors} products={products} onAddNotification={onAddNotification} />}
        {activeTab === "invoice" && <PurchaseInvoiceManager purchaseInvoices={purchaseInvoices} setPurchaseInvoices={setPurchaseInvoices} vendors={vendors} products={products} onAddNotification={onAddNotification} />}
        {activeTab === "returns" && <PurchaseReturns purchaseReturns={purchaseReturns} setPurchaseReturns={setPurchaseReturns} vendors={vendors} products={products} purchaseInvoices={purchaseInvoices} onAddNotification={onAddNotification} />}
        {activeTab === "pending" && <PendingTracking pendingPurchases={pendingPurchases} setPendingPurchases={setPendingPurchases} onAddNotification={onAddNotification} />}
        {activeTab === "reports" && <PurchaseReportsTab purchaseReports={purchaseReports} setPurchaseReports={setPurchaseReports} onAddNotification={onAddNotification} />}
      </div>
    </div>
  );
};
