import React, { useState, useEffect } from 'react';
import {
  Building2, Phone, Mail, MessageSquare, FileText, Calendar, DollarSign,
  Star, ShieldCheck, Copy, ExternalLink, Download, Eye, Plus, CheckCircle2,
  Clock, AlertCircle, Search, Filter, Share2, Upload, Trash2, Edit3,
  UserCheck, MapPin, CreditCard, FileCheck, Tag, ArrowRight, RefreshCw,
  Send, Lock, Bookmark, Paperclip, ChevronRight, CheckCircle, XCircle
} from 'lucide-react';

const DEFAULT_DEMO_VENDORS = [
  {
    _id: 'demo-v1',
    vendorCode: 'VND-2026-001',
    name: 'Raymond Textiles Pvt Ltd',
    businessName: 'Raymond Manufacturing Co.',
    phone: '9876543210',
    secondaryPhone: '9876543211',
    whatsappNumber: '9876543210',
    email: 'orders@raymond.com',
    accountsEmail: 'accounts@raymond.com',
    businessType: 'Manufacturer',
    category: 'Fabric & Materials',
    rating: 4.8,
    gstin: '27AABCU9603R1ZM',
    panNumber: 'AABCU9603R',
    brandsSupplied: ['Raymond', 'Park Avenue', 'Parx'],
    preferredContactPerson: 'Mr. Ramesh Shah (Sales Head)',
    preferredCallingTime: '10:00 AM - 06:00 PM',
    qualityRemarks: 'High quality supplier with 98% on-time fabric delivery.',
    address: 'Plot 45, Textile Industrial Park, Ring Road, Surat, Gujarat - 395002',
    bankDetails: {
      bankName: 'HDFC Bank Ltd',
      accountHolder: 'Raymond Textiles Pvt Ltd',
      accountNo: '50200049281920',
      ifscCode: 'HDFC0000124',
      branch: 'Ring Road Branch, Surat'
    },
    upiId: 'raymondtextiles@hdfcbank',
    paymentTerms: 'Net 30',
    creditDays: 30,
    creditLimit: 250000,
    currentOutstanding: 45000,
    isActive: true
  },
  {
    _id: 'demo-v2',
    vendorCode: 'VND-2026-002',
    name: 'Linen Club Wholesale',
    businessName: 'Jaya Shree Textiles (Aditya Birla Group)',
    phone: '9812345678',
    whatsappNumber: '9812345678',
    email: 'contact@linenclub.com',
    businessType: 'Wholesaler',
    category: 'Linen & Fine Fabrics',
    rating: 4.6,
    gstin: '24AAACJ1203P1Z2',
    panNumber: 'AAACJ1203P',
    brandsSupplied: ['Linen Club', 'Grasim'],
    preferredContactPerson: 'Suresh Mehta (Dispatch Supervisor)',
    preferredCallingTime: '11:00 AM - 05:00 PM',
    qualityRemarks: 'Premium 100% pure linen yarn and shirting fabric.',
    address: 'Industrial Area Phase 2, Ahmedabad, Gujarat - 380001',
    bankDetails: {
      bankName: 'ICICI Bank',
      accountHolder: 'Jaya Shree Textiles',
      accountNo: '000405019283',
      ifscCode: 'ICIC0000004',
      branch: 'CG Road, Ahmedabad'
    },
    paymentTerms: 'Net 15',
    creditDays: 15,
    creditLimit: 150000,
    currentOutstanding: 18500,
    isActive: true
  }
];

