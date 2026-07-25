const Customer = require('../models/customerModel');
const Invoice = require('../models/invoiceModel');
const Employee = require('../models/employeeModel');
const SupportTicket = require('../models/supportTicketModel');

// @desc    Get Morning Action metrics for dashboard
// @route   GET /api/dashboard/morning-actions
// @access  Private
exports.getMorningActions = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    // Set up today's date boundaries
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. VIP Customers Pending
    const vipPendingCount = await Customer.countDocuments({
      tenantId,
      tier: { $in: ['Gold', 'Platinum'] },
      outstandingBalance: { $gt: 0 },
    });

    // 2. Customer Messages Failed
    const failedMessagesCount = await Invoice.countDocuments({
      tenantId,
      whatsappStatus: 'Failed',
    });
    
    // 3. Overdue Deliveries
    const overdueDeliveries = await Invoice.countDocuments({
      tenantId,
      expectedDeliveryDate: { $lt: startOfToday },
      fulfillmentStatus: { $ne: 'Delivered' }
    });

    // 4. Deliveries Due Today
    const deliveriesDueToday = await Invoice.countDocuments({
      tenantId,
      expectedDeliveryDate: { $gte: startOfToday, $lte: endOfToday },
      fulfillmentStatus: { $ne: 'Delivered' }
    });

    // 5. Waiting Collection
    const waitingCollection = await Invoice.countDocuments({
      tenantId,
      fulfillmentStatus: 'Ready For Collection'
    });

    // 6. Salesmen Absent
    const salesmenAbsent = await Employee.countDocuments({
      tenantId,
      role: { $regex: /sales/i },
      attendanceStatus: 'Absent'
    });

    // 7. Tailors at Capacity
    const tailorsData = await Employee.find({
      tenantId,
      role: { $regex: /tailor/i }
    });
    const tailorsAtCapacity = tailorsData.filter(t => t.currentWorkload >= t.maxCapacity).length;

    // 8. Re-Alter Cases Registered Today
    const realterCases = await SupportTicket.countDocuments({
      tenantId,
      createdAt: { $gte: startOfToday, $lte: endOfToday },
      status: 'Open',
      subject: { $regex: /alter|re-alter/i }
    });

    const morningActions = {
      overdueDeliveries,
      deliveriesDueToday,
      vipCustomersPending: vipPendingCount,
      salesmenAbsent,
      waitingCollection,
      tailorsAtCapacity,
      messagesFailed: failedMessagesCount,
      realterCases,
    };

    res.status(200).json({
      success: true,
      data: morningActions,
    });
  } catch (error) {
    console.error('Error fetching morning actions:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error fetching morning actions',
    });
  }
};

// @desc    Get Staff-specific Dashboard Summary & Commission stats directly from MongoDB
// @route   GET /api/dashboard/staff-summary
// @access  Private
exports.getStaffDashboardStats = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.id || req.user._id;

    // 1. Locate Employee record strictly by ObjectId reference
    let emp = null;
    if (req.user.employeeId) {
      emp = await Employee.findOne({ _id: req.user.employeeId, tenantId }).lean();
    }
    if (!emp && userId) {
      emp = await Employee.findOne({ userId, tenantId }).lean();
    }

    const targetEmpId = emp?._id || req.user.employeeId;

    // 2. Fetch assigned invoices strictly using Mongo ObjectId relationships
    const assignedInvoices = targetEmpId
      ? await Invoice.find({
          tenantId,
          $or: [
            { salespersonId: targetEmpId },
            { workerId: targetEmpId },
            { employeeId: targetEmpId },
            { 'items.salespersonId': targetEmpId },
            { 'items.workerId': targetEmpId },
            { 'items.employeeId': targetEmpId }
          ]
        }).sort('-createdAt').lean()
      : [];

    // 3. Compute exact live metrics
    const invoiceSalesTotal = assignedInvoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
    const invoiceCountReal = assignedInvoices.length;

    const totalSales = typeof emp?.monthlySales === 'number' && emp.monthlySales > 0
      ? emp.monthlySales
      : invoiceSalesTotal;

    const invoiceCount = typeof emp?.totalInvoices === 'number' && emp.totalInvoices > 0
      ? emp.totalInvoices
      : invoiceCountReal;

    const rawCommRate = emp?.commissionRate ?? emp?.commRate ?? req.user?.commissionRate;
    const parsedRate = parseFloat(rawCommRate);
    const roleStr = (emp?.role || req.user?.role || '').toLowerCase();
    const defaultRate = roleStr.includes('worker') ? 0.5 : (roleStr.includes('tailor') ? 4 : (roleStr.includes('cashier') ? 1 : 1.5));
    
    const commissionRate = (!isNaN(parsedRate) && parsedRate >= 0)
      ? parsedRate
      : defaultRate;

    const rawCommEarned = emp?.commissionEarned ?? req.user?.commissionEarned;
    const commissionAmount = typeof emp?.commissionEarned === 'number' && emp.commissionEarned > 0
      ? emp.commissionEarned
      : Math.round(totalSales * (commissionRate / 100) * 100) / 100;

    // Today metrics
    const startOfTodayStr = new Date().toISOString().split('T')[0];
    const todayInvoices = assignedInvoices.filter(inv => {
      const d = inv.createdAt ? String(inv.createdAt).split('T')[0] : '';
      return d === startOfTodayStr;
    });

    const todaySales = todayInvoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
    const todayBillsCount = todayInvoices.length;

    res.status(200).json({
      success: true,
      data: {
        employee: {
          id: emp?._id || targetEmpId || userId,
          name: emp?.name || req.user.name,
          role: emp?.role || req.user.role,
          email: emp?.email || req.user.email,
          phone: emp?.phone || req.user.phone,
        },
        totalSales,
        invoiceCount,
        commissionRate,
        commissionAmount,
        todaySales,
        todayBillsCount,
        attendanceRate: emp?.attendanceRate || 95,
        invoices: assignedInvoices
      }
    });
  } catch (error) {
    console.error('Error fetching staff dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
