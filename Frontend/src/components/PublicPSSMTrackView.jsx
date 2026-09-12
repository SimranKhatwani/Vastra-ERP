import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { Printer, Download, ExternalLink, RefreshCw, Scissors, Search } from 'lucide-react';

export const PublicPSSMTrackView = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const paramCode = params.pssmNo || params.id || params.code || '';
  const queryCode = searchParams.get('pssm') || searchParams.get('pssmNo') || searchParams.get('ticket') || searchParams.get('q') || searchParams.get('code') || '';
  const initialQuery = paramCode || queryCode || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activePssmNo, setActivePssmNo] = useState(initialQuery);

  useEffect(() => {
    const q = params.pssmNo || params.id || params.code || searchParams.get('pssm') || searchParams.get('pssmNo') || searchParams.get('ticket') || searchParams.get('q') || searchParams.get('code') || '';
    if (q && q !== activePssmNo) {
      setActivePssmNo(q);
      setSearchQuery(q);
    }
  }, [params.pssmNo, params.id, params.code, searchParams]);

  const pdfUrl = activePssmNo ? `/api/v1/pssm/public/pssm-pdf/${encodeURIComponent(activePssmNo.trim())}` : '';

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const clean = searchQuery.trim();
    if (!clean) return;
    setActivePssmNo(clean);
    navigate(`/pssm/track/${encodeURIComponent(clean)}`);
  };

  const handlePrint = () => {
    const iframe = document.getElementById('pssm-pdf-frame');
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
      link.download = `PSSM-${activePssmNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-2 sm:p-4 font-sans">
      {/* Minimal Top Control Bar */}
      <header className="w-full max-w-4xl bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 mb-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Scissors className="w-5 h-5 text-amber-400" />
          <span className="text-xs sm:text-sm font-black tracking-wide text-white uppercase">
            PSSM Live Alteration Slip PDF &bull; <span className="font-mono text-amber-300">{activePssmNo || 'Enter PSSM #'}</span>
          </span>
        </div>

        {/* Quick Search / Scan Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 flex-1 max-w-xs justify-end">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="PSSM Slip #"
              className="w-full pl-8 pr-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer"
          >
            Track
          </button>
        </form>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            title="Print PSSM Slip"
            className="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={handleDownload}
            title="Download PDF"
            className="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new tab / PDF viewer"
            className="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Full PDF</span>
          </a>
        </div>
      </header>

      {/* Embedded Single-Page PSSM PDF Viewer */}
      <main className="w-full max-w-4xl flex-1 flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-700 min-h-[85vh]">
        {pdfUrl ? (
          <iframe
            id="pssm-pdf-frame"
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            title={`PSSM-${activePssmNo}`}
            className="w-full flex-1 border-0 min-h-[85vh]"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-2">
            <Scissors className="w-12 h-12 text-slate-400" />
            <p className="text-sm font-bold">Please enter or scan a PSSM slip number.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicPSSMTrackView;
