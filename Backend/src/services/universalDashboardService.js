const Invoice = require('../models/invoiceModel');
const Employee = require('../models/employeeModel');
const AttendanceRecord = require('../models/attendanceRecordModel');
const SupportTicket = require('../models/supportTicketModel');
const Alteration = require('../models/alterationModel');

/**
 * Universal Dashboard Service
 * 
 * One single dashboard engine for every current and future employee role.
 * Calculates live sales, invoices, commissions, attendance, alterations, and pending work
 * strictly using MongoDB Employee._id ObjectIds.
 */
class UniversalDashboardService {
  static async getEmployeeDashboard(resolvedEmployee) {
    const { employeeId, tenantId, role, name, email, phone, commissionRate: resolvedCommRate } = resolvedEmployee;

    // 1. Query assigned invoices strictly by Employee._id ObjectId
    const assignedInvoices = await Invoice.find({
      tenantId,
      $or: [
        { salespersonId: employeeId },
        { workerId: employeeId },
        { employeeId: employeeId },
        { 'items.salespersonId': employeeId },
        { 'items.workerId': employeeId },
        { 'items.employeeId': employeeId }
      ]
    }).sort('-createdAt').lean();

    // 2. Fetch Employee document for cached metrics backup
    const empDoc = await Employee.findById(employeeId).lean();

    // 3. Compute live sales metrics
    const liveSalesTotal = assignedInvoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
    const liveInvoiceCount = assignedInvoices.length;

    const totalSales = liveInvoiceCount > 0
      ? liveSalesTotal
      : (typeof empDoc?.monthlySales === 'number' && empDoc.monthlySales > 0 ? empDoc.monthlySales : 0);

    const invoiceCount = liveInvoiceCount > 0
      ? liveInvoiceCount
      : (typeof empDoc?.totalInvoices === 'number' && empDoc.totalInvoices > 0 ? empDoc.totalInvoices : 0);

    // 4. Compute commission metrics
    const parsedRate = parseFloat(empDoc?.commissionRate ?? resolvedCommRate);
    const roleStr = (role || '').toLowerCase();
    const defaultRate = roleStr.includes('worker') ? 0.5 : (roleStr.includes('tailor') ? 4 : (roleStr.includes('cashier') ? 1 : 1.5));
    const commissionRate = (!isNaN(parsedRate) && parsedRate >= 0) ? parsedRate : defaultRate;

    const commissionAmount = typeof empDoc?.commissionEarned === 'number' && empDoc.commissionEarned > 0
      ? empDoc.commissionEarned
      : Math.round(totalSales * (commissionRate / 100) * 100) / 100;

    // 5. Compute Today's Metrics
    const startOfTodayStr = new Date().toISOString().split('T')[0];
    const todayInvoices = assignedInvoices.filter(inv => {
      const d = inv.createdAt ? String(inv.createdAt).split('T')[0] : '';
      return d === startOfTodayStr;
    });

    const todaySales = todayInvoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
    const todayBillsCount = todayInvoices.length;

    // 6. Compute Attendance Rate from Attendance Record Collection
    let attendanceRate = 95;
    try {
      const attendanceLogs = await AttendanceRecord.find({ tenantId, employeeId }).lean();
      if (attendanceLogs.length > 0) {
        const presentCount = attendanceLogs.filter(a => a.status === 'Present' || a.status === 'Late').length;
        attendanceRate = Math.round((presentCount / attendanceLogs.length) * 100);
      } else if (empDoc?.attendanceRate) {
        attendanceRate = empDoc.attendanceRate;
      }
    } catch (err) {
      console.warn('UniversalDashboardService: AttendanceRecord lookup note:', err.message);
    }

    // 7. Compute Assigned Alterations / Work Orders
    let assignedAlterations = [];
    try {
      assignedAlterations = await Alteration.find({
        tenantId,
        $or: [
          { workerId: employeeId },
          { tailorId: employeeId },
          { salespersonId: employeeId }
        ]
      }).sort('-createdAt').limit(20).lean();
    } catch (err) {
      // Optional schema lookup
    }

    return {
      employee: {
        id: employeeId,
        name: name,
        role: role,
        email: email,
        phone: phone,
      },
      metrics: {
        totalSales,
        invoiceCount,
        commissionRate,
        commissionAmount,
        todaySales,
        todayBillsCount,
        attendanceRate,
        pendingAlterationsCount: assignedAlterations.filter(a => a.status !== 'Completed' && a.status !== 'Delivered').length
      },
      // Top-level aliases for backwards compatibility with all frontends
      totalSales,
      invoiceCount,
      commissionRate,
      commissionAmount,
      todaySales,
      todayBillsCount,
      attendanceRate,
      invoices: assignedInvoices,
      alterations: assignedAlterations
    };
  }
}

module.exports = UniversalDashboardService;
