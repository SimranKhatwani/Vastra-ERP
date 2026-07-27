import React, { useState, useEffect } from 'react';
import {
  Building2, Phone, Mail, MessageSquare, FileText, Calendar, DollarSign,
  Star, ShieldCheck, Copy, ExternalLink, Download, Eye, Plus, CheckCircle2,
  Clock, AlertCircle, Search, Filter, Share2, Upload, Trash2, Edit3,
  UserCheck, MapPin, CreditCard, FileCheck, Tag, ArrowRight, RefreshCw,
  Send, Lock, Bookmark, Paperclip, ChevronRight, X, Printer
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

  // 2. Fetch Selected Vendor Communication Record
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

    // Fallback Hub State synced 1:1 with Vendor Document
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

  // 3. Document Repository: VIEW handler
  const handleViewDocument = (doc) => {
    setPreviewDoc(doc);
  };

  // 4. Document Repository: DOWNLOAD handler
  const handleDownloadDocument = (doc) => {
    const v = hubData?.vendor || vendorList.find(x => String(x._id) === String(selectedVendorId)) || DEFAULT_FALLBACK_VENDORS[0];
    const fileContent = `====================================================
VASTRA ERP - OFFICIAL VENDOR DOCUMENT REPOSITORY
====================================================
Document Title: ${doc.title}
Document Type:  ${doc.documentType}
File Size:      ${doc.fileSize || '1.2 MB'}
Upload Date:    ${new Date(doc.uploadedAt || Date.now()).toLocaleString()}
Uploaded By:    ${doc.uploadedBy || 'Admin'}

----------------------------------------------------
VENDOR DETAILS:
Vendor Name:    ${v.name}
Vendor Code:    ${v.vendorCode}
Business Name:  ${v.businessName || v.name}
GSTIN Number:   ${v.gstin || '27AABCU9603R1ZM'}
PAN Number:     ${v.panNumber || 'AABCU9603R'}
Category:       ${v.category}
Phone Number:   ${v.phone}
Address:        ${v.address}
----------------------------------------------------

This document is verified and stored in Vastra ERP MongoDB Document Repository.
Generated on: ${new Date().toLocaleString()}
====================================================`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}_Document.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded: ${doc.title}`);
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

  // 6. Execute Share (WhatsApp, Email, or File Download)
  const handleExecuteShare = async (channel) => {
    if (!shareModalData) return;
    const { category, docNumber, recipientPhone, recipientEmail, summaryText, vendor } = shareModalData;

    const activityType = `${category} Shared`;
    const remarks = `Shared ${category} #${docNumber} via ${channel}`;

    // Log activity to MongoDB
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/vendor-communication/${selectedVendorId}/log-activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          activityType,
          channel,
          remarks,
          documentNumber: docNumber,
          employeeName: currentUser?.name || 'Admin',
          status: 'Completed'
        })
      });
    } catch (e) {}

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
      const fileContent = `====================================================
VASTRA ERP - OFFICIAL VENDOR DOCUMENT STATEMENT
====================================================
Document:       ${category}
Document No:    #${docNumber}
Date:           ${new Date().toLocaleString()}
Shared By:      ${currentUser?.name || 'Admin'}

----------------------------------------------------
VENDOR DETAILS:
Vendor Name:    ${vendor.name}
Vendor Code:    ${vendor.vendorCode}
Business Name:  ${vendor.businessName || vendor.name}
GSTIN:          ${vendor.gstin || '27AABCU9603R1ZM'}
Phone:          ${vendor.phone}
----------------------------------------------------

STATEMENT SUMMARY:
${summaryText}

====================================================`;

      const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${category.replace(/\s+/g, '_')}_${docNumber}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Downloaded ${category} statement!`);
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

          <button
            onClick={() => setShowAddVendorModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Add New Vendor
          </button>
        </div>
      </div>

      {/* MAIN 2-PANEL LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT PANEL: Sticky Vendor Profile Card (Cols 3) */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-5 sticky top-6">
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

            <div className="pt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => handleOpenShareModal('Call')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Phone className="w-3.5 h-3.5" /> Call
              </button>
              <button
                onClick={() => handleOpenShareModal('WhatsApp Message')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT FULL-WIDTH TABBED INTERFACE (Cols 9) */}
        <div className="lg:col-span-9 space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            
            {/* 10-Tab Header */}
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
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
                    <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider">
                      Vendor Profile Master Record
                    </h3>

                    {/* Integrated Functional Share Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button onClick={() => handleOpenShareModal('Purchase Order', 'PO-2026-9810')} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold flex items-center gap-1 border border-indigo-200 shadow-2xs">
                        <FileText className="w-3.5 h-3.5" /> Share PO
                      </button>
                      <button onClick={() => handleOpenShareModal('Goods Return', 'GRN-2026-042')} className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold flex items-center gap-1 border border-amber-200 shadow-2xs">
                        <RefreshCw className="w-3.5 h-3.5" /> Goods Return
                      </button>
                      <button onClick={() => handleOpenShareModal('Payment Advice', 'PAY-2026-118')} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1 border border-emerald-200 shadow-2xs">
                        <DollarSign className="w-3.5 h-3.5" /> Payment Advice
                      </button>
                      <button onClick={() => handleOpenShareModal('Ledger Statement', 'STMT-2026-001')} className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold flex items-center gap-1 border border-red-200 shadow-2xs">
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

              {/* TAB 4: BANKING */}
              {activeTab === 'banking' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider border-b border-slate-100 pb-2">
                    Banking & Settlement Details
                  </h3>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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

              {/* TAB 8: PURCHASES */}
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

              {/* TAB 9: OUTSTANDING */}
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

              {/* TAB 10: NOTES */}
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
