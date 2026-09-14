import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Scissors,
  CheckCircle2,
  Clock,
  Calendar,
  Phone,
  Building2,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  Share2,
  Printer,
  FileText,
  User,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Search,
  Check,
  Tag,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';
import { generateCode128SvgString } from '../helpers/barcode128.helper';

export const ItemAlterationTrackView = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const paramCode = params.barcode || params.id || params.code || '';
  const queryCode = searchParams.get('barcode') || searchParams.get('ti') || searchParams.get('tag') || searchParams.get('q') || '';
  const initialQuery = paramCode || queryCode || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeBarcode, setActiveBarcode] = useState(initialQuery);

  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [trackData, setTrackData] = useState(null);

  useEffect(() => {
    const q = params.barcode || params.id || params.code || searchParams.get('barcode') || searchParams.get('ti') || searchParams.get('tag') || searchParams.get('q') || '';
    if (q && q !== activeBarcode) {
      setActiveBarcode(q);
      setSearchQuery(q);
    }
  }, [params.barcode, params.id, params.code, searchParams]);

  // Fetch Item-Level tracking details
  const fetchItemTracking = async (code) => {
    if (!code || !code.trim()) return;
    setLoading(true);
    setError(null);
    const clean = code.trim();

    let res = null;
    let fetchError = null;

    try {
      res = await axios.get(`/api/v1/pssm/public/item-track/${encodeURIComponent(clean)}`);
    } catch (err1) {
      console.warn('Relative item track API failed, trying direct backend host...', err1);
      fetchError = err1;
      try {
        const host = typeof window !== 'undefined' ? (window.location.hostname || '127.0.0.1') : '127.0.0.1';
        res = await axios.get(`http://${host}:5001/api/v1/pssm/public/item-track/${encodeURIComponent(clean)}`);
        fetchError = null;
      } catch (err2) {
        console.error('Direct backend item track API failed:', err2);
      }
    }

    if (res && res.data && res.data.success && res.data.data) {
      setTrackData(res.data.data);
      setError(null);
    } else {
      const msg = fetchError?.response?.data?.message || res?.data?.message || fetchError?.message || `No alteration garment found matching "${clean}".`;
      setError(msg);
      setTrackData(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeBarcode) {
      fetchItemTracking(activeBarcode);
    }
  }, [activeBarcode]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const clean = searchQuery.trim();
    if (!clean) return;
    setActiveBarcode(clean);
    navigate(`/item/track/${encodeURIComponent(clean)}`);
    fetchItemTracking(clean);
  };

  // Mark item status
  const handleUpdateStatus = async (newStatus) => {
    const item = trackData?.matchedItem;
    const barcodeToUpdate = item?.alterationBarcode || item?.tailorInvoiceNo || activeBarcode;
    if (!barcodeToUpdate) return;

    setUpdating(true);
    setUpdateSuccess(null);
    try {
      const res = await axios.post(`/api/v1/pssm/public/item-complete/${encodeURIComponent(barcodeToUpdate)}`, {
        status: newStatus
      });
      if (res.data?.success && res.data?.data) {
        setTrackData(res.data.data);
        setUpdateSuccess(`Status updated to ${newStatus}!`);
        setTimeout(() => setUpdateSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      // Direct backend fallback
      try {
        const host = typeof window !== 'undefined' ? (window.location.hostname || '127.0.0.1') : '127.0.0.1';
        const res2 = await axios.post(`http://${host}:5001/api/v1/pssm/public/item-complete/${encodeURIComponent(barcodeToUpdate)}`, {
          status: newStatus
        });
        if (res2.data?.success && res2.data?.data) {
          setTrackData(res2.data.data);
          setUpdateSuccess(`Status updated to ${newStatus}!`);
          setTimeout(() => setUpdateSuccess(null), 3000);
        }
      } catch (err2) {
        alert('Failed to update item status. Please check connection.');
      }
    }
    setUpdating(false);
  };

  const matchedItem = trackData?.matchedItem;
  const bill = trackData?.bill;
  const pssm = trackData?.pssm;
  const allItems = trackData?.allItems || [];
  const billSummary = trackData?.billStatusSummary || {};

  const barcodeSvg = useMemo(() => {
    const code = matchedItem?.alterationBarcode || matchedItem?.tailorInvoiceNo || activeBarcode;
    if (!code) return '';
    return generateCode128SvgString(code, {
      width: 1.6,
      height: 48,
      displayValue: false,
      margin: 2,
      background: '#ffffff',
      lineColor: '#000000'
    });
  }, [matchedItem, activeBarcode]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center py-6 px-3 sm:px-6 font-sans">
      {/* Top Header Card */}
      <div className="w-full max-w-3xl mb-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-700/80 shadow-xl">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 flex-shrink-0">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  {trackData?.store?.name || 'NEW FASHION STYLE (NFS)'}
                </h1>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-400/30 uppercase tracking-wide">
                  ITEM SCAN
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Item-Level Alteration Tracking &amp; Completion Portal
              </p>
            </div>
          </div>

          {/* Search / Barcode Input */}
          <form onSubmit={handleSearchSubmit} className="w-full sm:w-auto flex-1 max-w-xs flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Scan Item Barcode / TI #"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono tracking-wide"
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
          <p className="text-sm font-semibold text-slate-300">Locating garment item &amp; bill records...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="w-full max-w-3xl bg-red-950/40 border border-red-800/60 p-6 rounded-2xl text-center flex flex-col items-center gap-3">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <h3 className="text-base font-bold text-red-200">Garment Not Found</h3>
          <p className="text-xs text-red-300 max-w-md">{error}</p>
        </div>
      )}

      {/* Main Content Area */}
      {!loading && trackData && matchedItem && (
        <div className="w-full max-w-3xl flex flex-col gap-5">
          {/* ========================================================= */}
          {/* 1. HERO CARD: IDENTIFIED EXACT ALTERATION ITEM            */}
          {/* ========================================================= */}
          <div className="bg-gradient-to-b from-slate-800 to-slate-800/90 rounded-3xl border-2 border-amber-400/40 shadow-2xl p-5 sm:p-7 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 flex-shrink-0">
                  <Scissors className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    Target Scanned Garment
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                    {matchedItem.garmentName}
                  </h2>
                </div>
              </div>

              {/* Live Status Badge */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border shadow-sm ${
                  matchedItem.isCompleted
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-2 ring-emerald-500/20'
                    : matchedItem.status.includes('STITCH') || matchedItem.status.includes('PROGRESS')
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                }`}>
                  {matchedItem.status || 'BOOKED'}
                </span>
              </div>
            </div>

            {/* Barcode & Garment Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
              {/* Barcode Graphic Card */}
              <div className="bg-white p-3.5 rounded-2xl text-slate-950 flex flex-col items-center justify-center text-center shadow-md sm:col-span-1">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  GARMENT ALTERATION BARCODE
                </span>
                <div
                  className="w-full max-w-[190px] overflow-hidden [&>svg]:w-full [&>svg]:h-auto"
                  dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                />
                <span className="text-xs font-black font-mono tracking-wider text-slate-950 mt-1">
                  {matchedItem.alterationBarcode || matchedItem.tailorInvoiceNo}
                </span>
              </div>

              {/* Properties & Alteration Work */}
              <div className="sm:col-span-2 bg-slate-900/70 p-4 rounded-2xl border border-slate-700/70 flex flex-col justify-between text-xs space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="bg-slate-800 p-2 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[9px] font-bold uppercase">Size / Gender</span>
                    <span className="font-bold text-white">{matchedItem.size || 'Free'} ({matchedItem.gender || 'Gents'})</span>
                  </div>
                  <div className="bg-slate-800 p-2 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[9px] font-bold uppercase">Master Tailor</span>
                    <span className="font-bold text-amber-400">{matchedItem.tailorName || 'Assigned'}</span>
                  </div>
                  <div className="bg-slate-800 p-2 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[9px] font-bold uppercase">Trial Required</span>
                    <span className="font-bold text-white">{matchedItem.trialRequired ? `YES (${matchedItem.trialDate ? new Date(matchedItem.trialDate).toLocaleDateString('en-IN') : 'TBD'})` : 'NO'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold text-[11px] block">Alteration Service Description:</span>
                  <p className="text-amber-300 font-semibold text-xs mt-0.5">
                    {Array.isArray(matchedItem.alterationDetails) ? matchedItem.alterationDetails.join(', ') : (matchedItem.serviceType || 'Standard Alteration')}
                  </p>
                </div>

                {matchedItem.specialInstructions && (
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 text-[11px] text-slate-300 italic">
                    Note: "{matchedItem.specialInstructions}"
                  </div>
                )}
              </div>
            </div>

            {/* Custom Measurements (if recorded) */}
            {matchedItem.measurements && Object.keys(matchedItem.measurements).length > 0 && (
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 mb-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                  Garment Custom Measurements (Inches)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(matchedItem.measurements).map(([k, v]) => (
                    <span key={k} className="bg-slate-800 px-2 py-1 rounded text-[11px] border border-slate-700 text-slate-300">
                      {k}: <strong className="text-amber-300">{v}"</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* RECORD / UPDATE COMPLETION ACTION BUTTONS                 */}
            {/* ========================================================= */}
            <div className="pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus('READY')}
                  disabled={updating || matchedItem.status === 'READY'}
                  className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
                    matchedItem.status === 'READY'
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{matchedItem.status === 'READY' ? '✓ Item Marked READY' : 'Mark Item as READY'}</span>
                </button>

                <button
                  onClick={() => handleUpdateStatus('IN_STITCHING')}
                  disabled={updating || matchedItem.status === 'IN_STITCHING'}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>In Stitching</span>
                </button>

                <button
                  onClick={() => handleUpdateStatus('COLLECTED')}
                  disabled={updating || matchedItem.status === 'COLLECTED'}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Delivered / Collected</span>
                </button>
              </div>

              {updateSuccess && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-800 animate-fade-in">
                  ✓ {updateSuccess}
                </span>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. IDENTIFIED ORIGINAL BILL & PSSM SLIP INFO              */}
          {/* ========================================================= */}
          <div className="bg-slate-800/90 rounded-3xl border border-slate-700 p-5 shadow-xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Original Bill Summary */}
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  Original Bill Details
                </span>
                <span className="font-mono font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  {bill?.billNo || 'N/A'}
                </span>
              </div>
              <p className="text-sm font-black text-white">{bill?.customerName || 'Customer'}</p>
              <p className="text-slate-400 mt-0.5">Phone: +91 {bill?.customerPhone || 'N/A'}</p>
              <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-between text-[11px]">
                <span className="text-slate-400">Total: <strong className="text-white font-mono">₹{bill?.grandTotal}</strong></span>
                <span className="text-slate-400">Paid: <strong className="text-emerald-400 font-mono">₹{bill?.amountPaid}</strong></span>
                <span className="text-slate-400">Due: <strong className="text-amber-400 font-mono">₹{bill?.balanceDue}</strong></span>
              </div>
            </div>

            {/* PSSM Ticket Summary */}
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-amber-400" />
                  PSSM Alteration Ticket
                </span>
                <span className="font-mono font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  {pssm?.pssmNo || 'N/A'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Priority: <strong className="text-white uppercase">{pssm?.priority || 'NORMAL'}</strong>
              </p>
              <p className="text-slate-400 mt-1">
                Expected Delivery: <strong className="text-white">{pssm?.expectedDeliveryDate ? new Date(pssm.expectedDeliveryDate).toLocaleDateString('en-IN') : 'Standard'}</strong>
              </p>
              <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-between text-[11px]">
                <span className="text-slate-400">Overall Stage:</span>
                <span className="font-bold text-amber-300">{pssm?.overallStatus || 'IN PROGRESS'}</span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. BILL-LEVEL GARMENTS PROGRESS MATRIX                     */}
          {/* ========================================================= */}
          <div className="bg-slate-800 rounded-3xl border border-slate-700 shadow-xl p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  All Alteration Items Under Bill {bill?.billNo} ({allItems.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Completed: <strong className="text-emerald-400">{billSummary.completedCount}</strong> | Pending: <strong className="text-amber-400">{billSummary.pendingCount}</strong>
                </p>
              </div>

              {/* Percentage Badge */}
              <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 text-right font-mono">
                <span className="text-[10px] text-slate-400 block uppercase">Bill Completion</span>
                <span className={`text-sm font-black ${billSummary.isAllCompleted ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {billSummary.completionPercentage}% Ready
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-900 rounded-full h-2 mb-5 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-500"
                style={{ width: `${billSummary.completionPercentage || 0}%` }}
              />
            </div>

            {/* Items List */}
            <div className="space-y-3">
              {allItems.map((item, idx) => {
                const isCurrent = item.isCurrentScanned || (matchedItem && String(item.id) === String(matchedItem.id));
                return (
                  <div
                    key={item.id || idx}
                    onClick={() => {
                      if (!isCurrent) {
                        const nextCode = item.alterationBarcode || item.tailorInvoiceNo;
                        if (nextCode) {
                          setActiveBarcode(nextCode);
                          setSearchQuery(nextCode);
                          navigate(`/item/track/${encodeURIComponent(nextCode)}`);
                        }
                      }
                    }}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-900/90 border-amber-400 ring-2 ring-amber-400/30 shadow-lg'
                        : item.isCompleted
                        ? 'bg-slate-900/50 border-emerald-500/40 hover:border-emerald-500/70'
                        : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                          item.isCompleted
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        }`}>
                          {item.isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-white text-sm">
                              {item.garmentName}
                            </h4>
                            {isCurrent && (
                              <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase">
                                Scanned Target
                              </span>
                            )}
                          </div>
                          <p className="text-slate-400 text-[11px] font-mono mt-0.5">
                            {item.alterationBarcode || item.tailorInvoiceNo} &bull; Tailor: <span className="text-slate-300 font-bold">{item.tailorName || 'Assigned'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                          item.isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {item.status || 'PENDING'}
                        </span>
                        {!isCurrent && (
                          <span className="text-slate-400 text-[11px] flex items-center gap-1 hover:text-white">
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemAlterationTrackView;
