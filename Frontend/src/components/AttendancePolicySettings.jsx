import api from '../api/axios';
import React, { useState, useEffect } from 'react';
import { Settings, Save, Clock, AlertTriangle, ShieldCheck, DollarSign } from 'lucide-react';

export default function AttendancePolicySettings({ token, onAddNotification }) {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      const res = await api.get(`/attendance/policy`);
      if (res.ok) {
        const data = res.data;
        setPolicy(data);
      } else {
        setPolicy({
          officialReportingTime: '10:00',
          officialExitTime: '19:00',
          normalArrivalThreshold: '10:15',
          lateBufferCount: 5,
          lateDeductionAmount: 50,
          perfectArrivalRewardAmount: 500,
          perfectArrivalRewardThreshold: 25,
          minWorkingHoursAbsent: 4,
          minWorkingHoursFullDay: 8,
          severeEarlyExitTime: '16:30',
          earlyExitWindowStart: '16:30',
          earlyExitWindowEnd: '18:59',
          minorEarlyExitWindowStart: '19:00',
          minorEarlyExitWindowEnd: '19:29',
          earlyExitBufferCount: 5,
          redFlagLimit: 5,
          overtimeStartTime: '20:00',
          overtimeAmountPerDay: 200,
        });
      }
    } catch (err) {
      console.error(err);
      setPolicy({
          officialReportingTime: '10:00',
          officialExitTime: '19:00',
          normalArrivalThreshold: '10:15',
          lateBufferCount: 5,
          lateDeductionAmount: 50,
          perfectArrivalRewardAmount: 500,
          perfectArrivalRewardThreshold: 25,
          minWorkingHoursAbsent: 4,
          minWorkingHoursFullDay: 8,
          severeEarlyExitTime: '16:30',
          earlyExitWindowStart: '16:30',
          earlyExitWindowEnd: '18:59',
          minorEarlyExitWindowStart: '19:00',
          minorEarlyExitWindowEnd: '19:29',
          earlyExitBufferCount: 5,
          redFlagLimit: 5,
          overtimeStartTime: '20:00',
          overtimeAmountPerDay: 200,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setPolicy(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSave = async () => {
    try {
      const res = await api.put(`/attendance/policy`, policy);
      if (res.ok) {
        onAddNotification("Success", "Attendance Policy updated successfully", "success");
      } else {
        const data = res.data;
        onAddNotification("Error", data.message, "danger");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !policy) return <div className="p-8 text-center">Loading Settings...</div>;

  return (
    <div className="h-full flex flex-col bg-slate-50/50 p-6 overflow-y-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            Attendance Policy Configuration
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">Configure automated rules for Arrival, Exits, and Payroll Deductions</p>
        </div>
        <button 
          onClick={handleSave}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm"
        >
          <Save className="w-4 h-4" />
          Save Policy
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        
        {/* Timings */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Official Shift Timings
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Official Reporting Time</label>
              <input type="time" name="officialReportingTime" value={policy.officialReportingTime} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Official Exit Time</label>
              <input type="time" name="officialExitTime" value={policy.officialExitTime} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Min. Hours for Full Day</label>
              <input type="number" name="minWorkingHoursFullDay" value={policy.minWorkingHoursFullDay} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Min. Hours (else Absent)</label>
              <input type="number" name="minWorkingHoursAbsent" value={policy.minWorkingHoursAbsent} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
        </div>

        {/* Arrival Rules */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Arrival Rules & Rewards
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Normal Arrival Cutoff</label>
              <input type="time" name="normalArrivalThreshold" value={policy.normalArrivalThreshold} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Monthly Late Buffer Limit</label>
              <input type="number" name="lateBufferCount" value={policy.lateBufferCount} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Late Deduction (₹/Day)</label>
              <input type="number" name="lateDeductionAmount" value={policy.lateDeductionAmount} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Perfect Arrival Reward (₹)</label>
              <input type="number" name="perfectArrivalRewardAmount" value={policy.perfectArrivalRewardAmount} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
        </div>

        {/* Exit Rules */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Exit Rules & Exceptions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Severe Early Exit Before</label>
              <input type="time" name="severeEarlyExitTime" value={policy.severeEarlyExitTime} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Early Exit Start</label>
              <input type="time" name="earlyExitWindowStart" value={policy.earlyExitWindowStart} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Minor Early Exit Start</label>
              <input type="time" name="minorEarlyExitWindowStart" value={policy.minorEarlyExitWindowStart} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Monthly Red Flag Limit</label>
              <input type="number" name="redFlagLimit" value={policy.redFlagLimit} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
        </div>

        {/* Overtime */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-500" />
            Overtime & Payroll Sync
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Overtime Starts After</label>
              <input type="time" name="overtimeStartTime" value={policy.overtimeStartTime} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Overtime Payout (₹/Day)</label>
              <input type="number" name="overtimeAmountPerDay" value={policy.overtimeAmountPerDay} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
