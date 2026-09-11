import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import QRCode from 'qrcode-svg';
import {
  Scissors,
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  Phone,
  MapPin,
  Building2,
  Printer,
  Share2,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  User,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { generateCode128SvgString } from '../helpers/barcode128.helper';

export const PublicBillTrackView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { billNo: paramBillNo } = useParams();
  const navigate = useNavigate();

  const initialQuery = paramBillNo || searchParams.get('bill') || searchParams.get('billNo') || searchParams.get('id') || searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeBillNo, setActiveBillNo] = useState(initialQuery);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trackData, setTrackData] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync state if URL query changes
  useEffect(() => {
    const q = paramBillNo || searchParams.get('bill') || searchParams.get('billNo') || searchParams.get('id') || searchParams.get('q') || '';
    if (q && q !== activeBillNo) {
      setActiveBillNo(q);
      setSearchQuery(q);
    }
  }, [paramBillNo, searchParams]);

  // Fetch bill & alteration tracking details
  const fetchTracking = async (code) => {
    if (!code || !code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // Direct call to public endpoint (no auth headers required for phone camera scans)
      const res = await axios.get(`/api/v1/billing/public/track/${encodeURIComponent(code.trim())}`);
      if (res.data && res.data.success && res.data.data) {
        setTrackData(res.data.data);
      } else {
        setError(res.data?.message || 'Bill not found.');
        setTrackData(null);
      }
    } catch (err) {
      console.error('Failed to fetch bill tracking:', err);
      const msg = err.response?.data?.message || err.message || 'Unable to retrieve bill details. Please check the bill number or barcode.';
      setError(msg);
      setTrackData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBillNo) {
      fetchTracking(activeBillNo);
    }
  }, [activeBillNo]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchParams({ bill: searchQuery.trim() });
    setActiveBillNo(searchQuery.trim());
  };

  // Compute Overall Alteration Pipeline Stage
  const pipelineInfo = useMemo(() => {
    if (!trackData) return null;
    const alterations = trackData.alterations || [];
    const pssm = trackData.pssm;
    if (alterations.length === 0 && !pssm) return null;

    const statuses = alterations.map(a => (a.status || '').toUpperCase());
    const isAllCollected = alterations.length > 0 && statuses.every(s => s === 'COLLECTED' || s === 'DELIVERED' || s === 'CLOSED');
    const isAllReady = alterations.length > 0 && statuses.every(s => s === 'READY' || s === 'READY_FOR_DELIVERY' || s === 'COLLECTED' || s === 'DELIVERED');
    const isAnyTrialPending = statuses.some(s => s === 'TRIAL_PENDING' || s === 'READY_FOR_TRIAL');
    const isAnyInStitching = statuses.some(s => s === 'IN_STITCHING' || s === 'IN_PROGRESS' || s === 'STITCHING' || s === 'IN_CUTTING');

    let currentStep = 1; // 1: Booked, 2: Tailoring, 3: Trial, 4: Ready for Delivery, 5: Delivered
    let statusLabel = 'Booked & Scheduled';
    let statusColor = 'bg-blue-600';

    if (isAllCollected || pssm?.status === 'COLLECTED' || pssm?.status === 'CLOSED') {
      currentStep = 5;
      statusLabel = 'Delivered & Completed';
      statusColor = 'bg-slate-800';
    } else if (isAllReady || pssm?.status === 'READY_FOR_DELIVERY' || pssm?.status === 'READY') {
      currentStep = 4;
      statusLabel = 'Ready for Delivery / Pickup';
      statusColor = 'bg-emerald-600';
    } else if (isAnyTrialPending || pssm?.status === 'READY_FOR_TRIAL') {
      currentStep = 3;
      statusLabel = 'Ready for Customer Trial';
      statusColor = 'bg-purple-600';
    } else if (isAnyInStitching || pssm?.status === 'IN_STITCHING' || pssm?.status === 'IN_PROGRESS') {
      currentStep = 2;
      statusLabel = 'In Stitching / Alteration';
      statusColor = 'bg-amber-600';
    }

    return { currentStep, statusLabel, statusColor };
  }, [trackData]);

  // UPI QR code for outstanding balance
  const upiQrSvg = useMemo(() => {
    if (!trackData?.bill) return '';
    const bill = trackData.bill;
    const balance = Number(bill.balanceDue || 0);
    const store = trackData.store || {};
    const upiId = '9990397529@upi';
    const payeeName = store.name || 'NEW FASHION STYLE';
    const billNo = bill.billNo || bill.invoiceNo || '';

    const amtParam = balance > 0 ? `&am=${balance.toFixed(2)}` : '';
    const trParam = billNo ? `&tr=${encodeURIComponent(billNo)}` : '';
    const tnParam = billNo ? `&tn=${encodeURIComponent('Bill ' + billNo)}` : `&tn=${encodeURIComponent('Payment')}`;
    const upiContent = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}${amtParam}&cu=INR${trParam}${tnParam}`;

    try {
      const qr = new QRCode({
        content: upiContent,
        padding: 1,
        width: 140,
        height: 140,
        color: '#0f172a',
        background: '#ffffff',
        ecl: 'M',
        container: 'svg-viewbox'
      });
      return { svg: qr.svg(), link: upiContent };
    } catch (e) {
      return { svg: '', link: '' };
    }
  }, [trackData]);

  const handleShareWhatsApp = () => {
    if (!trackData?.bill) return;
    const bill = trackData.bill;
    const altCount = (trackData.alterations || []).length;
    const currentUrl = window.location.href;
    const text = `*NEW FASHION STYLE (NFS)* - Bill & Alteration Details\n` +
      `Bill No: ${bill.billNo}\n` +
      `Customer: ${bill.customerName}\n` +
      `Total: ₹${bill.grandTotal} | Paid: ₹${bill.amountPaid} | Balance: ₹${bill.balanceDue}\n` +
      (altCount > 0 ? `Alteration Garments: ${altCount} item(s) tracked.\n` : '') +
      `View Full Bill & Live Status: ${currentUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center py-6 px-3 sm:px-6 font-sans">
      {/* Top Header Card */}
      <div className="w-full max-w-3xl mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-700/60 shadow-xl">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  {trackData?.store?.name || 'NEW FASHION STYLE'}
                </h1>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-400/30 uppercase tracking-wide">
                  NFS
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Digital Invoice &amp; Alteration Tracking Portal
              </p>
            </div>
          </div>

          {/* Search / Scan Bar */}
          <form onSubmit={handleSearchSubmit} className="w-full sm:w-auto flex-1 max-w-xs flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Scan or enter Bill / PSSM #"
                className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 font-mono tracking-wide"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Track</span>}
            </button>
          </form>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="w-full max-w-3xl bg-slate-800/60 p-12 rounded-2xl border border-slate-700 text-center flex flex-col items-center justify-center gap-3 animate-pulse">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-sm font-semibold text-slate-300">Retrieving digital bill and alteration records...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="w-full max-w-3xl bg-red-950/40 border border-red-800/60 p-6 rounded-2xl text-center flex flex-col items-center gap-3">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <h3 className="text-base font-bold text-red-200">Unable to locate records</h3>
          <p className="text-xs text-red-300 max-w-md">{error}</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => { setSearchQuery('INV-16600159-891'); setActiveBillNo('INV-16600159-891'); }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700"
            >
              Try Demo Invoice (INV-16600159-891)
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {!loading && trackData && (
        <div className="w-full max-w-3xl flex flex-col gap-6">
          {/* Bill Hero Summary Card */}
          <div className="bg-gradient-to-b from-slate-800 to-slate-800/90 rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden">
            {/* Top Ribbon */}
            <div className="bg-slate-950/60 px-6 py-4 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Tax Invoice</span>
                    <span className="text-xs font-black font-mono text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      {trackData.bill.billNo}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Date: {trackData.bill.date ? new Date(trackData.bill.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                  trackData.bill.balanceDue === 0
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {trackData.bill.balanceDue === 0 ? 'Full Paid' : `Due: ₹${trackData.bill.balanceDue}`}
                </span>
              </div>
            </div>

            {/* Customer & Store Details Grid */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-700/50 text-xs">
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-2">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Customer Details</span>
                </div>
                <p className="text-sm font-black text-white">{trackData.bill.customerName}</p>
                {trackData.bill.customerPhone && (
                  <p className="text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>+91 {trackData.bill.customerPhone}</span>
                  </p>
                )}
              </div>

              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-2">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Store &amp; Tax Info</span>
                </div>
                <p className="text-xs font-bold text-white">{trackData.store?.name || 'NEW FASHION STYLE - NFS'}</p>
                <p className="text-slate-400 text-[11px] flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  <span>{trackData.store?.address || 'Ram Chowk, Sadh Nagar, Palam'}</span>
                </p>
                {trackData.store?.gstin && (
                  <p className="text-slate-400 text-[11px] font-mono mt-1">
                    GSTIN: <span className="text-slate-300 font-bold">{trackData.store.gstin}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Financial Highlights */}
            <div className="px-6 py-5 bg-slate-950/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Grand Total</span>
                <span className="text-base font-black text-white font-mono">₹{trackData.bill.grandTotal}</span>
              </div>
              <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Amount Paid</span>
                <span className="text-base font-black text-emerald-400 font-mono">₹{trackData.bill.amountPaid}</span>
              </div>
              <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Advance Paid</span>
                <span className="text-base font-black text-blue-400 font-mono">₹{trackData.bill.advancePaid || 0}</span>
              </div>
              <div className={`p-2.5 rounded-xl border ${
                trackData.bill.balanceDue > 0
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-slate-900/50 border-slate-800'
              }`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Balance Due</span>
                <span className={`text-base font-black font-mono ${trackData.bill.balanceDue > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  ₹{trackData.bill.balanceDue}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* BILL-LEVEL ALTERATION TRACKING SECTION                     */}
          {/* ========================================================= */}
          {(trackData.alterations?.length > 0 || trackData.pssm) && (
            <div className="bg-gradient-to-b from-slate-800 to-slate-800/90 rounded-3xl border-2 border-amber-500/30 shadow-2xl p-5 sm:p-7 relative overflow-hidden">
              {/* Background Accent Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Alteration Header & Priority Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
                    <Scissors className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                        Bill-Level Alteration Tracking
                      </h2>
                      {trackData.pssm?.priority && (
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          trackData.pssm.priority === 'DELIVERY' || trackData.pssm.priority === 'URGENT'
                            ? 'bg-red-500/20 text-red-300 border-red-500/30'
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}>
                          {trackData.pssm.priority}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Live status &amp; item-level garment tracking for invoice <strong className="text-white font-mono">{trackData.bill.billNo}</strong>
                    </p>
                  </div>
                </div>

                {trackData.pssm?.pssmNo && (
                  <div className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700 text-right">
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">PSSM Slip #</span>
                    <span className="text-xs font-black font-mono text-amber-400">{trackData.pssm.pssmNo}</span>
                  </div>
                )}
              </div>

              {/* Visual Pipeline Progress Stepper */}
              {pipelineInfo && (
                <div className="bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-700/60 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      Overall Stage: <strong className="text-amber-300">{pipelineInfo.statusLabel}</strong>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Step {pipelineInfo.currentStep} of 5
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2 relative">
                    {/* Connecting Bar */}
                    <div className="absolute top-4 left-6 right-6 h-1 bg-slate-800 -z-0 hidden sm:block">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${((pipelineInfo.currentStep - 1) / 4) * 100}%` }}
                      />
                    </div>

                    {[
                      { step: 1, title: 'Booked', desc: 'Received' },
                      { step: 2, title: 'Tailoring', desc: 'In Stitching' },
                      { step: 3, title: 'Trial', desc: 'Fitting Ready' },
                      { step: 4, title: 'Ready', desc: 'Ready for Pickup' },
                      { step: 5, title: 'Delivered', desc: 'Collected' }
                    ].map((st) => {
                      const isCompleted = pipelineInfo.currentStep > st.step;
                      const isCurrent = pipelineInfo.currentStep === st.step;
                      return (
                        <div key={st.step} className="flex flex-col items-center text-center relative z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all shadow-md ${
                            isCompleted
                              ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                              : isCurrent
                              ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/20 scale-110'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}>
                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : st.step}
                          </div>
                          <span className={`text-[11px] font-bold mt-2 leading-tight ${isCurrent ? 'text-amber-300' : isCompleted ? 'text-slate-200' : 'text-slate-500'}`}>
                            {st.title}
                          </span>
                          <span className="text-[9px] text-slate-500 hidden sm:block mt-0.5">
                            {st.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Schedule & Dates Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-700/60 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Expected Delivery Date</span>
                    <span className="text-sm font-black text-white font-mono">
                      {trackData.pssm?.expectedDeliveryDate
                        ? new Date(trackData.pssm.expectedDeliveryDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                        : (trackData.alterations[0]?.deliveryDate ? new Date(trackData.alterations[0].deliveryDate).toLocaleDateString('en-IN') : 'Standard Timeline')}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-700/60 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-400/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Trial Date / Status</span>
                    <span className="text-sm font-black text-white font-mono">
                      {trackData.pssm?.trialDate
                        ? new Date(trackData.pssm.trialDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
                        : (trackData.alterations.some(a => a.trialRequired) ? 'Trial Required (Date TBD)' : 'Direct Delivery (No Trial)')}
                    </span>
                  </div>
                </div>
              </div>

              {/* CONSOLIDATED ALTERATION ITEMS UNDER THIS BILL */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                    Consolidated Garments for Alteration ({trackData.alterations.length})
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Scan garment barcode for fast item lookup
                  </span>
                </div>

                <div className="space-y-4">
                  {trackData.alterations.map((item, idx) => {
                    const itemBarcode = item.alterationBarcode || item.tailorInvoiceNo || (trackData.pssm?.pssmNo ? `${trackData.pssm.pssmNo}-${idx + 1}` : null);
                    const barcodeSvg = itemBarcode ? generateCode128SvgString(itemBarcode, {
                      width: 1.4,
                      height: 38,
                      displayValue: false,
                      margin: 2,
                      background: '#ffffff',
                      lineColor: '#000000'
                    }) : '';

                    const isReady = (item.status || '').toUpperCase().includes('READY');
                    const isCollected = (item.status || '').toUpperCase().includes('COLLECTED') || (item.status || '').toUpperCase().includes('DELIVERED');

                    return (
                      <div
                        key={item.id || idx}
                        className="bg-slate-900/80 rounded-2xl border border-slate-700/80 p-4 sm:p-5 shadow-lg transition-all hover:border-slate-600"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          {/* Garment Details */}
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 font-black text-xs flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <h4 className="text-sm sm:text-base font-black text-white">
                                {item.garmentName}
                              </h4>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                isCollected
                                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                                  : isReady
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}>
                                {item.status || 'PENDING'}
                              </span>
                            </div>

                            {/* Tags / Properties */}
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mb-3">
                              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">
                                Size: <strong className="text-white">{item.size || 'Free'}</strong>
                              </span>
                              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">
                                Gender: <strong className="text-white">{item.gender || 'Standard'}</strong>
                              </span>
                              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">
                                Master Tailor: <strong className="text-amber-400">{item.tailorName || 'Assigned'}</strong>
                              </span>
                              {item.barcode && (
                                <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono text-slate-400">
                                  Tag: {item.barcode}
                                </span>
                              )}
                            </div>

                            {/* Measurements Pill Grid */}
                            {item.measurements && Object.keys(item.measurements).length > 0 && (
                              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 mb-3">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                                  Custom Measurements (Inches)
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {Object.entries(item.measurements).map(([k, v]) => (
                                    <span key={k} className="bg-slate-800/80 px-2 py-1 rounded text-[11px] border border-slate-700 text-slate-300">
                                      {k}: <strong className="text-amber-300">{v}"</strong>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Alteration Details & Instructions */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="text-slate-400 font-bold">Alteration Service:</span>
                              <span className="text-amber-300 font-medium">
                                {Array.isArray(item.alterationDetails) ? item.alterationDetails.join(', ') : (item.serviceType || 'Alteration')}
                              </span>
                              {item.specialInstructions && (
                                <p className="w-full text-[11px] text-slate-400 italic mt-1 bg-slate-950/40 p-2 rounded border border-slate-800">
                                  Note: "{item.specialInstructions}"
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Scannable Item Alteration Barcode Card */}
                          {itemBarcode && (
                            <div className="sm:w-48 bg-white p-3 rounded-2xl text-slate-950 flex flex-col items-center justify-center text-center shadow-md flex-shrink-0">
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider mb-1">
                                ITEM ALTERATION BARCODE
                              </span>
                              <div
                                className="w-full max-w-[170px] overflow-hidden [&>svg]:w-full [&>svg]:h-auto"
                                dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                              />
                              <span className="text-xs font-black font-mono tracking-wider text-slate-900 mt-1">
                                {itemBarcode}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ITEMIZED PURCHASE BREAKDOWN                               */}
          {/* ========================================================= */}
          <div className="bg-slate-800 rounded-3xl border border-slate-700 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                Purchased Garments &amp; Bill Items ({trackData.items?.length || 0})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 text-slate-400 font-bold border-b border-slate-700">
                    <th className="px-6 py-3">Item Details</th>
                    <th className="px-4 py-3">Code / Barcode</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Rate</th>
                    <th className="px-6 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {(trackData.items || []).map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-3.5">
                        <p className="font-bold text-white text-xs">{it.name}</p>
                        <p className="text-[10.5px] text-slate-400">
                          {it.size ? `Size: ${it.size}` : ''} {it.color ? `• Color: ${it.color}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-300">
                        {it.code}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-300">
                        {it.qty}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-slate-300">
                        ₹{it.price}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono font-bold text-white">
                        ₹{it.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Totals */}
            <div className="bg-slate-950/60 px-6 py-4 border-t border-slate-700 flex flex-col items-end gap-1 text-xs">
              <div className="w-full sm:w-64 space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-200">₹{trackData.bill.taxableAmount || trackData.bill.grandTotal}</span>
                </div>
                {trackData.bill.totalTax > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>GST (Tax):</span>
                    <span className="font-mono text-slate-200">₹{trackData.bill.totalTax}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                  <span>Grand Total:</span>
                  <span className="font-mono text-amber-300">₹{trackData.bill.grandTotal}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Paid:</span>
                  <span className="font-mono text-emerald-400 font-bold">₹{trackData.bill.amountPaid}</span>
                </div>
                <div className="flex justify-between text-slate-400 font-bold">
                  <span>Balance Due:</span>
                  <span className={`font-mono ${trackData.bill.balanceDue > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                    ₹{trackData.bill.balanceDue}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* UPI PAYMENT CARD (If balance due > 0)                      */}
          {/* ========================================================= */}
          {trackData.bill.balanceDue > 0 && upiQrSvg.svg && (
            <div className="bg-gradient-to-tr from-amber-500/10 via-slate-800 to-slate-800 p-6 rounded-3xl border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/30">
                  Instant UPI Payment
                </span>
                <h3 className="text-lg font-black text-white mt-2">
                  Pay Outstanding Balance ₹{trackData.bill.balanceDue}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Scan this QR code using Google Pay, PhonePe, Paytm, or BHIM to pay instantly.
                </p>
                {upiQrSvg.link && (
                  <a
                    href={upiQrSvg.link}
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95"
                  >
                    <span>Open UPI App to Pay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="bg-white p-3 rounded-2xl shadow-xl flex flex-col items-center">
                <div
                  className="w-32 h-32 flex items-center justify-center overflow-hidden [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: upiQrSvg.svg }}
                />
                <span className="text-[10px] font-mono font-bold text-slate-700 mt-1">
                  Scan &amp; Pay with UPI
                </span>
              </div>
            </div>
          )}

          {/* Action Footer Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-8">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print Bill Details</span>
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                <span>Share via WhatsApp</span>
              </button>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <span>{copiedLink ? '✓ Link Copied' : 'Copy Tracking Link'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicBillTrackView;
