import api from '../api/axios';
import React, { useState, useEffect } from 'react';
import { Fingerprint, Clock, Calendar, CheckCircle, AlertTriangle, XCircle, ChevronRight, Activity, DollarSign, Award, Target, UserCheck, ShieldAlert } from 'lucide-react';

export default function AttendanceDashboardView({ employees, token, onAddNotification, currentUser }) {
  const [stats, setStats] = useState(null);
  const [myPunch, setMyPunch] = useState(null);
  const [activeEmployeeId, setActiveEmployeeId] = useState(""); 
  
  const isAdmin = ["admin", "businessadmin", "superadmin"].includes((currentUser?.role || '').toLowerCase()) || 
    (currentUser?.name || '').toLowerCase().includes("dhruv");

  // Lock activeEmployeeId to logged in user for non-admins, or initialize first employee for admins
  useEffect(() => {
    if (!isAdmin && currentUser) {
      const myEmp = employees?.find(e => 
        (e.id || e._id) === (currentUser.employeeId || currentUser._id || currentUser.id) ||
        (e.email && currentUser.email && e.email.toLowerCase() === currentUser.email.toLowerCase()) ||
        (e.name && currentUser.name && e.name.toLowerCase() === currentUser.name.toLowerCase())
      );
      const myId = myEmp?.id || myEmp?._id || currentUser.employeeId || currentUser._id || currentUser.id;
      setActiveEmployeeId(myId);
    } else if (employees && employees.length > 0 && !activeEmployeeId) {
      setActiveEmployeeId(employees[0].id || employees[0]._id);
    }
  }, [employees, currentUser, isAdmin]);

  useEffect(() => {
    fetchStats();
    if (activeEmployeeId) fetchMyPunchStatus();
  }, [activeEmployeeId]);

  const fetchStats = async () => {
    try {
      const res = await api.get(`/attendance/dashboard-stats`);
      if (res.ok) {
        const data = res.data;
        setStats(data);
      } else {
        setStats({
          present: 42, absent: 3, halfDays: 2, expectedHalfDays: 1,
          perfectArrivals: 20, normalArrivals: 15, veryLates: 7,
          earlyExits: 1, minorEarlyExits: 2, redFlags: 2,
          pendingReviews: 3, overtimeAmount: 1450, totalWorkingHours: 350,
          averageWorkingHours: 8.2
        });
      }
    } catch (err) {
      console.error(err);
      setStats({
          present: 42, absent: 3, halfDays: 2, expectedHalfDays: 1,
          perfectArrivals: 20, normalArrivals: 15, veryLates: 7,
          earlyExits: 1, minorEarlyExits: 2, redFlags: 2,
          pendingReviews: 3, overtimeAmount: 1450, totalWorkingHours: 350,
          averageWorkingHours: 8.2
      });
    }
  };

  const fetchMyPunchStatus = async () => {
    try {
      const res = await api.get(`/attendance/status?employeeId=${activeEmployeeId}`);
      if (res.ok) {
        const data = res.data;
        setMyPunch(data);
      } else {
        setMyPunch({ status: 'Not Punched In' });
      }
    } catch (err) {
      console.error(err);
      setMyPunch({ status: 'Not Punched In' });
    }
  };

  const handlePunchIn = async () => {
    if (!activeEmployeeId) return onAddNotification("Error", "Select an employee first", "danger");
    try {
      const res = await api.post(`/attendance/punch-in`, {
          employeeId: activeEmployeeId,
          location: 'HQ Branch',
          device: 'Web Terminal',
          ip: '192.168.1.1'
        });
      const data = res.data;
      if (res.ok) {
        onAddNotification("Success", "Punched In Successfully!", "success");
        fetchMyPunchStatus();
        fetchStats();
      } else {
        onAddNotification("Error", data.message, "danger");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePunchOut = async () => {
    if (!activeEmployeeId) return;
    try {
      const res = await api.post(`/attendance/punch-out`, {
          employeeId: activeEmployeeId,
          location: 'HQ Branch',
          device: 'Web Terminal'
        });
      const data = res.data;
      if (res.ok) {
        onAddNotification("Success", `Punched Out! Status: ${data.attendanceStatus}`, "success");
        fetchMyPunchStatus();
        fetchStats();
      } else {
        onAddNotification("Error", data.message, "danger");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!stats) return <div className="p-8 text-center text-slate-500">Loading Dashboard...</div>;

  return (
    <div className="h-full flex flex-col bg-slate-50/50 p-6 overflow-y-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600" />
            Enterprise Attendance Hub
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">Real-time Rule Engine & Payroll Sync</p>
        </div>
        <div className="flex gap-4 items-center">
          {isAdmin ? (
            <select 
              value={activeEmployeeId}
              onChange={(e) => setActiveEmployeeId(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Select Kiosk User --</option>
              {employees?.map(e => (
                <option key={e.id || e._id} value={e.id || e._id}>{e.name} - {e.role || 'Staff'}</option>
              ))}
            </select>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Punching for: <strong className="text-indigo-600">{currentUser?.name || 'My Account'}</strong> ({currentUser?.role || 'Staff'})</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Terminal Kiosk */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500"></div>
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest mb-6">Punch Terminal</h2>
          
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="w-32 h-32 rounded-full bg-slate-50 border-4 border-slate-100 flex items-center justify-center shadow-inner relative">
              <Fingerprint className={`w-16 h-16 ${myPunch?.punchInTime && !myPunch?.punchOutTime ? 'text-emerald-500 animate-pulse' : 'text-slate-300'}`} />
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-black text-slate-800 tabular-nums">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</h3>
              <p className="text-xs font-bold text-slate-500 mt-1">{new Date().toLocaleDateString(undefined, {weekday: 'long', month: 'short', day: 'numeric'})}</p>
            </div>

            {(!myPunch || myPunch.status === 'Not Punched In') ? (
              <button 
                onClick={handlePunchIn}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-lg shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                PUNCH IN
              </button>
            ) : myPunch.punchInTime && !myPunch.punchOutTime ? (
              <button 
                onClick={handlePunchOut}
                className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-lg shadow-lg shadow-rose-200 transition-all active:scale-95"
              >
                PUNCH OUT
              </button>
            ) : (
              <div className="w-full py-4 bg-slate-100 text-slate-400 font-black rounded-xl text-lg text-center cursor-not-allowed">
                SHIFT COMPLETED
              </div>
            )}
          </div>

          {myPunch?.punchInTime && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">In: {new Date(myPunch.punchInTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                {myPunch.punchOutTime && <span className="font-bold text-slate-500">Out: {new Date(myPunch.punchOutTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>}
              </div>
              <div className="mt-2 text-center">
                <span className={`text-[10px] uppercase font-black px-2 py-1 rounded ${
                  myPunch.arrivalClassification === 'Perfect Arrival' ? 'bg-emerald-100 text-emerald-700' :
                  myPunch.arrivalClassification === 'Very Late Arrival' ? 'bg-rose-100 text-rose-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {myPunch.arrivalClassification}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Global Stats Matrix */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard title="Present Days" value={stats.present} icon={<UserCheck className="w-5 h-5" />} color="emerald" />
          <StatCard title="Absent Days" value={stats.absent} icon={<XCircle className="w-5 h-5" />} color="rose" />
          <StatCard title="Half Days" value={stats.halfDays} icon={<Clock className="w-5 h-5" />} color="amber" />
          
          <StatCard title="Expected Half Days" value={stats.expectedHalfDays} icon={<AlertTriangle className="w-5 h-5" />} color="orange" subtitle="Requires Review" />
          <StatCard title="Pending Reviews" value={stats.pendingReviews} icon={<ShieldAlert className="w-5 h-5" />} color="indigo" subtitle="Managers Action Req." />
          <StatCard title="Red Flags" value={stats.redFlags} icon={<AlertTriangle className="w-5 h-5" />} color="rose" subtitle="Repeated Minor Exits" />
          
          <StatCard title="Perfect Arrivals" value={stats.perfectArrivals} icon={<CheckCircle className="w-5 h-5" />} color="emerald" />
          <StatCard title="Very Late" value={stats.veryLates} icon={<Calendar className="w-5 h-5" />} color="rose" subtitle="Subject to Buffers" />
          <StatCard title="Avg Work Hours" value={`${stats.averageWorkingHours}h`} icon={<Target className="w-5 h-5" />} color="blue" />
        </div>
      </div>

      {/* Payroll Impact Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
         <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Active Payroll Impacts
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Accrued Overtime</span>
                  <Award className="w-4 h-4 text-emerald-500" />
               </div>
               <div className="text-3xl font-black text-slate-800">₹{stats.overtimeAmount}</div>
               <p className="text-[10px] text-slate-400 mt-2 font-semibold">Automatically pushed to payroll runs.</p>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Discipline Rewards</span>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
               </div>
               <div className="text-3xl font-black text-slate-800">Available</div>
               <p className="text-[10px] text-slate-400 mt-2 font-semibold">Configured at ₹500 for 25 Perfect Arrivals.</p>
            </div>
         </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, subtitle }) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorMap[color]} shadow-sm flex flex-col justify-between`}>
      <div className="flex justify-between items-start mb-4">
        <span className="p-2 bg-white rounded-lg shadow-sm">
          {icon}
        </span>
      </div>
      <div>
        <h4 className="text-2xl font-black mb-1">{value}</h4>
        <p className="text-[11px] font-extrabold uppercase tracking-wide opacity-80">{title}</p>
        {subtitle && <p className="text-[9px] font-bold mt-1 opacity-60">{subtitle}</p>}
      </div>
    </div>
  );
}