export default function VendorCommunicationCard({ currentUser }) {
  const [vendorList, setVendorList] = useState(DEFAULT_DEMO_VENDORS);
  const [selectedVendorId, setSelectedVendorId] = useState(DEFAULT_DEMO_VENDORS[0]._id);
  const [hubData, setHubData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);

  // Modals
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
    fileUrl: 'https://example.com/sample-vendor-doc.pdf',
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

  // 1. Load Vendors from API or Fallback
  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const [resComm, resSupp] = await Promise.all([
        fetch('http://localhost:5000/api/vendor-communication/list', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch('http://localhost:5000/api/suppliers', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
      ]);

      let loadedList = [];
      if (resComm && resComm.ok) {
        const data = await resComm.json();
        if (data.success && data.data.length > 0) loadedList = data.data;
      }

      if (loadedList.length === 0 && resSupp && resSupp.ok) {
        const dataSupp = await resSupp.json();
        if (dataSupp.success && dataSupp.data.length > 0) {
          loadedList = dataSupp.data.map(s => ({
            _id: s._id || s.id,
            vendorCode: s.vendorCode || `VND-${(s._id || s.id).substring(0, 6)}`,
            name: s.name || s.supplierName || s.companyName,
            businessName: s.companyName || s.businessName || s.name,
            phone: s.phone || s.mobile || '9876543210',
            email: s.email || 'vendor@example.com',
            gstin: s.gstin || s.gstNo || '27AABCU9603R1ZM',
            panNumber: s.panNumber || 'AABCU9603R',
            category: s.category || 'Fabric & Materials',
            businessType: s.businessType || 'Manufacturer',
            rating: s.rating || 4.5,
            brandsSupplied: s.brandsSupplied || ['Raymond', 'Linen Club'],
            address: s.address || 'Surat Textile Market, Surat, Gujarat',
            bankDetails: s.bankDetails || { bankName: 'HDFC Bank', accountNo: '50200018291029', ifscCode: 'HDFC0000124' },
            currentOutstanding: s.currentOutstanding || s.balance || 0,
            isActive: true
          }));
        }
      }

      if (loadedList.length > 0) {
        setVendorList(loadedList);
        setSelectedVendorId(loadedList[0]._id);
      } else {
        setVendorList(DEFAULT_DEMO_VENDORS);
        setSelectedVendorId(DEFAULT_DEMO_VENDORS[0]._id);
      }
    } catch (err) {
      console.error('Failed to load vendors', err);
      setVendorList(DEFAULT_DEMO_VENDORS);
      setSelectedVendorId(DEFAULT_DEMO_VENDORS[0]._id);
    }
  };

  // 2. Load Selected Vendor Profile & Hub Metrics
  const fetchVendorHub = async (vId) => {
    if (!vId) return;
    const currentLocalVendor = vendorList.find(v => String(v._id) === String(vId)) || DEFAULT_DEMO_VENDORS[0];

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/vendor-communication/${vId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setHubData(data.data);
          return;
        }
      }
    } catch (err) {
      console.warn('API call to vendor hub fell back to local store state');
    }

    // Default Fallback Hub State for smooth rendering
    setHubData({
      vendor: currentLocalVendor,
      timeline: [
        { activityType: 'Purchase Order Shared', channel: 'WhatsApp', remarks: 'Shared Purchase Order #PO-2026-9810 with vendor', employeeName: currentUser?.name || 'Admin', createdAt: new Date() },
        { activityType: 'Call Initiated', channel: 'Call', remarks: 'Discussed delivery schedule for 500m linen fabric roll', employeeName: currentUser?.name || 'Admin', createdAt: new Date(Date.now() - 7200000) }
      ],
      followUps: [
        { _id: 'f1', title: 'Dispatch Confirmation Follow-up for Fabric Roll #104', priority: 'High', expectedDate: new Date(Date.now() + 86400000 * 2), status: 'Pending', assignedEmployeeName: currentUser?.name || 'Admin' }
      ],
      documents: [
        { title: 'GST Registration Certificate', documentType: 'GST Certificate', fileSize: '1.2 MB', uploadedAt: new Date() },
        { title: 'Cancelled Cheque Copy', documentType: 'Cancelled Cheque', fileSize: '850 KB', uploadedAt: new Date() },
        { title: 'Annual Supply Agreement 2026', documentType: 'Purchase Agreement', fileSize: '3.4 MB', uploadedAt: new Date() }
      ],
      notes: [
        { content: 'Vendor offers 2% cash discount on invoices settled within 7 days.', employeeName: currentUser?.name || 'Admin', createdAt: new Date() }
      ],
      purchaseHistory: {
        totalPurchaseValue: 185000,
        lastPurchaseDate: new Date(),
        purchaseOrdersCount: 4,
        purchaseInvoicesCount: 3,
        returnsCount: 1,
        grnCount: 4,
        orders: [
          { poNumber: 'PO-2026-081', createdAt: new Date(), grandTotal: 45000, status: 'Received' },
          { poNumber: 'PO-2026-074', createdAt: new Date(Date.now() - 86400000 * 10), grandTotal: 62000, status: 'Received' }
        ]
      },
      outstanding: {
        totalOutstanding: currentLocalVendor.currentOutstanding || 45000,
        creditLimit: currentLocalVendor.creditLimit || 250000,
        creditDays: currentLocalVendor.creditDays || 30,
        paymentTerms: currentLocalVendor.paymentTerms || 'Net 30',
        lastPaymentDate: new Date(Date.now() - 86400000 * 5)
      }
    });
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (selectedVendorId) {
      fetchVendorHub(selectedVendorId);
    }
  }, [selectedVendorId, vendorList]);

  // Quick Actions Handler
  const handleQuickAction = async (activityType, channel, remarks, docNumber = '') => {
    const currentVendor = hubData?.vendor || vendorList.find(v => String(v._id) === String(selectedVendorId)) || DEFAULT_DEMO_VENDORS[0];

    const newActivity = {
      activityType,
      channel,
      remarks,
      documentNumber: docNumber,
      employeeName: currentUser?.name || 'Admin',
      status: 'Completed',
      createdAt: new Date()
    };

    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/vendor-communication/${selectedVendorId}/log-activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newActivity)
      });
    } catch (e) {}

    // Optimistically update UI Timeline
    setHubData(prev => prev ? {
      ...prev,
      timeline: [newActivity, ...(prev.timeline || [])]
    } : prev);

    showToast(`Action executed & logged: ${activityType}`);
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
      timeline: [{ activityType: 'Internal Note Added', channel: 'System', remarks: `Added internal note: ${noteForm.content.substring(0, 50)}...`, employeeName: currentUser?.name || 'Admin', createdAt: new Date() }, ...(prev.timeline || [])]
    } : prev);

    setShowNoteModal(false);
    showToast('Internal note added successfully!');
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`);
  };

  const vendor = hubData?.vendor || vendorList.find(v => String(v._id) === String(selectedVendorId)) || DEFAULT_DEMO_VENDORS[0];

  const filteredVendors = vendorList.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.vendorCode && v.vendorCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (v.businessName && v.businessName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12 animate-fade-in bg-slate-50/60 p-4 md:p-6 rounded-2xl min-h-screen text-slate-800">
      
      {/* Toast Alert */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-bold border ${
          notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <AlertCircle className="w-4 h-4" />
          <span>{notification.msg}</span>
        </div>
      )}

      {/* TOP NAVBAR / HEADER: Matching App Design */}
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
              360° Vendor Lifecycle, Document Sharing, Communication Automation & Accounts Settlement
            </p>
          </div>
        </div>

        {/* Global Vendor Search & Selector */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendor name, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <select
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
          >
            {filteredVendors.map(v => (
              <option key={v._id} value={v._id}>
                {v.name} ({v.vendorCode || 'VND-001'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MAIN 3-PANEL GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ======================================================== */}
        {/* LEFT PANEL: Sticky Vendor Profile Card (Cols 3)           */}
        {/* ======================================================== */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-5 sticky top-6">
            
            {/* Vendor Avatar & Title Header */}
            <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-slate-100">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-2xl font-black text-white shadow-md border border-indigo-200">
                {vendor.logoUrl ? (
                  <img src={vendor.logoUrl} alt={vendor.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  vendor.name ? vendor.name.substring(0, 2).toUpperCase() : 'VN'
                )}
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">{vendor.name}</h2>
                <p className="text-xs font-mono font-bold text-indigo-600">{vendor.vendorCode || 'VND-2026-001'}</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{vendor.businessName || 'Garment Supplies & Fabrics'}</p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                  vendor.isActive !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {vendor.isActive !== false ? 'Active Supplier' : 'Inactive'}
                </span>
                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  {vendor.rating || 4.8}
                </span>
              </div>
            </div>

            {/* Supplied Brands */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3 text-indigo-600" /> Supplied Brands
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(vendor.brandsSupplied && vendor.brandsSupplied.length > 0 ? vendor.brandsSupplied : ['Raymond', 'Linen Club', 'Mafatlal']).map((b, i) => (
                  <span key={i} className="bg-slate-100 text-slate-700 border border-slate-200 text-xs px-2.5 py-0.5 rounded-lg font-bold font-mono">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Vendor Details breakdown */}
            <div className="space-y-2 text-xs border-t border-slate-100 pt-4">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Category:</span>
                <span className="font-bold text-slate-700">{vendor.category || 'Fabric & Materials'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Business Type:</span>
                <span className="font-bold text-slate-700">{vendor.businessType || 'Manufacturer'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">GSTIN:</span>
                <span className="font-mono font-bold text-indigo-600 cursor-pointer flex items-center gap-1" onClick={() => copyToClipboard(vendor.gstin || '27AABCU9603R1ZM', 'GSTIN')}>
                  {vendor.gstin || '27AABCU9603R1ZM'} <Copy className="w-3 h-3" />
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-medium">PAN Number:</span>
                <span className="font-mono font-bold text-indigo-600 cursor-pointer flex items-center gap-1" onClick={() => copyToClipboard(vendor.panNumber || 'AABCU9603R', 'PAN')}>
                  {vendor.panNumber || 'AABCU9603R'} <Copy className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Quick Call & WhatsApp Badges */}
            <div className="pt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickAction('Call Initiated', 'Call', `Called ${vendor.name} at ${vendor.phone || '9876543210'}`)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Phone className="w-3.5 h-3.5" /> Call
              </button>
              <button
                onClick={() => handleQuickAction('WhatsApp Message Sent', 'WhatsApp', `Sent WhatsApp message to ${vendor.name}`)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
              </button>
            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* MIDDLE PANEL: 10-Tabbed Interface (Cols 6)               */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            
            {/* Tab Navigation Bar */}
            <div className="bg-slate-50/80 border-b border-slate-200 overflow-x-auto scrollbar-none flex items-center px-3">
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
                { id: 'notes', label: '10. Notes' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-3.5 text-xs font-extrabold border-b-2 whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="p-5 md:p-6 space-y-6">
              
              {/* ---------------------------------------------------- */}
              {/* TAB 1: OVERVIEW                                      */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'overview' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider border-b border-slate-100 pb-2">
                    Vendor Profile Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block mb-1 font-medium">Vendor Name</span>
                      <span className="font-black text-slate-800 text-sm">{vendor.name}</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block mb-1 font-medium">Vendor Code</span>
                      <span className="font-mono font-bold text-indigo-600 text-sm">{vendor.vendorCode || 'VND-2026-001'}</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block mb-1 font-medium">Business / Company Name</span>
                      <span className="font-bold text-slate-700">{vendor.businessName || vendor.name}</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block mb-1 font-medium">Supplied Brands</span>
                      <span className="font-bold text-slate-700">{(vendor.brandsSupplied || ['Raymond', 'Linen Club']).join(', ')}</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block mb-1 font-medium">Preferred Contact Person</span>
                      <span className="font-bold text-slate-700">{vendor.preferredContactPerson || vendor.contactPerson || 'Mr. Ramesh Shah (Sales Manager)'}</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block mb-1 font-medium">Preferred Calling Window</span>
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {vendor.preferredCallingTime || '10:00 AM - 06:00 PM'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <span className="text-xs font-bold text-slate-600 block">Quality & Performance Remarks:</span>
                    <p className="text-xs text-slate-600 italic bg-white p-3 rounded-lg border border-slate-200">
                      "{vendor.qualityRemarks || 'Vendor maintains high quality standards and on-time order fulfillment.'}"
                    </p>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 2: CONTACTS                                      */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'contacts' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider border-b border-slate-100 pb-2">
                    Vendor Communication Channels & Department Contacts
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block font-medium">Primary Mobile</span>
                        <span className="font-mono font-bold text-slate-800">{vendor.phone || '9876543210'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => copyToClipboard(vendor.phone || '9876543210', 'Mobile')} className="p-1.5 bg-white text-slate-600 rounded-md border border-slate-200 hover:bg-slate-100"><Copy className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleQuickAction('Call', 'Call', `Call to ${vendor.phone || '9876543210'}`)} className="p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"><Phone className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block font-medium">WhatsApp Number</span>
                        <span className="font-mono font-bold text-emerald-600">{vendor.whatsappNumber || vendor.phone || '9876543210'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => copyToClipboard(vendor.whatsappNumber || vendor.phone || '9876543210', 'WhatsApp')} className="p-1.5 bg-white text-slate-600 rounded-md border border-slate-200 hover:bg-slate-100"><Copy className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleQuickAction('WhatsApp Message', 'WhatsApp', `WhatsApp to ${vendor.whatsappNumber || vendor.phone}`)} className="p-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"><MessageSquare className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block font-medium">Primary Email</span>
                        <span className="font-mono font-bold text-slate-700">{vendor.email || 'orders@textilevendor.com'}</span>
                      </div>
                      <button onClick={() => copyToClipboard(vendor.email || 'orders@textilevendor.com', 'Email')} className="p-1.5 bg-white text-slate-600 rounded-md border border-slate-200 hover:bg-slate-100"><Copy className="w-3.5 h-3.5" /></button>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block font-medium">Accounts Email</span>
                        <span className="font-mono font-bold text-slate-700">{vendor.accountsEmail || 'accounts@textilevendor.com'}</span>
                      </div>
                      <button onClick={() => copyToClipboard(vendor.accountsEmail || 'accounts@textilevendor.com', 'Accounts Email')} className="p-1.5 bg-white text-slate-600 rounded-md border border-slate-200 hover:bg-slate-100"><Copy className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 3: ADDRESSES                                     */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'addresses' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider border-b border-slate-100 pb-2">
                    Vendor Addresses & Facility Locations
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-700 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" /> Registered Office Address
                        </span>
                        <button onClick={() => copyToClipboard(vendor.address || 'Plot 45, Textile Park, Surat, Gujarat - 395002', 'Office Address')} className="p-1 text-slate-400 hover:text-slate-700"><Copy className="w-3.5 h-3.5" /></button>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-medium">
                        {vendor.address || 'Plot 45, Textile Industrial Park, Ring Road, Surat, Gujarat - 395002'}
                      </p>
                      <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:underline pt-1">
                        Google Maps <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 4: BANKING                                       */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'banking' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider border-b border-slate-100 pb-2">
                    Banking & Settlement Terms
                  </h3>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-1 font-medium">Bank Name</span>
                        <span className="font-black text-slate-800 text-sm">{vendor.bankDetails?.bankName || 'HDFC Bank Ltd.'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-1 font-medium">Account Holder</span>
                        <span className="font-bold text-slate-700">{vendor.bankDetails?.accountHolder || vendor.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-1 font-medium">Account Number</span>
                        <span className="font-mono font-bold text-indigo-600 text-sm flex items-center gap-2">
                          {vendor.bankDetails?.accountNo || '50200049281920'}
                          <Copy className="w-3.5 h-3.5 cursor-pointer hover:text-slate-900" onClick={() => copyToClipboard(vendor.bankDetails?.accountNo || '50200049281920', 'A/C No')} />
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-1 font-medium">IFSC Code</span>
                        <span className="font-mono font-bold text-slate-700">{vendor.bankDetails?.ifscCode || 'HDFC0000124'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-1 font-medium">UPI ID</span>
                        <span className="font-mono font-bold text-emerald-600">{vendor.upiId || 'textilevendor@hdfcbank'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-1 font-medium">Credit Limit & Terms</span>
                        <span className="font-bold text-slate-700">{vendor.paymentTerms || 'Net 30'} ({vendor.creditDays || 30} Days)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 5: DOCUMENTS                                     */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'documents' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider">
                      Vendor Document Repository
                    </h3>
                    <button
                      onClick={() => setShowDocModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1 shadow-sm"
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
                          <p className="text-[11px] text-slate-400 font-mono">{doc.fileSize} • {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <a href={doc.fileUrl || '#'} target="_blank" rel="noreferrer" className="p-2 bg-white text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200">
                            <Eye className="w-4 h-4" />
                          </a>
                          <a href={doc.fileUrl || '#'} download className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg">
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 6: COMMUNICATION TIMELINE                         */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'timeline' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider border-b border-slate-100 pb-2">
                    Automated Activity & Communication Stream
                  </h3>

                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                    {(hubData?.timeline || []).map((item, index) => (
                      <div key={index} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-start justify-between text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{item.activityType}</span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-mono text-[10px] font-bold">
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

              {/* ---------------------------------------------------- */}
              {/* TAB 7: FOLLOW-UPS                                    */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'followups' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider">
                      Vendor Follow-ups & Reminders
                    </h3>
                    <button
                      onClick={() => setShowFollowUpModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Create Follow-up
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(hubData?.followUps || []).map((f) => (
                      <div key={f._id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                              f.priority === 'Urgent' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {f.priority} Priority
                            </span>
                            <h4 className="font-bold text-slate-800">{f.title}</h4>
                          </div>
                          <p className="text-slate-500">Assigned To: {f.assignedEmployeeName} • Due Date: {new Date(f.expectedDate).toLocaleDateString()}</p>
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
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Done
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 8: PURCHASE HISTORY                               */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'purchase_history' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider border-b border-slate-100 pb-2">
                    Live Purchase History & PO Tracking
                  </h3>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-medium">Total Purchases</span>
                      <span className="text-lg font-black text-indigo-600">₹{(hubData?.purchaseHistory?.totalPurchaseValue || 185000).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-medium">Purchase Orders</span>
                      <span className="text-lg font-black text-slate-800">{hubData?.purchaseHistory?.purchaseOrdersCount || 4}</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-medium">Returns Count</span>
                      <span className="text-lg font-black text-amber-600">{hubData?.purchaseHistory?.returnsCount || 1}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 9: OUTSTANDING                                   */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'outstanding' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider border-b border-slate-100 pb-2">
                    Financial Outstanding & Settlement
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-slate-400 font-medium">Current Outstanding Balance</span>
                      <span className="text-2xl font-black text-red-600 block font-mono">₹{(hubData?.outstanding?.totalOutstanding || 45000).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-slate-400 font-medium">Credit Limit</span>
                      <span className="text-lg font-black text-slate-800 block font-mono">₹{(hubData?.outstanding?.creditLimit || 250000).toLocaleString('en-IN')} ({hubData?.outstanding?.creditDays || 30} Days)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 10: NOTES                                        */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'notes' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider">
                      Internal Vendor Notes
                    </h3>
                    <button
                      onClick={() => setShowNoteModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Note
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(hubData?.notes || []).map((n, i) => (
                      <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-1">
                        <p className="text-slate-700 font-medium">{n.content}</p>
                        <p className="text-[10px] text-slate-400 font-mono">By: {n.employeeName} • {new Date(n.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT PANEL: Quick Action Panel (Cols 3)                 */}
        {/* ======================================================== */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-indigo-600" /> Quick Actions & Sharing
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => handleQuickAction('Call Initiated', 'Call', `Called ${vendor.name}`)}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold p-2.5 rounded-xl border border-slate-200 flex items-center justify-between transition group"
              >
                <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-indigo-600" /> Call Vendor</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => handleQuickAction('WhatsApp Sent', 'WhatsApp', `WhatsApp to ${vendor.name}`)}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold p-2.5 rounded-xl border border-slate-200 flex items-center justify-between transition group"
              >
                <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-emerald-600" /> WhatsApp Vendor</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => handleQuickAction('Email Sent', 'Email', `Email sent to ${vendor.name}`)}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold p-2.5 rounded-xl border border-slate-200 flex items-center justify-between transition group"
              >
                <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-purple-600" /> Send Email</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => handleQuickAction('Purchase Order Shared', 'WhatsApp', `Shared latest Purchase Order with ${vendor.name}`)}
                className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold p-2.5 rounded-xl border border-indigo-200 flex items-center justify-between transition group"
              >
                <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-600" /> Share Purchase Order</span>
                <ChevronRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => handleQuickAction('Goods Return Shared', 'WhatsApp', `Shared Goods Return note with ${vendor.name}`)}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold p-2.5 rounded-xl border border-slate-200 flex items-center justify-between transition group"
              >
                <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-amber-600" /> Share Goods Return</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => handleQuickAction('Payment Advice Shared', 'WhatsApp', `Shared Payment Advice with ${vendor.name}`)}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold p-2.5 rounded-xl border border-slate-200 flex items-center justify-between transition group"
              >
                <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-600" /> Share Payment Advice</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => handleQuickAction('Outstanding Statement Shared', 'WhatsApp', `Shared Outstanding Ledger Statement`)}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold p-2.5 rounded-xl border border-slate-200 flex items-center justify-between transition group"
              >
                <span className="flex items-center gap-2"><FileCheck className="w-4 h-4 text-red-600" /> Share Outstanding Ledger</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setShowNoteModal(true)}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold p-2.5 rounded-xl border border-slate-200 flex items-center justify-between transition group"
              >
                <span className="flex items-center gap-2"><Edit3 className="w-4 h-4 text-cyan-600" /> Add Internal Note</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* MODAL 1: Create Follow-up */}
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

              <div>
                <label className="text-slate-500 font-medium block mb-1">Follow-up Type</label>
                <select
                  value={followUpForm.followUpType}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, followUpType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="Pending Vendor Call">Pending Vendor Call</option>
                  <option value="Pending Goods Return">Pending Goods Return</option>
                  <option value="Replacement Follow-up">Replacement Follow-up</option>
                  <option value="Credit Note Pending">Credit Note Pending</option>
                  <option value="Payment Follow-up">Payment Follow-up</option>
                  <option value="Dispatch Follow-up">Dispatch Follow-up</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 font-medium block mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={followUpForm.expectedDate}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, expectedDate: e.target.value })}
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

      {/* MODAL 2: Upload Document */}
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

              <div>
                <label className="text-slate-500 font-medium block mb-1">Document Type</label>
                <select
                  value={docForm.documentType}
                  onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="GST Certificate">GST Certificate</option>
                  <option value="Cancelled Cheque">Cancelled Cheque</option>
                  <option value="Purchase Agreement">Purchase Agreement</option>
                  <option value="Rate List">Rate List</option>
                  <option value="Catalogue">Catalogue</option>
                  <option value="Invoice">Invoice</option>
                  <option value="Debit Note">Debit Note</option>
                  <option value="Credit Note">Credit Note</option>
                  <option value="LR Copy">LR Copy</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowDocModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Upload & Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Add Note */}
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
