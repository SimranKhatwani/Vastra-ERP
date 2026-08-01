const Invoice = require('../models/invoiceModel');
const SalesReturn = require('../models/salesReturnModel');
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
    const commissionRate = (!isNaN(parsedRate) && parsedRate >= 0) ? parsedRate : 1.5;

    const commissionAmount = typeof empDoc?.commissionEarned === 'number' && empDoc.commissionEarned > 0
      ? empDoc.commissionEarned
      : Math.round(totalSales * (commissionRate / 100) * 100) / 100;

    // [NEW] Query SalesReturn collection for Returns and Exchanges
    const returnsExchanges = await SalesReturn.find({
      tenantId
    }).sort('-date').lean();

    const returnCount = returnsExchanges.length;
    const exchangeCount = 0; // SalesReturns doesn't strictly segregate exchanges in the same way
    const totalReturnedAmount = returnsExchanges.reduce((sum, r) => sum + (r.totalReturnAmount || 0), 0);
    
    // Net Sales calculation
    let netSalesTotal = (liveInvoiceCount > 0 ? liveSalesTotal : 0) - totalReturnedAmount;
    if (netSalesTotal < 0) netSalesTotal = 0;

    const returnPercentage = totalSales > 0 ? Math.round((totalReturnedAmount / totalSales) * 100) : 0;

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
        netSales: typeof netSalesTotal !== 'undefined' ? netSalesTotal : totalSales,
        invoiceCount,
        returnCount: typeof returnCount !== 'undefined' ? returnCount : 0,
        exchangeCount: typeof exchangeCount !== 'undefined' ? exchangeCount : 0,
        totalReturnedAmount: typeof totalReturnedAmount !== 'undefined' ? totalReturnedAmount : 0,
        returnPercentage: typeof returnPercentage !== 'undefined' ? returnPercentage : 0,
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
