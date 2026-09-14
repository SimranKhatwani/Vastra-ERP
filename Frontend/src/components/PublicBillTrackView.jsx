import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { Printer, Download, ExternalLink, FileText, Search } from 'lucide-react';

export const PublicBillTrackView = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const paramCode = params.invoiceNo || params.billNo || params.id || params.code || '';
  const queryCode = searchParams.get('bill') || searchParams.get('billNo') || searchParams.get('invoiceNo') || searchParams.get('id') || searchParams.get('q') || searchParams.get('code') || '';
  const initialQuery = paramCode || queryCode || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeBillNo, setActiveBillNo] = useState(initialQuery);

  useEffect(() => {
    const q = params.invoiceNo || params.billNo || params.id || params.code || searchParams.get('bill') || searchParams.get('billNo') || searchParams.get('invoiceNo') || searchParams.get('id') || searchParams.get('q') || searchParams.get('code') || '';
    if (q && q !== activeBillNo) {
      setActiveBillNo(q);
      setSearchQuery(q);
    }
  }, [params.invoiceNo, params.billNo, params.id, params.code, searchParams]);

  const pdfUrl = activeBillNo ? `/api/v1/billing/public/invoice-pdf/${encodeURIComponent(activeBillNo.trim())}` : '';

  // Auto-redirect mobile browsers directly to native PDF stream for 100% full-screen fit with zero scrolling
  useEffect(() => {
    if (activeBillNo && typeof window !== 'undefined') {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      const forceEmbed = searchParams.get('embed') === 'true';
      if (isMobile && !forceEmbed && pdfUrl) {
        window.location.replace(pdfUrl);
      }
    }
  }, [activeBillNo, searchParams, pdfUrl]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const clean = searchQuery.trim();
    if (!clean) return;
    setActiveBillNo(clean);
    navigate(`/invoice/track/${encodeURIComponent(clean)}`);
  };

  const handlePrint = () => {
    const iframe = document.getElementById('invoice-pdf-frame');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } else if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `Invoice-${activeBillNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden m-0 p-0 font-sans">
      {/* Ultra-Compact Top Bar (No Scrolling) */}
      <header className="w-full bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between gap-2 flex-shrink-0 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-xs font-black tracking-wide text-white uppercase truncate">
            TAX INVOICE &bull; <span className="font-mono text-amber-300">{activeBillNo || 'ENTER INVOICE #'}</span>
          </span>
        </div>

        {/* Quick Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 max-w-xs">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Invoice #"
              className="w-28 sm:w-44 pl-6 pr-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded cursor-pointer"
          >
            Load
          </button>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handlePrint}
            title="Print Invoice"
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer border border-slate-700"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={handleDownload}
            title="Download PDF"
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in native PDF viewer"
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold flex items-center gap-1 border border-slate-700"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open PDF</span>
          </a>
        </div>
      </header>

      {/* 100% Fit Full-Height Single-Page Document View (Zero Page Scroll) */}
      <main className="w-full flex-1 bg-slate-950 overflow-hidden flex items-center justify-center p-0 m-0">
        {pdfUrl ? (
          <object
            data={`${pdfUrl}#page=1&view=Fit&zoom=page-fit&toolbar=0&navpanes=0&scrollbar=0`}
            type="application/pdf"
            className="w-full h-full border-0 overflow-hidden block"
          >
            <iframe
              id="invoice-pdf-frame"
              src={`${pdfUrl}#page=1&view=Fit&zoom=page-fit&toolbar=0&navpanes=0&scrollbar=0`}
              title={`Invoice-${activeBillNo}`}
              className="w-full h-full border-0 overflow-hidden block"
            />
          </object>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-slate-400 gap-2">
            <FileText className="w-8 h-8 text-slate-500" />
            <p className="text-xs font-bold">Please enter an invoice number.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicBillTrackView;
