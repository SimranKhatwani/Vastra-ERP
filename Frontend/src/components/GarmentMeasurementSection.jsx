import React, { useState, useEffect, useMemo } from "react";
import {
  Ruler,
  History,
  CheckCircle2,
  Copy,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShieldCheck,
  Plus,
  Scissors
} from "lucide-react";
import {
  GENTS_GARMENTS_CONFIG,
  LADIES_GARMENTS_CONFIG,
  OPTIONAL_MEASUREMENT_FIELDS,
  detectGarmentType,
  getGarmentMeasurementFields
} from "../helpers/measurementConfig";
import api from "../api/axios";

export const GarmentMeasurementSection = ({
  gender = "Gents",
  onGenderChange,
  garmentType = "Shirt",
  onGarmentChange,
  measurements = {},
  onChange,
  customerPhone = "",
  customerId = "",
  customerName = "Customer",
  saveAsMaster = false,
  onSaveAsMasterChange,
  onOpenHistory,
  allowGenderSwitch = true,
  themeColor = "amber" // "amber" | "rose" | "indigo"
}) => {
  // Modes: "NEW" | "EXISTING"
  const [measurementMode, setMeasurementMode] = useState("NEW");
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [lookupData, setLookupData] = useState(null);

  // Background lookup of customer measurements
  useEffect(() => {
    let isCancelled = false;
    const fetchExisting = async () => {
      const cleanPhone = (customerPhone || "").replace(/\D/g, "");
      if (!cleanPhone && !customerId) {
        setLookupData(null);
        return;
      }
      if (cleanPhone && cleanPhone.length < 10 && !customerId) {
        return;
      }

      setLoadingLookup(true);
      try {
        const params = {};
        if (cleanPhone) params.phone = cleanPhone;
        if (customerId) params.customerId = customerId;
        const res = await api.get("/customers/lookup-measurements", { params });
        if (!isCancelled && res.data?.success) {
          setLookupData(res.data);
        }
      } catch (err) {
        if (!isCancelled) setLookupData(null);
      } finally {
        if (!isCancelled) setLoadingLookup(false);
      }
    };

    fetchExisting();
    return () => { isCancelled = true; };
  }, [customerPhone, customerId]);

  const activeConfig = gender === "Ladies" ? LADIES_GARMENTS_CONFIG : GENTS_GARMENTS_CONFIG;
  const garmentKeys = Object.keys(activeConfig);

  // Current main fields according to standard specifications
  const mainFields = useMemo(() => {
    return getGarmentMeasurementFields(garmentType, gender);
  }, [garmentType, gender]);

  // Check if any optional field has a value already entered
  const hasActiveOptionalValues = useMemo(() => {
    return OPTIONAL_MEASUREMENT_FIELDS.some(f => {
      const val = measurements[f];
      return val !== undefined && val !== null && String(val).trim() !== "";
    });
  }, [measurements]);

  // Existing records stats
  const historyRecords = lookupData?.history || [];
  const masterMeasurements = lookupData?.masterMeasurements || {};
  const hasMaster = Object.keys(masterMeasurements).length > 0 &&
    Object.values(masterMeasurements).some(v => v !== null && v !== "" && v !== undefined);
  const totalExisting = historyRecords.length + (hasMaster ? 1 : 0);

  const handleFieldChange = (field, value) => {
    if (!onChange) return;
    onChange({
      ...measurements,
      [field]: value
    });
  };

  const handleApplyExisting = (existingObj, sourceLabel = "") => {
    if (!onChange) return;
    onChange({
      ...measurements,
      ...existingObj
    });
    setMeasurementMode("NEW");
  };

  const handleClearAll = () => {
    if (!onChange) return;
    const cleared = {};
    Object.keys(measurements).forEach(k => {
      cleared[k] = "";
    });
    onChange(cleared);
  };

  // Color theme helpers
  const primaryBg = themeColor === "rose" ? "bg-rose-600" : themeColor === "indigo" ? "bg-indigo-600" : "bg-amber-600";
  const primaryHoverBg = themeColor === "rose" ? "hover:bg-rose-700" : themeColor === "indigo" ? "hover:bg-indigo-700" : "hover:bg-amber-700";
  const primaryText = themeColor === "rose" ? "text-rose-600" : themeColor === "indigo" ? "text-indigo-600" : "text-amber-700";
  const primaryBorder = themeColor === "rose" ? "border-rose-300" : themeColor === "indigo" ? "border-indigo-300" : "border-amber-300";
  const lightBg = themeColor === "rose" ? "bg-rose-50" : themeColor === "indigo" ? "bg-indigo-50" : "bg-amber-50";

  return (
    <div className="space-y-3.5">

      {/* TOP BAR: GENDER TOGGLE + GARMENT SELECTOR CHIPS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-slate-500" />
              Standard Garment Matrix
            </span>
            {allowGenderSwitch && onGenderChange && (
              <div className="inline-flex rounded-lg p-0.5 bg-slate-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => {
                    onGenderChange("Gents");
                    if (onGarmentChange) onGarmentChange("Shirt");
                  }}
                  className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                    gender === "Gents" ? "bg-white text-blue-700 shadow-2xs font-extrabold" : "text-slate-600"
                  }`}
                >
                  👨 Gents
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onGenderChange("Ladies");
                    if (onGarmentChange) onGarmentChange("Kurti / Suit");
                  }}
                  className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                    gender === "Ladies" ? "bg-white text-rose-700 shadow-2xs font-extrabold" : "text-slate-600"
                  }`}
                >
                  👩 Ladies
                </button>
              </div>
            )}
          </div>

          {/* Quick links: Measurement history & clear */}
          <div className="flex items-center gap-2">
            {onOpenHistory && (
              <button
                type="button"
                onClick={onOpenHistory}
                className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                title="View full customer measurement history"
              >
                <History className="w-3.5 h-3.5" />
                <span>History ({totalExisting})</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-700 flex items-center gap-0.5 cursor-pointer"
              title="Clear all fields"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Garment Quick Selection Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
          {garmentKeys.map((gKey) => {
            const isSelected = garmentType === gKey;
            return (
              <button
                key={gKey}
                type="button"
                onClick={() => {
                  if (onGarmentChange) onGarmentChange(gKey);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs scale-102"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {activeConfig[gKey].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* MODE SELECTOR: TAKE NEW vs USE EXISTING */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setMeasurementMode("NEW")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
            measurementMode === "NEW"
              ? `${primaryBg} text-white shadow-xs`
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>Take New Measurement</span>
        </button>

        <button
          type="button"
          onClick={() => setMeasurementMode("EXISTING")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
            measurementMode === "EXISTING"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Use Existing Measurement</span>
          {totalExisting > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              measurementMode === "EXISTING" ? "bg-indigo-700 text-white" : "bg-indigo-100 text-indigo-700"
            }`}>
              {totalExisting}
            </span>
          )}
        </button>
      </div>

      {/* ─── TAB 1: USE EXISTING MEASUREMENT ─── */}
      {measurementMode === "EXISTING" && (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Saved Measurements for {customerName}
            </h5>
            {onOpenHistory && (
              <button
                type="button"
                onClick={onOpenHistory}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                View Full Timeline
              </button>
            )}
          </div>

          {loadingLookup ? (
            <div className="py-6 text-center text-slate-500 space-y-1">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold">Checking customer history...</p>
            </div>
          ) : totalExisting === 0 ? (
            <div className="py-6 text-center text-slate-400 space-y-1">
              <p className="text-xs font-bold text-slate-600">No Prior Measurements on Record</p>
              <p className="text-[11px] text-slate-400">
                Please enter fresh measurements below using "Take New Measurement".
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {/* Option A: Master Profile */}
              {hasMaster && (
                <div className="bg-white p-3 rounded-xl border border-amber-300 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-black text-amber-900">Customer Master Profile</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyExisting(masterMeasurements, "Master Profile")}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Apply to Current Job</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-[10px]">
                    {Object.entries(masterMeasurements).map(([k, v]) => (
                      <div key={k} className="bg-amber-50/70 p-1.5 rounded text-center border border-amber-100">
                        <span className="text-slate-500 font-bold block truncate">{k}</span>
                        <span className="font-mono font-black text-slate-900">{v}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Option B: Past Tickets */}
              {historyRecords.slice(0, 3).map((rec, i) => {
                const mEntries = Object.entries(rec.measurements || {}).filter(([_, v]) => v);
                const recDate = rec.takenAt ? new Date(rec.takenAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Past";
                return (
                  <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800">{rec.garmentType || "Garment"}</span>
                        {rec.ticketId && <span className="text-[10px] font-mono text-indigo-600 font-bold">#{rec.ticketId}</span>}
                        <span className="text-[10px] text-slate-400">({recDate})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyExisting(rec.measurements, rec.garmentType)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Apply to Current Job</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-[10px]">
                      {mEntries.slice(0, 6).map(([k, v]) => (
                        <div key={k} className="bg-slate-50 p-1.5 rounded text-center border border-slate-100">
                          <span className="text-slate-400 font-bold block truncate">{k}</span>
                          <span className="font-mono font-black text-slate-800">{v}"</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: TAKE NEW MEASUREMENT (MAIN FIELD GRID) ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              {garmentType} Specifications ({mainFields.length} fields)
            </span>
            {activeConfig[garmentType]?.useInseam && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-black rounded-md border border-blue-200">
                Inseam Active
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            All values in inches (")
          </span>
        </div>

        {/* Dynamic Standard Fields Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {mainFields.map((field) => {
            const val = measurements[field] || "";
            const isInseam = field.includes("Inseam") || field.includes("Inner Leg");
            return (
              <div
                key={field}
                className={`p-2.5 rounded-xl border transition-all ${
                  isInseam
                    ? "bg-blue-50/50 border-blue-200 focus-within:border-blue-500 focus-within:bg-blue-50"
                    : "bg-slate-50 border-slate-200 focus-within:border-amber-400 focus-within:bg-amber-50/30"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-black uppercase truncate block ${
                    isInseam ? "text-blue-900 font-extrabold" : "text-slate-600"
                  }`} title={field}>
                    {field}
                  </span>
                  {isInseam && (
                    <span className="text-[9px] text-blue-600 font-bold shrink-0">Leg</span>
                  )}
                </div>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                    placeholder="-"
                    className="w-full bg-transparent text-sm font-black text-slate-900 outline-none font-mono"
                  />
                  <span className="text-[10px] font-bold text-slate-400 font-mono ml-1">in</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* EXPANDABLE OPTIONAL FIELDS (Outseam, Neck, Armhole, etc.) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className="text-[11px] font-extrabold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors"
          >
            {showOptionalFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>
              {showOptionalFields ? "Hide Optional Fields" : "+ Optional Fields (Outseam, Neck, Armhole, etc.)"}
            </span>
            {hasActiveOptionalValues && !showOptionalFields && (
              <span className="ml-1 w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>

          {showOptionalFields && (
            <div className="mt-2.5 p-3 bg-slate-50/80 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 animate-fade-in">
              {OPTIONAL_MEASUREMENT_FIELDS.map((optField) => {
                // If this field is already in mainFields, skip it
                if (mainFields.includes(optField)) return null;
                const val = measurements[optField] || "";
                return (
                  <div
                    key={optField}
                    className="p-2 rounded-xl bg-white border border-slate-200 focus-within:border-slate-400"
                  >
                    <span className="text-[9px] font-bold text-slate-500 uppercase block truncate mb-0.5" title={optField}>
                      {optField}
                    </span>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleFieldChange(optField, e.target.value)}
                        placeholder="-"
                        className="w-full bg-transparent text-xs font-black text-slate-900 outline-none font-mono"
                      />
                      <span className="text-[9px] font-bold text-slate-400 font-mono ml-0.5">in</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MASTER OVERWRITE PROTECTION CHECKBOX */}
        {onSaveAsMasterChange && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="saveAsMasterCheckbox"
              checked={saveAsMaster}
              onChange={(e) => onSaveAsMasterChange(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
            />
            <label htmlFor="saveAsMasterCheckbox" className="text-xs cursor-pointer select-none">
              <span className="font-black text-slate-800 block">
                Update Customer Master Measurement Profile
              </span>
              <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                🔒 <strong>Kept unchecked by default.</strong> Measurements are securely saved with this tailoring job without modifying the customer's permanent baseline master profile.
              </span>
            </label>
          </div>
        )}
      </div>

    </div>
  );
};

export default GarmentMeasurementSection;
