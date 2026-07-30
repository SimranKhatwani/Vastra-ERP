import api from '../api/axios';
import React, { useState } from "react";
import {
  CheckCircle,
  Award,
  X,
  Plus,
  Search,
  Trash2,
  Edit,
  Clock,
} from "lucide-react";

export const EmployeeView = ({
  employees,
  setEmployees,
  onDisburseCommission,
  onAddNotification,
  currentUser = {},
}) => {
  const [activeTab, setActiveTab] = useState("payroll");
  const [tempEdits, setTempEdits] = useState({});
  // Track paid status per employee {empId: true/false}
  const [paidStatus, setPaidStatus] = useState({});
  const [selectedEmpId, setSelectedEmpId] = useState("e-3");
  const [bonusAmount, setBonusAmount] = useState(1000);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState("Salesperson");
  const [formSalary, setFormSalary] = useState(25000);
  const [formCommRate, setFormCommRate] = useState(5);
  const [formTarget, setFormTarget] = useState(100000);

  // Attendance states
  const [attendanceLogs, setAttendanceLogs] = useState([
    {
      id: "att-1",
      date: "2026-06-28",
      empName: "Ramesh Kumar",
      status: "Present",
      checkInTime: "09:15 AM",
    },
    {
      id: "att-2",
      date: "2026-06-28",
      empName: "Aman Deep",
      status: "Present",
      checkInTime: "09:02 AM",
    },
    {
      id: "att-3",
      date: "2026-06-28",
      empName: "Sushma Swaraj",
      status: "On Leave",
      checkInTime: "-",
    },
    {
      id: "att-4",
      date: "2026-06-27",
      empName: "Ramesh Kumar",
      status: "Present",
      checkInTime: "09:30 AM",
    },
  ]);
  const [attDate, setAttDate] = useState("2026-06-28");
  const [attEmpName, setAttEmpName] = useState("");
  const [attStatus, setAttStatus] = useState("Present");
  const [attTime, setAttTime] = useState("09:00 AM");

  // Salary Advances & Deductions states
  const [advances, setAdvances] = useState([
    {
      id: "adv-1",
      empName: "Aman Deep",
      type: "Advance",
      amount: 3500,
      reason: "Festival advance request",
      date: "2026-06-24",
      status: "Approved",
    },
    {
      id: "adv-2",
      empName: "Ramesh Kumar",
      type: "Deduction",
      amount: 800,
      reason: "Damaged premium fabric spool",
      date: "2026-06-26",
      status: "Processed",
    },
  ]);
  const [advEmpId, setAdvEmpId] = useState("e-3");
  const [advType, setAdvType] = useState("Advance");
  const [advAmt, setAdvAmt] = useState(1000);
  const [advReason, setAdvReason] = useState("Personal loan advance");

  // MODULE 2.4 STAFF ATTENDANCE & MANAGEMENT STATES
  const [punchLogs, setPunchLogs] = useState([
    {
      id: "p-1",
      empId: "e-3",
      empName: "Rajesh Malhotra",
      date: "2026-06-28",
      punchIn: "09:02 AM",
      punchOut: "06:15 PM",
      hours: 9.2,
    },
    {
      id: "p-2",
      empId: "e-4",
      empName: "Simran Walia",
      date: "2026-06-28",
      punchIn: "09:15 AM",
      punchOut: "06:00 PM",
      hours: 8.75,
    },
    {
      id: "p-3",
      empId: "e-5",
      empName: "Arjun Mehra",
      date: "2026-06-28",
      punchIn: "08:58 AM",
      punchOut: "05:30 PM",
      hours: 8.53,
    },
  ]);

  const [punchedInEmps, setPunchedInEmps] = useState({
    "e-3": "09:05 AM",
  });

  const [leaveRequests, setLeaveRequests] = useState([
    {
      id: "lr-1",
      empId: "e-4",
      empName: "Simran Walia",
      leaveType: "Casual Leave",
      startDate: "2026-07-02",
      endDate: "2026-07-04",
      days: 3,
      reason: "Family function at hometown",
      status: "Pending",
    },
    {
      id: "lr-2",
      empId: "e-5",
      empName: "Arjun Mehra",
      leaveType: "Sick Leave",
      startDate: "2026-06-20",
      endDate: "2026-06-21",
      days: 2,
      reason: "Viral fever, doctor advised rest",
      status: "Approved",
    },
  ]);

  const [employeeDocs, setEmployeeDocs] = useState({
    "e-3": [
      {
        id: "d-1",
        name: "Aadhaar_Card_Verified.pdf",
        size: "1.4 MB",
        type: "Identification",
        date: "2026-04-12",
      },
      {
        id: "d-2",
        name: "PAN_Card_Copy.pdf",
        size: "890 KB",
        type: "Tax Document",
        date: "2026-04-12",
      },
    ],
    "e-4": [
      {
        id: "d-3",
        name: "Simran_Walia_Resume.pdf",
        size: "2.1 MB",
        type: "Resume",
        date: "2026-05-18",
      },
    ],
  });

  const [departments, setDepartments] = useState([
    {
      id: "dep-1",
      name: "Retail Sales Floor",
      code: "RSF",
      lead: "Rajesh Malhotra",
      count: 4,
    },
    {
      id: "dep-2",
      name: "Tailoring Design Section",
      code: "TDS",
      lead: "Simran Walia",
      count: 3,
    },
    {
      id: "dep-3",
      name: "Corporate Wholesales",
      code: "CWA",
      lead: "Neha Malhotra",
      count: 2,
    },
    {
      id: "dep-4",
      name: "Logistics & Warehouse",
      code: "LWH",
      lead: "Aman Deep",
      count: 3,
    },
  ]);

  const [designations, setDesignations] = useState([
    { id: "des-1", name: "Sales Head", level: "Grade A", baseSalary: 35000 },
    {
      id: "des-2",
      name: "Senior Master Tailor",
      level: "Grade A",
      baseSalary: 28000,
    },
    {
      id: "des-3",
      name: "Retail Associate",
      level: "Grade B",
      baseSalary: 22000,
    },
    {
      id: "des-4",
      name: "Warehouse Executive",
      level: "Grade C",
      baseSalary: 18000,
    },
  ]);

  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("Identification");
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);

  const [newLeaveType, setNewLeaveType] = useState("Casual Leave");
  const [newLeaveStart, setNewLeaveStart] = useState("");
  const [newLeaveEnd, setNewLeaveEnd] = useState("");
  const [newLeaveReason, setNewLeaveReason] = useState("");

  const [generatedAuth, setGeneratedAuth] = useState(null);

  const [activeAttendanceSubTab, setActiveAttendanceSubTab] = useState("punch");

  const activeEmployee =
    employees.find((e) => e.id === selectedEmpId) || employees[0];

  const handleDisburseBonusSubmit = (e) => {
    e.preventDefault();
    if (!selectedEmpId || bonusAmount <= 0) return;

    onDisburseCommission(selectedEmpId, bonusAmount);
    onAddNotification(
      "HR Payroll Ledger",
      `Disbursed performance bonus of ₹${bonusAmount.toLocaleString()} to ${activeEmployee.name}.`,
      "success",
    );
    setBonusAmount(1000);
  };

  const handleClockIn = (empName) => {
    const newLog = {
      id: `att-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      empName,
      status: "Present",
      checkInTime: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setAttendanceLogs((prev) => [newLog, ...prev]);
    onAddNotification(
      "Attendance Portal",
      `Clocked IN: ${empName} verified biometric logging for today.`,
      "success",
    );
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!formName || !formEmail) return;

    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/employees`, {
          name: formName,
          email: formEmail,
          phone: formPhone || "9876543210",
          role: formRole,
          salary: formSalary,
          shift: "Full-Day"
        });

      const data = res.data;
      
      if (data.success) {
        if (setEmployees) {
          setEmployees((prev) => [...prev, data.data]);
        }
        
        onAddNotification(
          "Roster Management",
          `Successfully registered profile for ${formName} (${formRole}).`,
          "success",
        );
        setShowAddModal(false);
        resetForm();

        if (data.generatedPassword) {
          // Temporarily attach it so we can show the popup
          setGeneratedAuth({ email: data.data.email, password: data.generatedPassword, name: data.data.name });
        }
      } else {
        onAddNotification("Error", data.message || "Failed to create employee", "error");
      }
    } catch (err) {
      onAddNotification("Error", err.message, "error");
    }
  };

  const handleUpdateEmployeeSubmit = async (e) => {
    e.preventDefault();
    if (!editingEmp) return;

    try {
      const token = localStorage.getItem("token");
      const res = await api.put(`/staff/${editingEmp.id}/payroll`, {
          salary: formSalary,
          commissionRate: formCommRate,
          monthlyTarget: formTarget,
        });

      const data = res.data;
      
      if (data.success) {
        const updated = {
          ...editingEmp,
          salary: data.data.salary,
          commissionRate: data.data.commissionRate,
          salesTarget: data.data.monthlyTarget,
        };

        if (setEmployees) {
          setEmployees((prev) =>
            prev.map((emp) => (emp.id === editingEmp.id ? updated : emp)),
          );
        }
        onAddNotification(
          "Payroll Management",
          `Updated payroll configuration for ${editingEmp.name}.`,
          "success",
        );
        setShowEditModal(false);
        setEditingEmp(null);
        resetForm();
      } else {
        onAddNotification("Error", data.message || "Failed to update payroll", "error");
      }
    } catch (err) {
      onAddNotification("Error", "Failed to connect to API", "error");
    }
  };

  const handleSaveInlineEdits = async (empId) => {
    const edits = tempEdits[empId];
    if (!edits) return;

    try {
      const token = localStorage.getItem("token");
      const bodyPayload = {};
      if (edits.salary !== undefined) bodyPayload.salary = edits.salary;
      if (edits.disbursedDate !== undefined) bodyPayload.disbursedDate = edits.disbursedDate;

      const res = await api.put(`/employees/${empId}`, bodyPayload);

      const data = res.data;
      if (data.success) {
        if (setEmployees) {
          setEmployees((prev) =>
            prev.map((emp) => (emp.id === empId ? { ...emp, salary: data.data.salary, disbursedDate: data.data.disbursedDate } : emp))
          );
        }
        setTempEdits((prev) => {
          const copy = { ...prev };
          delete copy[empId];
          return copy;
        });
        onAddNotification("Payroll Updated", "Employee salary and disbursement date saved successfully.", "success");
      } else {
        onAddNotification("Error", data.message || "Failed to update employee", "error");
      }
    } catch (err) {
      onAddNotification("Error", "Network error occurred", "error");
    }
  };

  const handleTogglePaid = async (empId, empName) => {
    const newPaid = !paidStatus[empId];
    setPaidStatus((prev) => ({ ...prev, [empId]: newPaid }));
    try {
      const token = localStorage.getItem("token");
      await api.put(`/employees/${empId}`, { salaryCycle: newPaid ? "Paid" : "Pending" });

      if (newPaid) {
        const targetEmp = employees.find((e) => (e._id || e.id) === empId);
        await api.post(`/financial/payments`, {
            beneficiaryType: "Employee",
            beneficiaryId: empId,
            beneficiaryName: empName,
            category: "Salary",
            amount: Number(targetEmp?.salary || 25000)
          });
      }
    } catch { /* best-effort, state already toggled */ }
    if (newPaid) {
      onAddNotification("Payroll", `Salary marked as Paid for ${empName} and synced to Payment Tracking.`, "success");
    } else {
      onAddNotification("Payroll", `Salary for ${empName} marked as Pending.`, "warning");
    }
  };

  const handleDeleteEmployee = (id, name) => {
    if (
      confirm(
        `Are you sure you want to release ${name} from the roster? This cannot be undone.`,
      )
    ) {
      if (setEmployees) {
        setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      }
      onAddNotification(
        "Roster Management",
        `Decommissioned staff profile for ${name}.`,
        "warning",
      );
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormRole("Salesperson");
    setFormSalary(25000);
    setFormCommRate(5);
    setFormTarget(100000);
  };

  const openEditModal = (emp) => {
    setEditingEmp(emp);
    setFormName(emp.name);
    setFormEmail(emp.email);
    setFormPhone(emp.phone);
    setFormRole(emp.role);
    setFormSalary(emp.salary);
    setFormCommRate(emp.commissionRate);
    setFormTarget(emp.salesTarget || 0);
    setShowEditModal(true);
  };

  const handleDailyPunch = (empId, action) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateStr = now.toISOString().slice(0, 10);

    if (action === "in") {
      setPunchedInEmps((prev) => ({ ...prev, [empId]: timeStr }));
      onAddNotification(
        "Workforce Clock",
        `PUNCH IN recorded for ${emp.name} at ${timeStr}.`,
        "success",
      );
    } else {
      const punchInTime = punchedInEmps[empId] || "09:00 AM";
      const mockHours = parseFloat((7.5 + Math.random() * 2).toFixed(2));
      const newPunch = {
        id: `p-${Date.now()}`,
        empId,
        empName: emp.name,
        date: dateStr,
        punchIn: punchInTime,
        punchOut: timeStr,
        hours: mockHours,
      };
      setPunchLogs((prev) => [newPunch, ...prev]);
      setPunchedInEmps((prev) => {
        const copy = { ...prev };
        delete copy[empId];
        return copy;
      });
      onAddNotification(
        "Workforce Clock",
        `PUNCH OUT recorded for ${emp.name} at ${timeStr}. Work hours tracked: ${mockHours} hrs.`,
        "success",
      );
    }
  };

  const handleSubmitLeaveRequest = (e) => {
    e.preventDefault();
    if (!selectedEmpId || !newLeaveStart || !newLeaveEnd) {
      onAddNotification(
        "Leave Request Failed",
        "Please select staff and dates.",
        "warning",
      );
      return;
    }
    const emp = employees.find((e) => e.id === selectedEmpId);
    if (!emp) return;

    const diffTime = Math.abs(
      new Date(newLeaveEnd).getTime() - new Date(newLeaveStart).getTime(),
    );
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newRequest = {
      id: `lr-${Date.now()}`,
      empId: selectedEmpId,
      empName: emp.name,
      leaveType: newLeaveType,
      startDate: newLeaveStart,
      endDate: newLeaveEnd,
      days: diffDays,
      reason: newLeaveReason || "Personal reasons",
      status: "Pending",
    };

    setLeaveRequests((prev) => [newRequest, ...prev]);
    onAddNotification(
      "Leave Management",
      `Leave petition submitted for ${emp.name} (${diffDays} days). Status: Pending approval.`,
      "info",
    );
    setNewLeaveStart("");
    setNewLeaveEnd("");
    setNewLeaveReason("");
  };

  const handleApproveLeave = (id) => {
    setLeaveRequests((prev) =>
      prev.map((req) => {
        if (req.id === id) {
          if (setEmployees) {
            setEmployees((empPrev) =>
              empPrev.map((emp) => {
                if (emp.id === req.empId) {
                  return {
                    ...emp,
                    leavesRemaining: Math.max(
                      0,
                      emp.leavesRemaining - req.days,
                    ),
                  };
                }
                return emp;
              }),
            );
          }
          return { ...req, status: "Approved" };
        }
        return req;
      }),
    );
    onAddNotification(
      "Leave Approved",
      "The employee leave quota has been updated.",
      "success",
    );
  };

  const handleRejectLeave = (id) => {
    setLeaveRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "Rejected" } : req)),
    );
    onAddNotification(
      "Leave Rejected",
      "Leave petition marked as declined.",
      "warning",
    );
  };

  const handleAddDepartmentLocal = (name, code, lead) => {
    if (!name || !code) return;
    const newDep = {
      id: `dep-${Date.now()}`,
      name,
      code: code.toUpperCase(),
      lead: lead || "Unassigned",
      count: 0,
    };
    setDepartments((prev) => [...prev, newDep]);
    onAddNotification(
      "Department Management",
      `Created new department: ${name} [${code.toUpperCase()}].`,
      "success",
    );
  };

  const handleAddDesignationLocal = (name, level, salary) => {
    if (!name) return;
    const newDes = {
      id: `des-${Date.now()}`,
      name,
      level: level || "Grade B",
      baseSalary: salary || 20000,
    };
    setDesignations((prev) => [...prev, newDes]);
    onAddNotification(
      "Designation Configured",
      `Added designation: ${name} (${level}).`,
      "success",
    );
  };

  const handleUploadDocumentSubmit = (e) => {
    e.preventDefault();
    if (!selectedEmpId || !docName) {
      onAddNotification(
        "Upload Failed",
        "Please select staff and enter file name.",
        "warning",
      );
      return;
    }
    const newDoc = {
      id: `d-${Date.now()}`,
      name: docName.endsWith(".pdf") ? docName : `${docName}.pdf`,
      size: `${(1.2 + Math.random() * 2).toFixed(1)} MB`,
      type: docType,
      date: new Date().toISOString().slice(0, 10),
    };

    setEmployeeDocs((prev) => {
      const currentDocs = prev[selectedEmpId] || [];
      return {
        ...prev,
        [selectedEmpId]: [newDoc, ...currentDocs],
      };
    });

    onAddNotification(
      "Documents Vault",
      `Uploaded credentials document: ${newDoc.name}.`,
      "success",
    );
    setShowDocUploadModal(false);
    setDocName("");
  };

  const handleAddAdvance = (e) => {
    e.preventDefault();
    const targetE = employees.find((emp) => emp.id === advEmpId);
    if (!targetE) return;

    const newAdv = {
      id: `adv-${Date.now()}`,
      empName: targetE.name,
      type: advType,
      amount: advAmt,
      reason: advReason,
      date: new Date().toISOString().slice(0, 10),
      status: "Approved",
    };

    setAdvances((prev) => [newAdv, ...prev]);
    onAddNotification(
      "Advances Logged",
      `Registered ${advType} of ₹${advAmt.toLocaleString()} for ${targetE.name}.`,
      "success",
    );
  };

  // Filtered employees list
  const filteredEmployees = employees.filter((emp) => {
    const roleString = (emp.designation || emp.role || "Staff").toLowerCase();
    const nameString = (emp.name || "").toLowerCase();
    const matchesSearch =
      nameString.includes(searchQuery.toLowerCase()) ||
      roleString.includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "All" || emp.designation === roleFilter || emp.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12" id="employee-hr-root">
      <div className="flex border-b border-slate-100 pb-3">
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl">
          {currentUser?.role?.toLowerCase() !== 'salesperson' && (
            <>
              <button
                onClick={() => setActiveTab("payroll")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === "payroll" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Salary Ledgers
              </button>
            </>
          )}

        </div>
      </div>

      {/* ROSTER DIRECTORY */}
      {false && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: MASTER DIRECTORY LIST */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search staff..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-50 pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold w-full sm:w-60"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-slate-50 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 focus:outline-none cursor-pointer border border-slate-100"
                >
                  <option value="All">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Salesperson">Salesperson</option>
                  <option value="Tailor">Tailor</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-3.5">Employee Name</th>
                      <th className="p-3.5">Role / Job</th>
                      <th className="p-3.5 text-right">Base Salary</th>
                      <th className="p-3.5 text-center">Attendance</th>
                      <th className="p-3.5 text-center">Leaves Owed</th>
                      <th className="p-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                    {filteredEmployees.map((emp, idx) => {
                      const isSelected = selectedEmpId === emp.id;
                      return (
                        <tr
                          key={idx}
                          onClick={() => setSelectedEmpId(emp.id)}
                          className={`cursor-pointer transition-all ${isSelected ? "bg-indigo-50/45 hover:bg-indigo-50/60" : "hover:bg-slate-50/50"}`}
                        >
                          <td className="p-3.5">
                            <p className="font-bold text-slate-800 leading-tight">
                              {emp.name}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              {emp.email} | {emp.phone}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="bg-slate-100 border border-slate-200/50 text-slate-700 px-2.5 py-0.5 rounded font-mono text-[10px] font-bold uppercase">
                              {emp.designation || emp.role || 'Staff'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                            ₹{(emp.salary || 0).toLocaleString()}
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1 font-bold text-slate-700 font-mono">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{emp.attendanceRate || 100}%</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-center font-mono text-slate-500 font-bold">
                            {emp.leavesRemaining || 10} days
                          </td>
                          <td
                            className="p-3.5 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex justify-center gap-1.5">
                              <button
                                onClick={() => openEditModal(emp)}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded text-slate-600 cursor-pointer transition-colors"
                                title="Edit employee metadata"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteEmployee(emp.id, emp.name)
                                }
                                className="p-1.5 bg-red-50 hover:bg-red-100 rounded text-red-600 cursor-pointer transition-colors"
                                title="Terminate record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: EMPLOYEE MASTER & DOCUMENTS */}
          <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full uppercase">
                Employee Master
              </span>
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide mt-1.5">
                {activeEmployee ? activeEmployee.name : "Choose Staff"}
              </h3>
              <p className="text-[10px] text-slate-400">
                Manage file attachments, identity logs, Aadhaar Card, and PAN
                documents.
              </p>
            </div>

            {activeEmployee ? (
              <div className="space-y-5 text-xs">
                {/* Employee Profile Metrics */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">
                      Designation / Role:
                    </span>
                    <span className="font-bold text-slate-700">
                      {activeEmployee.role}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">
                      Contact Number:
                    </span>
                    <span className="font-mono text-slate-700 font-bold">
                      {activeEmployee.phone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">
                      Primary Email:
                    </span>
                    <span className="font-semibold text-slate-600">
                      {activeEmployee.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">
                      Monthly Salary:
                    </span>
                    <span className="font-mono font-bold text-slate-850">
                      ₹{(activeEmployee.salary || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Commission Summary */}
                {activeEmployee.commissionSummary && (
                  <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl space-y-2">
                    <h4 className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider mb-2">
                      Commission Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded-lg border border-indigo-50">
                        <span className="text-[9px] text-slate-400 block font-bold uppercase">Products Sold</span>
                        <span className="font-mono font-extrabold text-indigo-700">{activeEmployee.commissionSummary.totalProductsSold || 0}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-indigo-50">
                        <span className="text-[9px] text-slate-400 block font-bold uppercase">Today</span>
                        <span className="font-mono font-extrabold text-indigo-700">₹{activeEmployee.commissionSummary.today || 0}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-indigo-50">
                        <span className="text-[9px] text-slate-400 block font-bold uppercase">Monthly</span>
                        <span className="font-mono font-extrabold text-indigo-700">₹{activeEmployee.commissionSummary.monthly || 0}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-indigo-50">
                        <span className="text-[9px] text-slate-400 block font-bold uppercase">Lifetime</span>
                        <span className="font-mono font-extrabold text-indigo-700">₹{activeEmployee.commissionSummary.lifetime || 0}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-indigo-50">
                        <span className="text-[9px] text-orange-400 block font-bold uppercase">Pending</span>
                        <span className="font-mono font-extrabold text-orange-600">₹{activeEmployee.commissionSummary.pending || 0}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-indigo-50">
                        <span className="text-[9px] text-emerald-400 block font-bold uppercase">Paid</span>
                        <span className="font-mono font-extrabold text-emerald-600">₹{activeEmployee.commissionSummary.paid || 0}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents Vault */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Verified Documents
                    </h4>
                    <button
                      onClick={() => setShowDocUploadModal(true)}
                      className="text-[10px] text-indigo-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add File
                    </button>
                  </div>

                  {!(
                    employeeDocs[activeEmployee.id] &&
                    employeeDocs[activeEmployee.id].length > 0
                  ) ? (
                    <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400">
                      <p className="font-bold text-[11px]">
                        No verified files uploaded.
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1">
                        Personnel credentials pending Aadhaar / PAN
                        registration.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {employeeDocs[activeEmployee.id].map((doc) => (
                        <div
                          key={doc.id}
                          className="border border-slate-100 bg-slate-50/45 rounded-xl p-3 flex justify-between items-center hover:bg-slate-50 transition-colors"
                        >
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-750 text-[11px] truncate max-w-[170px]">
                              {doc.name}
                            </p>
                            <p className="text-[9px] text-slate-400 font-mono font-medium">
                              {doc.type} • {doc.size}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full border border-emerald-100">
                              Verified
                            </span>
                            <button
                              onClick={() => {
                                setEmployeeDocs((prev) => ({
                                  ...prev,
                                  [activeEmployee.id]: prev[
                                    activeEmployee.id
                                  ].filter((d) => d.id !== doc.id),
                                }));
                                onAddNotification(
                                  "Document Removed",
                                  `Successfully deleted ${doc.name} from personnel vault.`,
                                  "info",
                                );
                              }}
                              className="text-slate-400 hover:text-red-500 cursor-pointer p-1"
                              title="Delete file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                <p className="font-semibold">
                  Select an employee row to view master profile and documents.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAYROLL SALARIES */}
      {activeTab === "payroll" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Monthly Payroll & Salary Disbursements
            </h4>
          </div>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Job Level</th>
                  <th className="p-3.5 text-right font-mono">Base Salary (₹)</th>
                  <th className="p-3.5 text-right font-mono">
                    Commission Paid
                  </th>
                  <th className="p-3.5 text-right font-mono">
                    Total Compensation
                  </th>
                  <th className="p-3.5 text-center">Disbursed Date</th>
                  <th className="p-3.5 text-center">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {employees.map((emp, idx) => {
                  const currentSalary = tempEdits[emp.id]?.salary ?? emp.salary ?? 0;
                  const finalComp = currentSalary + (emp.commissionEarned || 0);
                  const currentDate = tempEdits[emp.id]?.disbursedDate ?? emp.disbursedDate ?? "2026-06-25";

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-bold text-slate-800">
                        {emp.name}
                      </td>
                      <td className="p-3.5">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                          {emp.designation || emp.role || 'Staff'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono">
                        <input
                          type="number"
                          value={currentSalary}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setTempEdits((prev) => ({
                              ...prev,
                              [emp.id]: {
                                ...prev[emp.id],
                                salary: val,
                              },
                            }));
                          }}
                          className="w-24 text-right bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-3.5 text-right font-mono text-emerald-600 font-bold">
                        ₹{(emp.commissionEarned || 0).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                        ₹{finalComp.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-center font-mono">
                        <input
                          type="date"
                          value={currentDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTempEdits((prev) => ({
                              ...prev,
                              [emp.id]: {
                                ...prev[emp.id],
                                disbursedDate: val,
                              },
                            }));
                          }}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs text-slate-700"
                        />
                      </td>
                      {/* ── Paid Checkbox ── */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleTogglePaid(emp.id, emp.name)}
                          title={paidStatus[emp.id] ? "Mark as Pending" : "Mark as Paid"}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                            paidStatus[emp.id]
                              ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                              : "bg-slate-50 border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-600"
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                              paidStatus[emp.id]
                                ? "bg-emerald-500 border-emerald-500"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {paidStatus[emp.id] && (
                              <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 fill-none stroke-white stroke-[2] stroke-linecap-round stroke-linejoin-round">
                                <polyline points="1 4 3.5 6.5 9 1" />
                              </svg>
                            )}
                          </span>
                          {paidStatus[emp.id] ? "Paid" : "Unpaid"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMMISSIONS ENGINE */}
      {false && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Disburse commissions box */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 lg:col-span-4 space-y-4 text-xs">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Issue Commission & Reward
            </h4>
            <form onSubmit={handleDisburseBonusSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Select Employee
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-700"
                >
                  {employees
                    .filter(
                      (e) => (e.designation || e.role) === "Salesperson" || (e.designation || e.role) === "Tailor",
                    )
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.designation || e.role || "Staff"})
                      </option>
                    ))}
                </select>
              </div>

              {activeEmployee && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monthly Sales:</span>
                    <span className="text-indigo-600 font-bold">
                      ₹{(activeEmployee.monthlySales || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Level:</span>
                    <span>₹{(activeEmployee.salesTarget || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Earned Rate:</span>
                    <span className="text-emerald-600 font-bold">
                      {activeEmployee.commissionRate || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pending Comm:</span>
                    <span className="text-violet-600 font-bold">
                      ₹{(activeEmployee.commissionEarned || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Bonus Payout (₹)
                </label>
                <input
                  type="number"
                  value={bonusAmount || ""}
                  onChange={(e) =>
                    setBonusAmount(Math.max(0, Number(e.target.value)))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-md"
              >
                Disburse Earnings
              </button>
            </form>
          </div>

          {/* Leaderboard panel on the right */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden lg:col-span-8">
            <div className="p-4 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Salesperson Target achievements
              </h4>
            </div>
            <div className="p-5 space-y-4">
              {employees
                .filter((e) => (e.designation || e.role) === "Salesperson")
                .map((emp, i) => {
                  const ratio = Math.min(
                    100,
                    ((emp.monthlySales || 0) / (emp.salesTarget || 1)) * 100,
                  );
                  return (
                    <div key={i} className="space-y-1 text-xs font-medium">
                      <div className="flex justify-between">
                        <span className="text-slate-700 font-bold">
                          {emp.name}
                        </span>
                        <span className="text-slate-800 font-mono">
                          ₹{(emp.monthlySales || 0).toLocaleString()} / ₹
                          {(emp.salesTarget || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600`}
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>Achievement Quotient: {ratio.toFixed(0)}%</span>
                        <span className="font-bold text-violet-600">
                          Pending Settlement: ₹
                          {(emp.commissionEarned || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* BIOMETRIC ATTENDANCE TAB - REFACTORED TO MODULE 2.4 STAFF ATTENDANCE & MANAGEMENT */}
      {false && (
        <div className="space-y-6">
          {/* Sub-navigation bar specifically for Staff Attendance & Management */}
          <div className="flex border-b border-slate-100 pb-2">
            <div className="flex flex-wrap gap-1 bg-slate-50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveAttendanceSubTab("punch")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${activeAttendanceSubTab === "punch" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Daily Punch In / Out
              </button>
              <button
                type="button"
                onClick={() => setActiveAttendanceSubTab("logs")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${activeAttendanceSubTab === "logs" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Punches & Hours Logs
              </button>
              <button
                type="button"
                onClick={() => setActiveAttendanceSubTab("leaves")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${activeAttendanceSubTab === "leaves" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Leave Management
              </button>
              <button
                type="button"
                onClick={() => setActiveAttendanceSubTab("departments")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${activeAttendanceSubTab === "departments" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Department Master
              </button>
              <button
                type="button"
                onClick={() => setActiveAttendanceSubTab("designations")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${activeAttendanceSubTab === "designations" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Designation Master
              </button>
              <button
                type="button"
                onClick={() => setActiveAttendanceSubTab("reports")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${activeAttendanceSubTab === "reports" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Attendance Reports
              </button>
            </div>
          </div>

          {/* SUB-TAB 1: DAILY PUNCH IN / OUT */}
          {activeAttendanceSubTab === "punch" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Daily Self Service Punch
                  </h4>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">
                      Select Employee Profile *
                    </label>
                    <select
                      value={selectedEmpId}
                      onChange={(e) => setSelectedEmpId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-bold text-slate-750 outline-none cursor-pointer"
                    >
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name} ({e.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {activeEmployee && (
                    <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl space-y-3 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                        Active Status
                      </div>

                      {punchedInEmps[activeEmployee.id] ? (
                        <div className="space-y-2">
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse">
                            ● PUNCHED IN AT {punchedInEmps[activeEmployee.id]}
                          </span>
                          <p className="text-[10px] text-slate-400">
                            Punch out when you end your shift to calculate
                            working hours.
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              handleDailyPunch(activeEmployee.id, "out")
                            }
                            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer uppercase tracking-wider mt-2"
                          >
                            Punch Out (Shift End)
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            PUNCHED OUT
                          </span>
                          <p className="text-[10px] text-slate-400">
                            Punch in now to start tracking your working hours
                            for today.
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              handleDailyPunch(activeEmployee.id, "in")
                            }
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer uppercase tracking-wider mt-2"
                          >
                            Punch In (Shift Start)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-8 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Punched In Personnel ({Object.keys(punchedInEmps).length})
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-emerald-500">
                    Live Clocking Stream Active
                  </span>
                </div>

                {Object.keys(punchedInEmps).length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    <p className="font-semibold">
                      No employees currently punched in.
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Use the left self-service tool to punch in staff.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(punchedInEmps).map(
                      ([empId, punchInTime]) => {
                        const empObj = employees.find((e) => e.id === empId);
                        if (!empObj) return null;
                        return (
                          <div
                            key={empId}
                            className="border border-slate-100 bg-slate-50/50 p-3.5 rounded-xl flex justify-between items-center hover:shadow-xs transition-shadow"
                          >
                            <div className="space-y-0.5">
                              <p className="font-extrabold text-slate-800 text-xs">
                                {empObj.name}
                              </p>
                              <p className="text-[10px] font-mono text-slate-400">
                                {empObj.role}
                              </p>
                              <p className="text-[9px] font-semibold text-emerald-600 font-mono">
                                Punched In: {punchInTime}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDailyPunch(empId, "out")}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold cursor-pointer transition-colors border border-red-100"
                            >
                              Punch Out
                            </button>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-TAB 2: PUNCHES & WORKING HOURS LOGS */}
          {activeAttendanceSubTab === "logs" && (
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Calculated Shift Logs & Hours
                </h4>
                <span className="text-[10px] text-slate-400 font-bold font-mono">
                  Total Punches: {punchLogs.length}
                </span>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] text-slate-400 font-extrabold uppercase border-b border-slate-100 tracking-wider">
                      <th className="p-3">Log ID</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Staff Name</th>
                      <th className="p-3 text-center">Clock In</th>
                      <th className="p-3 text-center">Clock Out</th>
                      <th className="p-3 text-right">Hours Tracked</th>
                      <th className="p-3 text-center">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                    {punchLogs.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/40">
                        <td className="p-3 font-mono text-slate-400 text-[10px]">
                          {p.id}
                        </td>
                        <td className="p-3 font-mono">{p.date}</td>
                        <td className="p-3 font-bold text-slate-850">
                          {p.empName}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-600 font-bold">
                          {p.punchIn}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-600 font-bold">
                          {p.punchOut}
                        </td>
                        <td className="p-3 text-right font-mono font-extrabold text-indigo-600">
                          {p.hours} hrs
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                            Auto Calculated
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: LEAVE MANAGEMENT */}
          {activeAttendanceSubTab === "leaves" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Request Leave Form */}
              <div className="md:col-span-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    File Leave Request
                  </h4>
                </div>

                <form
                  onSubmit={handleSubmitLeaveRequest}
                  className="space-y-3.5 text-xs"
                >
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">
                      Select Employee *
                    </label>
                    <select
                      value={selectedEmpId}
                      onChange={(e) => setSelectedEmpId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-750 outline-none cursor-pointer"
                      required
                    >
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name} ({e.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">
                      Leave Type *
                    </label>
                    <select
                      value={newLeaveType}
                      onChange={(e) => setNewLeaveType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-750 outline-none cursor-pointer"
                    >
                      <option value="Casual Leave">Casual Leave</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Maternity / Paternity">
                        Maternity / Paternity
                      </option>
                      <option value="Unpaid Medical Leave">
                        Unpaid Medical Leave
                      </option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={newLeaveStart}
                        onChange={(e) => setNewLeaveStart(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 font-mono font-bold text-slate-750 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={newLeaveEnd}
                        onChange={(e) => setNewLeaveEnd(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 font-mono font-bold text-slate-750 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">
                      Reason / Notes
                    </label>
                    <textarea
                      placeholder="e.g. Out of station family event"
                      value={newLeaveReason}
                      onChange={(e) => setNewLeaveReason(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-750 outline-none h-16 resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer uppercase tracking-wider"
                  >
                    Submit Leave Request
                  </button>
                </form>
              </div>

              {/* Leave Requests Table */}
              <div className="md:col-span-8 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Leave Requests Ledger
                  </h4>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] text-slate-400 font-extrabold uppercase border-b border-slate-100 tracking-wider">
                        <th className="p-3">Staff Name</th>
                        <th className="p-3">Leave Type</th>
                        <th className="p-3 text-center">Dates</th>
                        <th className="p-3 text-center">Days</th>
                        <th className="p-3">Reason</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                      {leaveRequests.map((lr) => (
                        <tr key={lr.id} className="hover:bg-slate-50/30">
                          <td className="p-3 font-bold text-slate-800">
                            {lr.empName}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[9px]">
                              {lr.leaveType}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono text-[10px]">
                            {lr.startDate} to {lr.endDate}
                          </td>
                          <td className="p-3 text-center font-bold text-slate-700 font-mono">
                            {lr.days} d
                          </td>
                          <td
                            className="p-3 max-w-[140px] truncate text-[11px] text-slate-400"
                            title={lr.reason}
                          >
                            {lr.reason}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                                lr.status === "Approved"
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  : lr.status === "Rejected"
                                    ? "bg-red-50 text-red-600 border-red-100"
                                    : "bg-amber-50 text-amber-600 border-amber-100"
                              }`}
                            >
                              {lr.status}
                            </span>
                          </td>
                          <td className="p-3 text-center border-l border-slate-100/50">
                            {lr.status === "Pending" ? (
                              <div className="flex gap-1 justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleApproveLeave(lr.id)}
                                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-bold cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectLeave(lr.id)}
                                  className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[9px] font-bold cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                -
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 4: DEPARTMENT MANAGEMENT */}
          {activeAttendanceSubTab === "departments" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Register Department
                </h4>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    handleAddDepartmentLocal(
                      fd.get("depName"),
                      fd.get("depCode"),
                      fd.get("depLead"),
                    );
                    e.currentTarget.reset();
                  }}
                  className="space-y-3.5 text-xs"
                >
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">
                      Department Name *
                    </label>
                    <input
                      type="text"
                      name="depName"
                      placeholder="e.g. Accounts & Auditing"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-750 outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">
                      Department Code *
                    </label>
                    <input
                      type="text"
                      name="depCode"
                      placeholder="e.g. ACT"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-mono font-bold text-slate-750 outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">
                      Department Manager / Lead
                    </label>
                    <input
                      type="text"
                      name="depLead"
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-750 outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer uppercase tracking-wider"
                  >
                    Create Department
                  </button>
                </form>
              </div>

              <div className="md:col-span-2 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Corporate Department Directory
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {departments.map((dep) => {
                    const matchCount =
                      employees.filter((e) =>
                        e.role
                          .toLowerCase()
                          .includes(dep.name.split(" ")[0].toLowerCase()),
                      ).length || dep.count;
                    return (
                      <div
                        key={dep.id}
                        className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl space-y-2 relative overflow-hidden"
                      >
                        <div className="absolute top-2 right-2 font-mono font-bold text-slate-300 text-[10px] bg-slate-200/50 px-2 py-0.5 rounded">
                          {dep.code}
                        </div>
                        <h5 className="font-extrabold text-slate-850 text-xs leading-tight pr-12">
                          {dep.name}
                        </h5>
                        <p className="text-[10px] text-slate-400">
                          Department Lead:{" "}
                          <span className="font-bold text-slate-600">
                            {dep.lead}
                          </span>
                        </p>
                        <div className="pt-2 border-t border-slate-200/50 flex justify-between items-center">
                          <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            {matchCount} registered staff
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 5: DESIGNATION MANAGEMENT */}
          {activeAttendanceSubTab === "designations" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Register Designation
                </h4>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    handleAddDesignationLocal(
                      fd.get("desName"),
                      fd.get("desLevel"),
                      Number(fd.get("desSalary")),
                    );
                    e.currentTarget.reset();
                  }}
                  className="space-y-3.5 text-xs"
                >
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">
                      Designation Title *
                    </label>
                    <input
                      type="text"
                      name="desName"
                      placeholder="e.g. Master Tailor Expert"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-750 outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">
                      Job Grade Level
                    </label>
                    <select
                      name="desLevel"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="Grade A">Grade A (Executive)</option>
                      <option value="Grade B">Grade B (Associate)</option>
                      <option value="Grade C">Grade C (Operational)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">
                      Base Salary Package (₹/mo) *
                    </label>
                    <input
                      type="number"
                      name="desSalary"
                      placeholder="35000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-mono font-bold text-slate-750 outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer uppercase tracking-wider"
                  >
                    Configure Designation
                  </button>
                </form>
              </div>

              <div className="md:col-span-2 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Workforce Designations Ledger
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {designations.map((des) => (
                    <div
                      key={des.id}
                      className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl flex justify-between items-center hover:shadow-xs transition-shadow"
                    >
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono font-bold bg-slate-200 border border-slate-300 text-slate-600 px-2 py-0.5 rounded">
                          {des.level}
                        </span>
                        <h5 className="font-extrabold text-slate-850 text-xs leading-tight pt-1">
                          {des.name}
                        </h5>
                        <p className="text-[10px] text-slate-400">
                          Baseline Scale:{" "}
                          <span className="font-bold text-slate-600">
                            ₹{des.baseSalary.toLocaleString()}/mo
                          </span>
                        </p>
                      </div>
                      <Award className="w-8 h-8 text-indigo-100" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 6: ATTENDANCE REPORTS */}
          {activeAttendanceSubTab === "reports" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Overall Attendance Rate
                  </p>
                  <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                    94.62%
                  </p>
                  <span className="text-[9px] text-slate-400">
                    Target Benchmark: 92%
                  </span>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    On-Time Clock In
                  </p>
                  <p className="text-2xl font-bold font-mono text-indigo-600 mt-1">
                    88.15%
                  </p>
                  <span className="text-[9px] text-slate-400">
                    {"Late entries ( > 09:15 AM ): 4 logs"}
                  </span>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Active Approved Leaves
                  </p>
                  <p className="text-2xl font-bold font-mono text-amber-500 mt-1">
                    {
                      leaveRequests.filter((r) => r.status === "Approved")
                        .length
                    }{" "}
                    staff
                  </p>
                  <span className="text-[9px] text-slate-400">
                    This current week cycle
                  </span>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Aggregate Working Hours
                  </p>
                  <p className="text-2xl font-bold font-mono text-cyan-600 mt-1 font-mono">
                    {punchLogs.reduce((sum, p) => sum + p.hours, 0).toFixed(1)}{" "}
                    hrs
                  </p>
                  <span className="text-[9px] text-slate-400">
                    Recorded system-wide
                  </span>
                </div>
              </div>

              {/* Master Daily Matrix Summary */}
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
                <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Aggregated Attendance Status Matrix (Daily Roster)
                  </h4>
                </div>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] text-slate-400 font-extrabold uppercase border-b border-slate-100 tracking-wider">
                        <th className="p-3">Employee</th>
                        <th className="p-3 text-center">Jun 28</th>
                        <th className="p-3 text-center">Jun 27</th>
                        <th className="p-3 text-center">Jun 26</th>
                        <th className="p-3 text-center">Leaves remaining</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                      {employees.map((emp) => {
                        const isPunched = punchLogs.some(
                          (l) => l.empId === emp.id,
                        );
                        return (
                          <tr key={emp.id} className="hover:bg-slate-50/20">
                            <td className="p-3 font-bold text-slate-800">
                              {emp.name}
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${isPunched ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}
                              >
                                {isPunched ? "Present" : "Absent"}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-600">
                                Present
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-600">
                                Present
                              </span>
                            </td>
                            <td className="p-3 text-center font-bold text-slate-700 font-mono">
                              {emp.leavesRemaining} days
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADVANCES & DEDUCTIONS TAB */}
      {false && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 lg:col-span-4 space-y-4 text-xs">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Record Advance or Deduction
            </h4>
            <form onSubmit={handleAddAdvance} className="space-y-4">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Select Employee Beneficiary
                </label>
                <select
                  value={advEmpId}
                  onChange={(e) => setAdvEmpId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none font-bold text-slate-700"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Entry Type
                  </label>
                  <select
                    value={advType}
                    onChange={(e) => setAdvType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none font-bold text-slate-700"
                  >
                    <option value="Advance">Salary Advance</option>
                    <option value="Deduction">Penalty / Deduction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={advAmt}
                    onChange={(e) =>
                      setAdvAmt(Math.max(1, Number(e.target.value)))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Reason / Notes
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Festival loan or fabric damage penalty"
                  value={advReason}
                  onChange={(e) => setAdvReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-slate-800"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-bold hover:bg-slate-800 cursor-pointer shadow-xs"
              >
                Post Ledger Entry
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden lg:col-span-8">
            <div className="p-4 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                HR Advances & Penalty Deductions Ledger
              </h4>
            </div>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Staff Member</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Reason Notes</th>
                    <th className="p-3.5 text-right">Value (INR)</th>
                    <th className="p-3.5 text-center">Ledger Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {advances.map((adv, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-mono">{adv.date}</td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {adv.empName}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            adv.type === "Advance"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {adv.type}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500">{adv.reason}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                        ₹{adv.amount.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="text-[10px] text-emerald-600 font-bold uppercase font-mono">
                          {adv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= HR MODALS ======================= */}

      {/* Auth Generated Modal */}
      {generatedAuth && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-6">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg mb-1">Employee Registered</h3>
            <p className="text-xs text-slate-500 mb-6">Store these credentials safely. They will not be shown again.</p>
            
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left space-y-3 mb-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</label>
                <div className="text-sm font-semibold text-slate-700">{generatedAuth.email}</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Generated Password</label>
                <div className="text-base font-mono font-bold text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg mt-1 select-all">
                  {generatedAuth.password}
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                navigator.clipboard.writeText(generatedAuth.password);
                setGeneratedAuth(null);
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-colors"
            >
              Copy Password & Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL: EDIT EMPLOYEE */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs animate-scale-up">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Edit Payroll Configuration - {editingEmp?.name}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateEmployeeSubmit} className="space-y-4">

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Base Salary (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={formSalary}
                    onChange={(e) => setFormSalary(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Comm. Rate (%)
                  </label>
                  <input
                    type="number"
                    required
                    value={formCommRate}
                    onChange={(e) => setFormCommRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Sales Target (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={formTarget}
                    onChange={(e) => setFormTarget(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer hover:bg-slate-800"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: UPLOAD EMPLOYEE DOCUMENT */}
      {showDocUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs animate-scale-up">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Upload Credentials Document
              </h3>
              <button
                onClick={() => setShowDocUploadModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUploadDocumentSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Target Employee
                </label>
                <input
                  type="text"
                  disabled
                  value={activeEmployee ? activeEmployee.name : ""}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Document Category / Type *
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold text-slate-700"
                >
                  <option value="Identification">
                    Aadhaar Card (Identification)
                  </option>
                  <option value="Tax Document">PAN Card (Tax Document)</option>
                  <option value="Resume">Resume / Curriculum Vitae</option>
                  <option value="Certification">
                    Training / Fitting Certification
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Document Name / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh_Aadhaar_Verified"
                  value={docName}
                  onChange={(e) =>
                    setDocName(
                      docName.endsWith(".pdf") ? docName : e.target.value,
                    )
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-800 font-semibold"
                />
              </div>

              <div className="border border-dashed border-slate-200 rounded-xl p-5 text-center bg-slate-50/50">
                <p className="font-bold text-[11px] text-slate-500">
                  Drag & drop your files here, or browse
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  Supports PDF, JPG, PNG up to 10MB
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowDocUploadModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer hover:bg-slate-800"
                >
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
