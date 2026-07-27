import React, { useState, useEffect } from 'react';
import {
  Building2, Phone, Mail, MessageSquare, FileText, Calendar, DollarSign,
  Star, ShieldCheck, Copy, ExternalLink, Download, Eye, Plus, CheckCircle,
  Clock, AlertCircle, Search, Filter, Share2, Upload, Trash2, Edit3,
  UserCheck, MapPin, CreditCard, FileCheck, Tag, ArrowRight, RefreshCw,
  Send, Lock, Bookmark, Paperclip, ChevronRight
} from 'lucide-react';

export default function VendorCommunicationCard({ currentUser }) {
  const [vendorList, setVendorList] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [hubData, setHubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);

  // Modal / Form States
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({
    title: '',
    followUpType: 'Pending Vendor Call',
    expectedDate: '',
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

  // 1. Fetch Vendor List
  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/vendor-communication/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setVendorList(data.data);
        if (!selectedVendorId) {
          setSelectedVendorId(data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load vendors', err);
    }
  };

  // 2. Fetch Full Vendor Communication Hub Profile
  const fetchVendorHub = async (vId) => {
    if (!vId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/vendor-communication/${vId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setHubData(data.data);
      }
    } catch (err) {
      console.error('Failed to load vendor hub profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (selectedVendorId) {
      fetchVendorHub(selectedVendorId);
    }
  }, [selectedVendorId]);

  // Quick Action Handler (Call, WhatsApp, Share Document, etc.)
  const handleQuickAction = async (activityType, channel, remarks, docNumber = '') => {
    if (!selectedVendorId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/vendor-communication/${selectedVendorId}/log-activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          activityType,
          channel,
          remarks,
          documentNumber: docNumber,
          employeeName: currentUser?.name || 'Admin',
          status: 'Completed'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Action executed & logged: ${activityType}`);
        fetchVendorHub(selectedVendorId);
      }
    } catch (err) {
      showToast('Failed to execute action', 'error');
    }
  };

  // Follow-up Creation
  const handleCreateFollowUp = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/vendor-communication/${selectedVendorId}/followups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(followUpForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Follow-up created successfully!');
        setShowFollowUpModal(false);
        setFollowUpForm({
          title: '',
          followUpType: 'Pending Vendor Call',
          expectedDate: '',
          priority: 'Medium',
          assignedEmployeeName: currentUser?.name || 'Admin',
          remarks: ''
        });
        fetchVendorHub(selectedVendorId);
      }
    } catch (err) {
      showToast('Error creating follow-up', 'error');
    }
  };

  // Complete Follow-up
  const handleCompleteFollowUp = async (fId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/vendor-communication/followups/${fId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Completed', employeeName: currentUser?.name || 'Admin' })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Follow-up marked as completed!');
        fetchVendorHub(selectedVendorId);
      }
    } catch (err) {
      showToast('Error completing follow-up', 'error');
    }
  };

  // Upload Document
  const handleAddDocument = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/vendor-communication/${selectedVendorId}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(docForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Document uploaded successfully!');
        setShowDocModal(false);
        setDocForm({
          title: '',
          documentType: 'GST Certificate',
          fileUrl: 'https://example.com/sample-vendor-doc.pdf',
          fileSize: '1.4 MB'
        });
        fetchVendorHub(selectedVendorId);
      }
    } catch (err) {
      showToast('Error uploading document', 'error');
    }
  };

  // Add Internal Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/vendor-communication/${selectedVendorId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(noteForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Note added successfully!');
        setShowNoteModal(false);
        setNoteForm({ content: '', noteType: 'Internal Note', isPinned: false, isPrivate: false });
        fetchVendorHub(selectedVendorId);
      }
    } catch (err) {
      showToast('Error adding note', 'error');
    }
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`);
  };

  const vendor = hubData?.vendor || {};

  const filteredVendors = vendorList.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.vendorCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.businessName && v.businessName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 space-y-6 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 text-sm font-semibold border ${
          notification.type === 'error' ? 'bg-red-950 border-red-800 text-red-200' : 'bg-emerald-950 border-emerald-800 text-emerald-200'
        }`}>
          <AlertCircle className="w-5 h-5" />
          <span>{notification.msg}</span>
        </div>
      )}

      {/* TOP HEADER: Module Title & Vendor Selector Dropdown */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Vendor Communication & Lifecycle Hub
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">Enterprise ERP</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Centralized Vendor Relationship Management, Communication Automation & Financial Hub
            </p>
          </div>
        </div>

        {/* Global Vendor Search & Selector */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendor name, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
          >
            {filteredVendors.map(v => (
              <option key={v._id} value={v._id}>
                {v.name} ({v.vendorCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center space-y-3 bg-slate-800/40 border border-slate-800 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-sm font-mono text-slate-400">Loading Vendor Profile & Operational Records...</p>
        </div>
      ) : (
        /* MAIN 3-PANEL GRID LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ======================================================== */}
          {/* LEFT PANEL: Sticky Vendor Profile Card (Cols 3)           */}
          {/* ======================================================== */}
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-5 sticky top-6">
              
              {/* Vendor Avatar & Header */}
              <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-slate-700">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg border border-blue-400/30">
                  {vendor.logoUrl ? (
                    <img src={vendor.logoUrl} alt={vendor.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    vendor.name ? vendor.name.substring(0, 2).toUpperCase() : 'VN'
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{vendor.name}</h2>
                  <p className="text-xs font-mono text-blue-400 font-semibold">{vendor.vendorCode}</p>
                  <p className="text-xs text-slate-400 mt-1">{vendor.businessName || 'Garment Manufacturing & Supply Co.'}</p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    vendor.isActive !== false ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}>
                    {vendor.isActive !== false ? 'Active Supplier' : 'Inactive'}
                  </span>
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {vendor.rating || 4.5}
                  </span>
                </div>
              </div>

              {/* Brands Supplied Tags */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3 h-3 text-blue-400" /> Supplied Brands
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(vendor.brandsSupplied && vendor.brandsSupplied.length > 0 ? vendor.brandsSupplied : ['Raymond', 'Linen Club', 'Mafatlal']).map((b, i) => (
                    <span key={i} className="bg-slate-900 border border-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-md font-mono">
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {/* Vendor Categorization Details */}
              <div className="space-y-2 text-xs border-t border-slate-700 pt-4">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-semibold text-slate-200">{vendor.category || 'Fabric & Materials'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Business Type:</span>
                  <span className="font-semibold text-slate-200">{vendor.businessType || 'Manufacturer'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">GSTIN:</span>
                  <span className="font-mono font-semibold text-blue-400 cursor-pointer flex items-center gap-1" onClick={() => copyToClipboard(vendor.gstin || '27AABCU9603R1ZM', 'GSTIN')}>
                    {vendor.gstin || '27AABCU9603R1ZM'} <Copy className="w-3 h-3" />
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">PAN Number:</span>
                  <span className="font-mono font-semibold text-blue-400 cursor-pointer flex items-center gap-1" onClick={() => copyToClipboard(vendor.panNumber || 'AABCU9603R', 'PAN')}>
                    {vendor.panNumber || 'AABCU9603R'} <Copy className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Quick Contact Badges */}
              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleQuickAction('Call Initiated', 'Call', `Called ${vendor.name} at ${vendor.phone || '9876543210'}`)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition"
                >
                  <Phone className="w-3.5 h-3.5" /> Call
                </button>
                <button
                  onClick={() => handleQuickAction('WhatsApp Message Sent', 'WhatsApp', `Sent WhatsApp message to ${vendor.name}`)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                </button>
              </div>

            </div>
          </div>

          {/* ======================================================== */}
          {/* MIDDLE PANEL: 10-Tabbed Operational Interface (Cols 6)    */}
          {/* ======================================================== */}
          <div className="lg:col-span-6 space-y-5">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
              
              {/* Tab Navigation Header */}
              <div className="bg-slate-900/60 border-b border-slate-700 overflow-x-auto scrollbar-none flex items-center px-4">
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
                    className={`py-3.5 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Contents Container */}
              <div className="p-5 md:p-6 space-y-6">
                
                {/* ---------------------------------------------------- */}
                {/* TAB 1: OVERVIEW                                      */}
                {/* ---------------------------------------------------- */}
                {activeTab === 'overview' && (
                  <div className="space-y-5 animate-fade-in">
                    <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider border-b border-slate-700 pb-2">
                      Vendor Master Overview
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block mb-1">Vendor Name</span>
                        <span className="font-bold text-white text-sm">{vendor.name}</span>
                      </div>
                      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block mb-1">Vendor Code</span>
                        <span className="font-mono font-bold text-blue-400 text-sm">{vendor.vendorCode}</span>
                      </div>
                      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block mb-1">Business Name</span>
                        <span className="font-semibold text-slate-200">{vendor.businessName || vendor.name}</span>
                      </div>
                      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block mb-1">Supplied Brands</span>
                        <span className="font-semibold text-slate-200">{(vendor.brandsSupplied || ['Raymond', 'Linen Club']).join(', ')}</span>
                      </div>
                      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block mb-1">Preferred Contact Person</span>
                        <span className="font-semibold text-slate-200">{vendor.preferredContactPerson || vendor.contactPerson || 'Mr. Ramesh Shah (Sales Manager)'}</span>
                      </div>
                      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block mb-1">Preferred Calling Time</span>
                        <span className="font-semibold text-emerald-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {vendor.preferredCallingTime || '10:00 AM - 06:00 PM'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                      <span className="text-xs font-semibold text-slate-400 block">Quality & Performance Remarks:</span>
                      <p className="text-xs text-slate-300 italic bg-slate-950 p-3 rounded-lg border border-slate-800">
                        "{vendor.qualityRemarks || 'Vendor maintains 98% fabric quality compliance. Preferred supplier for premium cotton and linen textiles.'}"
                      </p>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* TAB 2: CONTACTS                                      */}
                {/* ---------------------------------------------------- */}
                {activeTab === 'contacts' && (
                  <div className="space-y-5 animate-fade-in">
                    <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider border-b border-slate-700 pb-2">
                      Vendor Contact Persons & Channels
                    </h3>

                    {/* Primary & Secondary Communication Numbers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 block">Primary Mobile</span>
                          <span className="font-mono font-bold text-white">{vendor.phone || '9876543210'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => copyToClipboard(vendor.phone || '9876543210', 'Mobile')} className="p-1.5 bg-slate-800 text-slate-300 rounded-md hover:bg-slate-700"><Copy className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleQuickAction('Call', 'Call', `Call to ${vendor.phone || '9876543210'}`)} className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-500"><Phone className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>

                      <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 block">WhatsApp Number</span>
                          <span className="font-mono font-bold text-emerald-400">{vendor.whatsappNumber || vendor.phone || '9876543210'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => copyToClipboard(vendor.whatsappNumber || vendor.phone || '9876543210', 'WhatsApp')} className="p-1.5 bg-slate-800 text-slate-300 rounded-md hover:bg-slate-700"><Copy className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleQuickAction('WhatsApp Message', 'WhatsApp', `WhatsApp to ${vendor.whatsappNumber || vendor.phone}`)} className="p-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-500"><MessageSquare className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>

                      <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 block">Primary Email</span>
                          <span className="font-mono font-semibold text-slate-200">{vendor.email || 'orders@textilevendor.com'}</span>
                        </div>
                        <button onClick={() => copyToClipboard(vendor.email || 'orders@textilevendor.com', 'Email')} className="p-1.5 bg-slate-800 text-slate-300 rounded-md hover:bg-slate-700"><Copy className="w-3.5 h-3.5" /></button>
                      </div>

                      <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 block">Accounts Email</span>
                          <span className="font-mono font-semibold text-slate-200">{vendor.accountsEmail || 'accounts@textilevendor.com'}</span>
                        </div>
                        <button onClick={() => copyToClipboard(vendor.accountsEmail || 'accounts@textilevendor.com', 'Accounts Email')} className="p-1.5 bg-slate-800 text-slate-300 rounded-md hover:bg-slate-700"><Copy className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    {/* Department Contacts Table */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-300">Department Contacts:</span>
                      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-slate-950 text-slate-400 font-mono">
                            <tr>
                              <th className="p-3">Department</th>
                              <th className="p-3">Contact Name</th>
                              <th className="p-3">Phone</th>
                              <th className="p-3">Email</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 text-slate-200">
                            <tr>
                              <td className="p-3 font-semibold text-blue-400">Sales Contact</td>
                              <td className="p-3">Ramesh Shah</td>
                              <td className="p-3 font-mono">9876543210</td>
                              <td className="p-3 font-mono text-slate-400">sales@vendor.com</td>
                            </tr>
                            <tr>
                              <td className="p-3 font-semibold text-emerald-400">Accounts Contact</td>
                              <td className="p-3">Suresh Mehta</td>
                              <td className="p-3 font-mono">9876543211</td>
                              <td className="p-3 font-mono text-slate-400">accounts@vendor.com</td>
                            </tr>
                            <tr>
                              <td className="p-3 font-semibold text-amber-400">Dispatch / Logistics</td>
                              <td className="p-3">Mahesh Kumar</td>
                              <td className="p-3 font-mono">9876543212</td>
                              <td className="p-3 font-mono text-slate-400">dispatch@vendor.com</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* TAB 3: ADDRESSES                                     */}
                {/* ---------------------------------------------------- */}
                {activeTab === 'addresses' && (
                  <div className="space-y-5 animate-fade-in">
                    <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider border-b border-slate-700 pb-2">
                      Vendor Facility & Shipping Addresses
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Office Address */}
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-400 flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" /> Registered Office Address
                          </span>
                          <button onClick={() => copyToClipboard(vendor.address || 'Plot 45, Textile Park, Surat, Gujarat - 395002', 'Office Address')} className="p-1 text-slate-400 hover:text-white"><Copy className="w-3.5 h-3.5" /></button>
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          {vendor.address || 'Plot 45, Textile Industrial Park, Ring Road, Surat, Gujarat - 395002'}
                        </p>
                        <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-400 font-semibold hover:underline pt-1">
                          View on Google Maps <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Factory Address */}
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                            <Building2 className="w-4 h-4" /> Main Factory Unit
                          </span>
                          <button onClick={() => copyToClipboard('Shed 12, GIDC Industrial Estate, Sachin, Surat - 394230', 'Factory Address')} className="p-1 text-slate-400 hover:text-white"><Copy className="w-3.5 h-3.5" /></button>
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          Shed 12-15, GIDC Apparel & Textile Zone, Sachin, Surat, Gujarat - 394230
                        </p>
                        <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-400 font-semibold hover:underline pt-1">
                          View on Google Maps <ExternalLink className="w-3 h-3" />
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
                    <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider border-b border-slate-700 pb-2">
                      Banking & Settlement Terms
                    </h3>

                    <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block mb-1">Bank Name</span>
                          <span className="font-bold text-white text-sm">{vendor.bankDetails?.bankName || 'HDFC Bank Ltd.'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-1">Account Holder</span>
                          <span className="font-semibold text-slate-200">{vendor.bankDetails?.accountHolder || vendor.name}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-1">Account Number</span>
                          <span className="font-mono font-bold text-blue-400 text-sm flex items-center gap-2">
                            {vendor.bankDetails?.accountNo || '50200049281920'}
                            <Copy className="w-3.5 h-3.5 cursor-pointer hover:text-white" onClick={() => copyToClipboard(vendor.bankDetails?.accountNo || '50200049281920', 'A/C No')} />
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-1">IFSC Code</span>
                          <span className="font-mono font-bold text-slate-200">{vendor.bankDetails?.ifscCode || 'HDFC0000124'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-1">UPI ID</span>
                          <span className="font-mono font-semibold text-emerald-400">{vendor.upiId || 'textilevendor@hdfcbank'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-1">Payment Terms & Credit Days</span>
                          <span className="font-semibold text-slate-200">{vendor.paymentTerms || 'Net 30'} ({vendor.creditDays || 30} Days)</span>
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
                    <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                      <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                        Vendor Document Repository
                      </h3>
                      <button
                        onClick={() => setShowDocModal(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1 shadow"
                      >
                        <Plus className="w-3.5 h-3.5" /> Upload Document
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {(hubData?.documents && hubData.documents.length > 0 ? hubData.documents : [
                        { title: 'GST Certificate Document', documentType: 'GST Certificate', fileSize: '1.2 MB', uploadedAt: new Date() },
                        { title: 'Cancelled Cheque Copy', documentType: 'Cancelled Cheque', fileSize: '850 KB', uploadedAt: new Date() },
                        { title: 'Annual Supply Agreement 2026', documentType: 'Purchase Agreement', fileSize: '3.4 MB', uploadedAt: new Date() }
                      ]).map((doc, idx) => (
                        <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono text-[10px] font-semibold border border-blue-500/30">
                              {doc.documentType}
                            </span>
                            <h4 className="font-semibold text-white">{doc.title}</h4>
                            <p className="text-[11px] text-slate-400 font-mono">{doc.fileSize} • {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <a href={doc.fileUrl || '#'} target="_blank" rel="noreferrer" className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700">
                              <Eye className="w-4 h-4" />
                            </a>
                            <a href={doc.fileUrl || '#'} download className="p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg">
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
                    <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider border-b border-slate-700 pb-2">
                      Automated Communication Activity Stream
                    </h3>

                    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
                      {(hubData?.timeline && hubData.timeline.length > 0 ? hubData.timeline : [
                        { activityType: 'Call Initiated', channel: 'Call', remarks: 'Discussed rate inquiry for 500m linen fabric', employeeName: 'Dhruv Jain', createdAt: new Date() },
                        { activityType: 'Purchase Order Shared', channel: 'WhatsApp', remarks: 'Shared PO #PO-98231 with vendor', employeeName: 'Dhruv Jain', createdAt: new Date(Date.now() - 3600000) }
                      ]).map((item, index) => (
                        <div key={index} className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-start justify-between text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{item.activityType}</span>
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px]">
                                {item.channel || 'System'}
                              </span>
                            </div>
                            <p className="text-slate-300">{item.remarks}</p>
                            <p className="text-[10px] text-slate-500 font-mono">By: {item.employeeName || 'Admin'}</p>
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
                    <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                      <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                        Pending Vendor Follow-ups & Reminders
                      </h3>
                      <button
                        onClick={() => setShowFollowUpModal(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1 shadow"
                      >
                        <Plus className="w-3.5 h-3.5" /> Create Follow-up
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(hubData?.followUps && hubData.followUps.length > 0 ? hubData.followUps : [
                        { _id: '1', title: 'Payment Clearance Follow-up for INV-9821', priority: 'High', expectedDate: new Date(), status: 'Pending', assignedEmployeeName: 'Admin' }
                      ]).map((f) => (
                        <div key={f._id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                                f.priority === 'Urgent' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}>
                                {f.priority} Priority
                              </span>
                              <h4 className="font-bold text-white">{f.title}</h4>
                            </div>
                            <p className="text-slate-400">Assigned To: {f.assignedEmployeeName} • Due: {new Date(f.expectedDate).toLocaleDateString()}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            {f.status === 'Completed' ? (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" /> Completed
                              </span>
                            ) : (
                              <button
                                onClick={() => handleCompleteFollowUp(f._id)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Complete
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
                    <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider border-b border-slate-700 pb-2">
                      Live Purchase History & PO Tracking
                    </h3>

                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block">Total Purchases</span>
                        <span className="text-lg font-bold text-blue-400">₹{(hubData?.purchaseHistory?.totalPurchaseValue || 0).toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block">Total POs</span>
                        <span className="text-lg font-bold text-white">{hubData?.purchaseHistory?.purchaseOrdersCount || 0}</span>
                      </div>
                      <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block">Returns</span>
                        <span className="text-lg font-bold text-amber-400">{hubData?.purchaseHistory?.returnsCount || 0}</span>
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-950 text-slate-400 font-mono">
                          <tr>
                            <th className="p-3">Order #</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Grand Total</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-200">
                          {(hubData?.purchaseHistory?.orders || []).slice(0, 5).map((po, i) => (
                            <tr key={i}>
                              <td className="p-3 font-mono text-blue-400">{po.poNumber || po.orderNo || `PO-${i + 100}`}</td>
                              <td className="p-3 font-mono">{new Date(po.createdAt).toLocaleDateString()}</td>
                              <td className="p-3 font-bold">₹{(po.grandTotal || po.totalAmount || 15000).toLocaleString()}</td>
                              <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">Received</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* TAB 9: OUTSTANDING                                   */}
                {/* ---------------------------------------------------- */}
                {activeTab === 'outstanding' && (
                  <div className="space-y-5 animate-fade-in">
                    <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider border-b border-slate-700 pb-2">
                      Financial Outstanding & Accounts Status
                    </h3>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-slate-400">Total Current Outstanding</span>
                        <span className="text-2xl font-bold text-red-400 block font-mono">₹{(hubData?.outstanding?.totalOutstanding || 0).toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-slate-400">Credit Limit & Terms</span>
                        <span className="text-lg font-bold text-slate-200 block font-mono">₹{(hubData?.outstanding?.creditLimit || 100000).toLocaleString()} ({hubData?.outstanding?.creditDays || 30} Days)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* TAB 10: NOTES                                        */}
                {/* ---------------------------------------------------- */}
                {activeTab === 'notes' && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                      <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                        Internal Vendor Notes & Reminders
                      </h3>
                      <button
                        onClick={() => setShowNoteModal(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1 shadow"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Note
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(hubData?.notes && hubData.notes.length > 0 ? hubData.notes : [
                        { content: 'Vendor offers 2% cash discount on payments settled within 7 days.', employeeName: 'Admin', createdAt: new Date() }
                      ]).map((n, i) => (
                        <div key={i} className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs space-y-1">
                          <p className="text-slate-200">{n.content}</p>
                          <p className="text-[10px] text-slate-500 font-mono">By: {n.employeeName} • {new Date(n.createdAt).toLocaleDateString()}</p>
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
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider border-b border-slate-700 pb-2 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-400" /> Quick Actions & Sharing
              </h3>

              <div className="space-y-2">
                <button
                  onClick={() => handleQuickAction('Call Initiated', 'Call', `Called ${vendor.name}`)}
                  className="w-full bg-slate-900 hover:bg-slate-700 text-slate-200 text-xs font-semibold p-2.5 rounded-xl border border-slate-700 flex items-center justify-between transition group"
                >
                  <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-blue-400" /> Call Vendor</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => handleQuickAction('WhatsApp Sent', 'WhatsApp', `WhatsApp to ${vendor.name}`)}
                  className="w-full bg-slate-900 hover:bg-slate-700 text-slate-200 text-xs font-semibold p-2.5 rounded-xl border border-slate-700 flex items-center justify-between transition group"
                >
                  <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-emerald-400" /> WhatsApp Vendor</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => handleQuickAction('Email Sent', 'Email', `Email sent to ${vendor.name}`)}
                  className="w-full bg-slate-900 hover:bg-slate-700 text-slate-200 text-xs font-semibold p-2.5 rounded-xl border border-slate-700 flex items-center justify-between transition group"
                >
                  <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-purple-400" /> Send Email</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => handleQuickAction('Purchase Order Shared', 'WhatsApp', `Shared latest Purchase Order with ${vendor.name}`)}
                  className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold p-2.5 rounded-xl border border-blue-500/30 flex items-center justify-between transition group"
                >
                  <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-blue-400" /> Share Purchase Order</span>
                  <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => handleQuickAction('Goods Return Shared', 'WhatsApp', `Shared Goods Return note with ${vendor.name}`)}
                  className="w-full bg-slate-900 hover:bg-slate-700 text-slate-200 text-xs font-semibold p-2.5 rounded-xl border border-slate-700 flex items-center justify-between transition group"
                >
                  <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-amber-400" /> Share Goods Return</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => handleQuickAction('Payment Advice Shared', 'WhatsApp', `Shared Payment Advice with ${vendor.name}`)}
                  className="w-full bg-slate-900 hover:bg-slate-700 text-slate-200 text-xs font-semibold p-2.5 rounded-xl border border-slate-700 flex items-center justify-between transition group"
                >
                  <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-400" /> Share Payment Advice</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => handleQuickAction('Outstanding Statement Shared', 'WhatsApp', `Shared Outstanding Ledger Statement`)}
                  className="w-full bg-slate-900 hover:bg-slate-700 text-slate-200 text-xs font-semibold p-2.5 rounded-xl border border-slate-700 flex items-center justify-between transition group"
                >
                  <span className="flex items-center gap-2"><FileCheck className="w-4 h-4 text-red-400" /> Share Outstanding Statement</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => setShowNoteModal(true)}
                  className="w-full bg-slate-900 hover:bg-slate-700 text-slate-200 text-xs font-semibold p-2.5 rounded-xl border border-slate-700 flex items-center justify-between transition group"
                >
                  <span className="flex items-center gap-2"><Edit3 className="w-4 h-4 text-cyan-400" /> Add Internal Note</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* MODAL 1: Create Follow-up */}
      {showFollowUpModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              Create Vendor Follow-up
              <button onClick={() => setShowFollowUpModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </h3>

            <form onSubmit={handleCreateFollowUp} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Follow-up Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call regarding fabric replacement..."
                  value={followUpForm.title}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Type</label>
                <select
                  value={followUpForm.followUpType}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, followUpType: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
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
                <label className="text-slate-400 block mb-1">Expected Due Date</label>
                <input
                  type="date"
                  required
                  value={followUpForm.expectedDate}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, expectedDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Priority</label>
                <select
                  value={followUpForm.priority}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, priority: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent Priority</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowFollowUpModal(false)} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500">Save Follow-up</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Upload Document */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              Upload Vendor Document
              <button onClick={() => setShowDocModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </h3>

            <form onSubmit={handleAddDocument} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GST Certificate 2026"
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Document Type</label>
                <select
                  value={docForm.documentType}
                  onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
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

              <div>
                <label className="text-slate-400 block mb-1">File URL / Attachment Link</label>
                <input
                  type="text"
                  required
                  value={docForm.fileUrl}
                  onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowDocModal(false)} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500">Upload & Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Add Note */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              Add Internal Vendor Note
              <button onClick={() => setShowNoteModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </h3>

            <form onSubmit={handleAddNote} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Note Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter internal note remarks..."
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Note Type</label>
                <select
                  value={noteForm.noteType}
                  onChange={(e) => setNoteForm({ ...noteForm, noteType: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Internal Note">Internal Note</option>
                  <option value="Private Note">Private Note</option>
                  <option value="Pinned Note">Pinned Note</option>
                  <option value="Reminder Note">Reminder Note</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowNoteModal(false)} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500">Save Note</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
