import React, { useState, useEffect } from "react";
import {
  X,
  History,
  Ruler,
  Calendar,
  User,
  Scissors,
  CheckCircle2,
  Copy,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import api from "../api/axios";

export const MeasurementHistoryModal = ({
  isOpen,
  onClose,
  customerPhone,
  customerId,
  customerName = "Customer",
  onSelectMeasurements
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [selectedGarmentFilter, setSelectedGarmentFilter] = useState("All");

  useEffect(() => {
    if (!isOpen) return;
    const fetchHistory = async () => {
      if (!customerPhone && !customerId) {
        setData(null);
        return;
      }
      setLoading(true);
      try {
        const params = {};
        if (customerPhone) params.phone = customerPhone;
        if (customerId) params.customerId = customerId;
        const res = await api.get("/customers/lookup-measurements", { params });
        if (res.data?.success) {
          setData(res.data);
        } else {
          setData(null);
        }
      } catch (err) {
        console.warn("Failed to load customer measurement history:", err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [isOpen, customerPhone, customerId]);

  if (!isOpen) return null;

  const historyRecords = data?.history || [];
  const masterMeasurements = data?.masterMeasurements || {};
  const hasMaster = Object.keys(masterMeasurements).length > 0 &&
    Object.values(masterMeasurements).some(v => v !== null && v !== "" && v !== undefined);

  // Collect unique garment types for filtering
  const garmentTypes = ["All", ...new Set(historyRecords.map(r => r.garmentType).filter(Boolean))];

  const filteredHistory = selectedGarmentFilter === "All"
    ? historyRecords
    : historyRecords.filter(r => r.garmentType === selectedGarmentFilter);

  const handleApply = (measurements, label = "Selected Record") => {
    if (onSelectMeasurements) {
      onSelectMeasurements(measurements, label);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50 px-6 py-4 border-b border-indigo-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-600/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-black text-slate-900">
                  Customer Measurement History
                </h4>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-extrabold rounded-full">
                  {historyRecords.length + (hasMaster ? 1 : 0)} record{historyRecords.length + (hasMaster ? 1 : 0) !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Customer: <strong className="text-slate-900">{customerName}</strong>
                {customerPhone && <span className="ml-1 text-slate-500 font-mono">({customerPhone})</span>}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">

          {loading ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold">Loading measurement history...</p>
            </div>
          ) : !hasMaster && historyRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <Ruler className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">No Past Measurements Found</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  No previous measurements exist for this customer yet. Take a new measurement for this job to begin their history.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* SECTION: MASTER MEASUREMENTS PROFILE (IF PRESENT) */}
              {hasMaster && (
                <div className="bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50/50 p-4 rounded-2xl border-2 border-amber-300/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-2xs">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                          Customer Master Measurement Profile
                        </h5>
                        <p className="text-[11px] text-amber-800 font-medium">
                          Permanent baseline profile on customer record
                        </p>
                      </div>
                    </div>
                    {onSelectMeasurements && (
                      <button
                        type="button"
                        onClick={() => handleApply(masterMeasurements, "Customer Master Profile")}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Use Master Profile</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 bg-white/90 p-3 rounded-xl border border-amber-200">
                    {Object.entries(masterMeasurements).map(([k, v]) => (
                      <div key={k} className="bg-amber-50/60 p-2 rounded-lg border border-amber-100/80 text-center">
                        <span className="text-[9px] font-bold text-amber-900 block truncate uppercase" title={k}>{k}</span>
                        <span className="text-xs font-black text-slate-900 font-mono">{v}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FILTER PILLS IF MULTIPLE GARMENTS */}
              {garmentTypes.length > 2 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-xs font-bold text-slate-500 uppercase mr-1">Filter Garment:</span>
                  {garmentTypes.map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGarmentFilter(g)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedGarmentFilter === g
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}

              {/* TIMELINE OF PAST JOBS / ALTERATIONS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    Past Tailoring Jobs & Alterations ({filteredHistory.length})
                  </h5>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Newest first
                  </span>
                </div>

                <div className="space-y-3">
                  {filteredHistory.map((rec, idx) => {
                    const mObj = rec.measurements || {};
                    const mEntries = Object.entries(mObj).filter(([_, v]) => v !== null && v !== "" && v !== undefined);
                    const formattedDate = rec.takenAt
                      ? new Date(rec.takenAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })
                      : "Past Job";

                    return (
                      <div
                        key={idx}
                        className="bg-slate-50 hover:bg-indigo-50/30 p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-200 transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-900 font-black text-xs rounded-lg shadow-2xs">
                              {rec.garmentType || "Garment"}
                            </span>
                            {rec.ticketId && (
                              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                #{rec.ticketId}
                              </span>
                            )}
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {formattedDate}
                            </span>
                            {rec.tailorName && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Scissors className="w-3 h-3 text-slate-400" />
                                {rec.tailorName}
                              </span>
                            )}
                          </div>

                          {onSelectMeasurements && mEntries.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleApply(mObj, `${rec.garmentType || 'Garment'} (${formattedDate})`)}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer self-start sm:self-auto shrink-0"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Apply to Job</span>
                            </button>
                          )}
                        </div>

                        {/* Measurement Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 bg-white p-2.5 rounded-xl border border-slate-200/70">
                          {mEntries.length > 0 ? (
                            mEntries.map(([k, v]) => (
                              <div key={k} className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-center">
                                <span className="text-[9px] font-bold text-slate-500 block truncate uppercase" title={k}>
                                  {k}
                                </span>
                                <span className="text-xs font-black text-slate-900 font-mono">
                                  {v}"
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="col-span-full text-xs text-slate-400 italic text-center py-1">
                              No measurement values recorded
                            </span>
                          )}
                        </div>

                        {rec.notes && (
                          <p className="text-[11px] text-slate-500 italic">
                            Note: {rec.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Current job measurements will never automatically overwrite master records.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default MeasurementHistoryModal;
