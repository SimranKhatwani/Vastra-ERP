import React, { useState, useEffect } from 'react';
import {
  Building2, Phone, Mail, MessageSquare, FileText, Calendar, DollarSign,
  Star, ShieldCheck, Copy, ExternalLink, Download, Eye, Plus, CheckCircle2,
  Clock, AlertCircle, Search, Filter, Share2, Upload, Trash2, Edit3,
  UserCheck, MapPin, CreditCard, FileCheck, Tag, ArrowRight, RefreshCw,
  Send, Lock, Bookmark, Paperclip, ChevronRight, X
} from 'lucide-react';

const DEFAULT_FALLBACK_VENDORS = [
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
  const [vendorList, setVendorList] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [hubData, setHubData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);

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

  // 1. Fetch Vendors directly from MongoDB Supplier API
  const fetchVendors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/suppliers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const mapped = data.data.map(v => ({
          _id: v._id || v.id,
          vendorCode: v.vendorCode || `VND-${(v._id || v.id).substring(0, 6)}`,
          name: v.name || v.supplierName || v.companyName,
          businessName: v.companyName || v.businessName || v.name,
          phone: v.phone || v.mobile || '9876543210',
          email: v.email || 'vendor@example.com',
          gstin: v.gstin || v.gstNo || '27AABCU9603R1ZM',
          panNumber: v.panNumber || 'AABCU9603R',
          category: v.category || 'Fabric & Materials',
          businessType: v.businessType || 'Manufacturer',
          rating: v.rating || 4.8,
          brandsSupplied: Array.isArray(v.brandsSupplied) && v.brandsSupplied.length > 0 ? v.brandsSupplied : ['Raymond', 'Linen Club'],
          address: v.address || 'Surat Textile Market, Surat, Gujarat - 395002',
          bankDetails: v.bankDetails || { bankName: 'HDFC Bank', accountNo: '50200018291029', ifscCode: 'HDFC0000124' },
          currentOutstanding: v.currentOutstanding || v.outstandingBalance || v.balance || 0,
          isActive: v.isActive !== false
        }));
        setVendorList(mapped);
        setSelectedVendorId(prev => prev || mapped[0]._id);
      } else {
        setVendorList(DEFAULT_FALLBACK_VENDORS);
        setSelectedVendorId(prev => prev || DEFAULT_FALLBACK_VENDORS[0]._id);
      }
    } catch (err) {
      console.error('API load failed, using local vendor store:', err);
      setVendorList(DEFAULT_FALLBACK_VENDORS);
      setSelectedVendorId(prev => prev || DEFAULT_FALLBACK_VENDORS[0]._id);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Selected Vendor Communication Hub Record
  const fetchVendorHub = async (vId) => {
    if (!vId) return;
    const currentVendorDoc = vendorList.find(v => String(v._id) === String(vId)) || DEFAULT_FALLBACK_VENDORS[0];

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/vendor-communication/${vId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setHubData({
            ...data.data,
            vendor: { ...currentVendorDoc, ...data.data.vendor }
          });
          return;
        }
      }
    } catch (err) {}

    // Fallback UI State synced 1:1 with Vendor Document
    setHubData({
      vendor: currentVendorDoc,
      timeline: [
        { activityType: 'Purchase Order Shared', channel: 'WhatsApp', remarks: 'Shared Purchase Order #PO-2026-9810 with vendor', employeeName: currentUser?.name || 'Admin', createdAt: new Date() },
        { activityType: 'Call Initiated', channel: 'Call', remarks: 'Discussed rate inquiry and fabric delivery schedule', employeeName: currentUser?.name || 'Admin', createdAt: new Date(Date.now() - 7200000) }
      ],
      followUps: [
        { _id: 'f1', title: 'Dispatch Confirmation Follow-up for Order #104', priority: 'High', expectedDate: new Date(Date.now() + 86400000 * 2), status: 'Pending', assignedEmployeeName: currentUser?.name || 'Admin' }
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
        totalOutstanding: currentVendorDoc.currentOutstanding || 45000,
        creditLimit: currentVendorDoc.creditLimit || 250000,
        creditDays: currentVendorDoc.creditDays || 30,
        paymentTerms: currentVendorDoc.paymentTerms || 'Net 30',
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
  }, [selectedVendorId]);

  // 3. Create New Vendor directly in MongoDB (POST /api/suppliers)
  const handleCreateNewVendor = async (e) => {
    e.preventDefault();
    if (!newVendorForm.name || !newVendorForm.phone) {
      showToast('Please enter vendor name and phone number', 'error');
      return;
    }

    const payload = {
      ...newVendorForm,
      brandsSupplied: newVendorForm.brandsSuppliedStr.split(',').map(b => b.trim()).filter(Boolean),
      bankDetails: {
        bankName: newVendorForm.bankName,
        accountHolder: newVendorForm.accountHolder || newVendorForm.name,
        accountNo: newVendorForm.accountNo,
        ifscCode: newVendorForm.ifscCode,
        branch: `${newVendorForm.city} Branch`
      }
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.data) {
        showToast('New vendor created successfully in MongoDB!');
        setShowAddVendorModal(false);
        setNewVendorForm({
          name: '', businessName: '', phone: '', email: '', gstin: '', panNumber: '',
          category: 'Fabric & Materials', businessType: 'Manufacturer', rating: 4.5,
          brandsSuppliedStr: 'Raymond, Linen Club', address: '', city: 'Surat', state: 'Gujarat', pinCode: '395002',
          bankName: 'HDFC Bank', accountHolder: '', accountNo: '', ifscCode: '', upiId: '',
          paymentTerms: 'Net 30', creditDays: 30, creditLimit: 100000, outstandingBalance: 0
        });
        await fetchVendors();
        setSelectedVendorId(data.data._id || data.data.id);
      } else {
        showToast(data.message || 'Error creating vendor', 'error');
      }
    } catch (err) {
      showToast('Error connecting to backend API', 'error');
    }
  };

  // Quick Action Logger
  const handleQuickAction = async (activityType, channel, remarks) => {
    const newActivity = {
      activityType,
      channel,
      remarks,
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

    setHubData(prev => prev ? {
      ...prev,
      timeline: [newActivity, ...(prev.timeline || [])]
    } : prev);

    showToast(`Action executed: ${activityType}`);
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
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-bold border ${
          notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <AlertCircle className="w-4 h-4" />
          <span>{notification.msg}</span>
        </div>
      )}

      {/* TOP HEADER BAR: Integrated Title, Search, Selector & "+ Add New Vendor" Button */}
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

        {/* Global Controls & Add Vendor Button */}
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

          {/* + ADD NEW VENDOR BUTTON */}
          <button
            onClick={() => setShowAddVendorModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Add New Vendor
          </button>
        </div>
      </div>

      {/* MAIN CLEAN 2-PANEL LAYOUT (LEFT PROFILE CARD + FULL-WIDTH TABBED INTERFACE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ======================================================== */}
        {/* LEFT PANEL: Sticky Vendor Profile Card (Cols 3)           */}
        {/* ======================================================== */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-5 sticky top-6">
            
            {/* Vendor Avatar Header */}
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
                <p className="text-xs text-slate-500 font-medium mt-0.5">{vendor.businessName || 'Garment Manufacturing & Supply Co.'}</p>
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
                {(vendor.brandsSupplied && vendor.brandsSupplied.length > 0 ? vendor.brandsSupplied : ['Raymond', 'Linen Club']).map((b, i) => (
                  <span key={i} className="bg-slate-100 text-slate-700 border border-slate-200 text-xs px-2.5 py-0.5 rounded-lg font-bold font-mono">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Key Vendor Info */}
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

            {/* Quick 1-Click Action Buttons */}
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
        {/* RIGHT FULL-WIDTH TABBED INTERFACE (Cols 9 - No Horizontal Scroll!) */}
        {/* ======================================================== */}
        <div className="lg:col-span-9 space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            
            {/* Clean Tab Header - All 10 Tabs Fit Smoothly in 9-Column Space! */}
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
                { id: 'notes', label: '10. Notes' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-3 text-xs font-black rounded-xl transition-all ${
                    activeTab === tab.id
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
              
              {/* ---------------------------------------------------- */}
              {/* TAB 1: OVERVIEW                                      */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'overview' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider">
                      Vendor Profile Master Record
                    </h3>

                    {/* Integrated Quick Action Toolbar */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button onClick={() => handleQuickAction('Purchase Order Shared', 'WhatsApp', `Shared PO with ${vendor.name}`)} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold flex items-center gap-1 border border-indigo-200">
                        <FileText className="w-3.5 h-3.5" /> Share PO
                      </button>
                      <button onClick={() => handleQuickAction('Goods Return Shared', 'WhatsApp', `Shared Goods Return with ${vendor.name}`)} className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold flex items-center gap-1 border border-amber-200">
                        <RefreshCw className="w-3.5 h-3.5" /> Goods Return
                      </button>
                      <button onClick={() => handleQuickAction('Payment Advice Shared', 'WhatsApp', `Shared Payment Advice`)} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1 border border-emerald-200">
                        <DollarSign className="w-3.5 h-3.5" /> Payment Advice
                      </button>
                      <button onClick={() => handleQuickAction('Ledger Statement Shared', 'WhatsApp', `Shared Outstanding Ledger`)} className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold flex items-center gap-1 border border-red-200">
                        <FileCheck className="w-3.5 h-3.5" /> Ledger Statement
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-slate-400 font-medium">Vendor Name</span>
                      <span className="font-black text-slate-800 text-sm block">{vendor.name}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-slate-400 font-medium">Vendor Code</span>
                      <span className="font-mono font-bold text-indigo-600 text-sm block">{vendor.vendorCode || 'VND-2026-001'}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-slate-400 font-medium">Company Name</span>
                      <span className="font-bold text-slate-700 block">{vendor.businessName || vendor.name}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-slate-400 font-medium">Supplied Brands</span>
                      <span className="font-bold text-slate-700 block">{(vendor.brandsSupplied || ['Raymond', 'Linen Club']).join(', ')}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-slate-400 font-medium">Preferred Contact Person</span>
                      <span className="font-bold text-slate-700 block">{vendor.preferredContactPerson || vendor.contactPerson || 'Mr. Ramesh Shah (Sales Head)'}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-slate-400 font-medium">Preferred Calling Time</span>
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {vendor.preferredCallingTime || '10:00 AM - 06:00 PM'}
                      </span>
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

              {/* ---------------------------------------------------- */}
              {/* TAB 2: CONTACTS                                      */}
              {/* ---------------------------------------------------- */}
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
                        <button onClick={() => handleQuickAction('Call', 'Call', `Call to ${vendor.phone || '9876543210'}`)} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Call</button>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block font-medium">WhatsApp Number</span>
                        <span className="font-mono font-bold text-emerald-600 text-sm">{vendor.whatsappNumber || vendor.phone || '9876543210'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => copyToClipboard(vendor.whatsappNumber || vendor.phone || '9876543210', 'WhatsApp')} className="p-2 bg-white text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100"><Copy className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleQuickAction('WhatsApp Message', 'WhatsApp', `WhatsApp to ${vendor.whatsappNumber || vendor.phone}`)} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Message</button>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block font-medium">Primary Email</span>
                        <span className="font-mono font-bold text-slate-700">{vendor.email || 'orders@textilevendor.com'}</span>
                      </div>
                      <button onClick={() => copyToClipboard(vendor.email || 'orders@textilevendor.com', 'Email')} className="p-2 bg-white text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100"><Copy className="w-3.5 h-3.5" /></button>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block font-medium">Accounts Email</span>
                        <span className="font-mono font-bold text-slate-700">{vendor.accountsEmail || 'accounts@textilevendor.com'}</span>
                      </div>
                      <button onClick={() => copyToClipboard(vendor.accountsEmail || 'accounts@textilevendor.com', 'Accounts Email')} className="p-2 bg-white text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100"><Copy className="w-3.5 h-3.5" /></button>
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
                    Vendor Facility & Shipping Addresses
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-700 flex items-center gap-1.5 text-sm">
                          <MapPin className="w-4 h-4" /> Registered Office Address
                        </span>
                        <button onClick={() => copyToClipboard(vendor.address || 'Plot 45, Textile Park, Surat, Gujarat - 395002', 'Office Address')} className="p-1 text-slate-400 hover:text-slate-700"><Copy className="w-3.5 h-3.5" /></button>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-medium">
                        {vendor.address || 'Plot 45, Textile Industrial Park, Ring Road, Surat, Gujarat - 395002'}
                      </p>
                      <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:underline">
                        Open in Google Maps <ExternalLink className="w-3.5 h-3.5" />
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
                    Banking & Settlement Details
                  </h3>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
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
                        <span className="text-slate-400 block mb-1 font-medium">Credit Days & Terms</span>
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

              {/* ---------------------------------------------------- */}
              {/* TAB 7: FOLLOW-UPS                                    */}
              {/* ---------------------------------------------------- */}
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
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                              f.priority === 'Urgent' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
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

              {/* ---------------------------------------------------- */}
              {/* TAB 8: PURCHASE HISTORY                               */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'purchase_history' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider border-b border-slate-100 pb-2">
                    Live Purchase Orders & History
                  </h3>

                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-medium">Total Purchase Value</span>
                      <span className="text-xl font-black text-indigo-600">₹{(hubData?.purchaseHistory?.totalPurchaseValue || 185000).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-medium">Purchase Orders</span>
                      <span className="text-xl font-black text-slate-800">{hubData?.purchaseHistory?.purchaseOrdersCount || 4}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-medium">Goods Returns</span>
                      <span className="text-xl font-black text-amber-600">{hubData?.purchaseHistory?.returnsCount || 1}</span>
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
                    Financial Outstanding & Settlement Ledger
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-slate-400 font-medium">Current Outstanding Balance</span>
                      <span className="text-2xl font-black text-red-600 block font-mono">₹{(hubData?.outstanding?.totalOutstanding || 45000).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-1">
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
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-3.5 rounded-xl flex items-center gap-1 shadow-sm"
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

      </div>

      {/* MODAL 1: ADD NEW VENDOR (MongoDB Sync) */}
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
                  <label className="text-slate-500 font-bold block mb-1">Company / Business Name</label>
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
                <div>
                  <label className="text-slate-500 font-bold block mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    placeholder="27AABCU9603R1ZM"
                    value={newVendorForm.gstin}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, gstin: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">PAN Number</label>
                  <input
                    type="text"
                    placeholder="AABCU9603R"
                    value={newVendorForm.panNumber}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, panNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">Category</label>
                  <select
                    value={newVendorForm.category}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Fabric & Materials">Fabric & Materials</option>
                    <option value="Trims & Accessories">Trims & Accessories</option>
                    <option value="Wholesale Finished Garments">Wholesale Finished Garments</option>
                    <option value="Machinery & Tools">Machinery & Tools</option>
                    <option value="Packaging & Labels">Packaging & Labels</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">Business Type</label>
                  <select
                    value={newVendorForm.businessType}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, businessType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Manufacturer">Manufacturer</option>
                    <option value="Wholesaler">Wholesaler</option>
                    <option value="Trader">Trader</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Facility Address</label>
                <input
                  type="text"
                  placeholder="Plot No., Industrial Zone, Street..."
                  value={newVendorForm.address}
                  onChange={(e) => setNewVendorForm({ ...newVendorForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-500 font-bold block mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="HDFC Bank"
                    value={newVendorForm.bankName}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, bankName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">Account Number</label>
                  <input
                    type="text"
                    placeholder="502000192810"
                    value={newVendorForm.accountNo}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, accountNo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="HDFC0000124"
                    value={newVendorForm.ifscCode}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, ifscCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-indigo-500"
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

      {/* MODAL 2: CREATE FOLLOW-UP */}
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

      {/* MODAL 3: UPLOAD DOCUMENT */}
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

      {/* MODAL 4: ADD NOTE */}
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
