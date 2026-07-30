import api from '../api/axios';
import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function ManagerReviewPanel({ token, onAddNotification }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingRecords();
  }, []);

  const fetchPendingRecords = async () => {
    try {
      // Just fetch all for current month for now, and filter on frontend for simplicity
      const res = await api.get(`/attendance/records`);
      if (res.ok) {
        const data = res.data;
        // Filter those needing review (Expected Half Day) or those with Red Flags
        const pending = data.filter(r => r.managerReviewPending || r.redFlag);
        setRecords(pending);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (recordId, decision) => {
    try {
      const res = await api.put(`/attendance/review`, { recordId, decision, remarks: `Manager decision: ${decision}` });
      if (res.ok) {
        onAddNotification("Success", `Decision applied: ${decision}`, "success");
        setRecords(prev => prev.filter(r => r._id !== recordId)); // Remove from list
      } else {
        const data = res.data;
        onAddNotification("Error", data.message, "danger");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Reviews...</div>;

  return (
    <div className="h-full flex flex-col bg-slate-50/50 p-6 overflow-y-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            Manager Review Panel
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">Resolve Expected Half Days, Overtime & Red Flags</p>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">All clear!</h3>
          <p className="text-slate-500 text-sm">No pending attendance reviews.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {records.map(record => (
            <div key={record._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center border border-orange-100">
                  <AlertTriangle className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{record.employeeId?.name || 'Unknown Employee'}</h4>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Date: <span className="text-slate-700 font-bold">{record.date}</span> • 
                    Status: <span className="text-orange-600 font-bold ml-1">{record.attendanceStatus}</span>
                  </p>
                  <div className="flex gap-4 mt-2 text-[10px] text-slate-400 font-mono">
                    <span>IN: {new Date(record.punchInTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    {record.punchOutTime && <span>OUT: {new Date(record.punchOutTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>}
                    <span>HRS: {record.workingHours}</span>
                  </div>
                </div>
              </div>

              {record.managerReviewPending ? (
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => handleAction(record._id, 'Approve Half Day')}
                    className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs rounded-lg transition-colors border border-rose-200"
                  >
                    Confirm Half Day
                  </button>
                  <button 
                    onClick={() => handleAction(record._id, 'Keep Early Exit')}
                    className="px-4 py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 font-bold text-xs rounded-lg transition-colors border border-amber-200"
                  >
                    Keep Early Exit
                  </button>
                  <button 
                    onClick={() => handleAction(record._id, 'Ignore')}
                    className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold text-xs rounded-lg transition-colors border border-emerald-200"
                  >
                    Ignore (Full Day)
                  </button>
                </div>
              ) : (
                <div className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  Already Reviewed
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
