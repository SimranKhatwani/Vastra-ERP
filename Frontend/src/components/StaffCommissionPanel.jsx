import React, { useState, useEffect } from "react";
import axios from "axios";
import { Search, Filter, DollarSign, Users, CheckCircle, Percent } from "lucide-react";

export const StaffCommissionPanel = ({ role, onAddNotification }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCommissions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/commissions/staff/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setHistory(res.data.data.filter(h => h.employeeRole === role));
      }
    } catch (err) {
      console.error("Failed to fetch commissions:", err);
      onAddNotification("Error fetching commissions", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
    // Setup Socket.IO listener if needed, or rely on parent
    const handleUpdate = () => fetchCommissions();
    window.addEventListener('commission.updated', handleUpdate);
    return () => window.removeEventListener('commission.updated', handleUpdate);
  }, [role]);

  // Group by employee
  const groupedData = React.useMemo(() => {
    const map = {};
    history.forEach(h => {
      if (!map[h.employeeId]) {
        map[h.employeeId] = {
          id: h.employeeId,
          name: h.employeeName,
          role: h.employeeRole,
          productsSold: 0,
          totalSales: 0,
          totalCommission: 0,
          pending: 0,
          paid: 0,
          percentage: h.commissionPercentage
        };
      }
      map[h.employeeId].productsSold += h.quantity;
      map[h.employeeId].totalSales += h.netAmountBasis;
      map[h.employeeId].totalCommission += h.commissionAmount;
      if (h.status === 'Pending') map[h.employeeId].pending += h.commissionAmount;
      if (h.status === 'Paid') map[h.employeeId].paid += h.commissionAmount;
    });
    return Object.values(map);
  }, [history]);

  const filteredData = groupedData.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <div className="p-10 text-center text-slate-500 font-bold">Loading {role} Commissions...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={`Search ${role}s...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs font-medium border border-slate-100 focus:border-indigo-500 rounded-xl outline-none transition-all text-slate-700"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] text-slate-400 font-extrabold uppercase border-b border-slate-100">
                <th className="p-3.5">Employee Name</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5 text-right">Products Sold</th>
                <th className="p-3.5 text-right">Total Sales</th>
                <th className="p-3.5 text-center">Commission %</th>
                <th className="p-3.5 text-right">Total Commission</th>
                <th className="p-3.5 text-right text-orange-600">Pending</th>
                <th className="p-3.5 text-right text-emerald-600">Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400 font-bold">No data found.</td>
                </tr>
              ) : (
                filteredData.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/40">
                    <td className="p-3.5 font-bold text-slate-800">{emp.name}</td>
                    <td className="p-3.5 font-medium text-slate-500">{emp.role}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-700">{emp.productsSold}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-700">₹{emp.totalSales.toLocaleString()}</td>
                    <td className="p-3.5 text-center font-bold text-indigo-600">{emp.percentage}%</td>
                    <td className="p-3.5 text-right font-mono font-bold text-indigo-600">₹{emp.totalCommission.toFixed(2)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-orange-600">₹{emp.pending.toFixed(2)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-600">₹{emp.paid.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
