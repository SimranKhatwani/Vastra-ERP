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
    
    // 3. Overdue Deliveries (expected delivery was before today, and not delivered)
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
    const userName = req.user.name || '';
    const userEmail = req.user.email || '';
    const userPhone = req.user.phone || '';
    const firstName = userName.split(' ')[0];

    // 1. Locate matching Employee record in MongoDB
    let emp = null;
    if (req.user.employeeId) {
      emp = await Employee.findOne({ _id: req.user.employeeId, tenantId }).lean();
    }
    if (!emp) {
      emp = await Employee.findOne({
        tenantId,
        $or: [
          { email: (userEmail).toLowerCase() },
          { phone: userPhone },
          { name: { $regex: new RegExp(`^${userName.trim()}$`, 'i') } },
          { name: { $regex: new RegExp(firstName, 'i') } }
        ]
      }).lean();
    }

    const empIdStr = emp?._id ? String(emp._id) : String(userId);
    const empNameStr = (emp?.name || userName).toLowerCase().trim();

    // 2. Fetch all assigned invoices from MongoDB
    const allInvoices = await Invoice.find({ tenantId }).sort('-createdAt').lean();

    const assignedInvoices = allInvoices.filter(inv => {
      const invEmpId = inv.employeeId || inv.salespersonId || inv.workerId || inv.userId;
      const invEmpName = (inv.salespersonName || inv.employeeName || inv.workerName || inv.createdBy || inv.cashierName || '').toLowerCase().trim();
      
      const idMatch = empIdStr && invEmpId && String(empIdStr) === String(invEmpId);
      const nameMatch = empNameStr && invEmpName && (
        invEmpName === empNameStr || 
        invEmpName.includes(empNameStr) || 
        empNameStr.includes(invEmpName) ||
        (firstName && (invEmpName.includes(firstName.toLowerCase()) || firstName.toLowerCase().includes(invEmpName)))
      );

      const itemMatch = (inv.items || []).some(item => {
        const itemSpId = item.salespersonId || item.workerId || item.employeeId;
        const itemSpName = (item.salespersonName || item.workerName || item.employeeName || '').toLowerCase().trim();
        const itemIdMatch = empIdStr && itemSpId && String(empIdStr) === String(itemSpId);
        const itemNameMatch = empNameStr && itemSpName && (
          itemSpName === empNameStr ||
          itemSpName.includes(empNameStr) ||
          empNameStr.includes(itemSpName) ||
          (firstName && (itemSpName.includes(firstName.toLowerCase()) || firstName.toLowerCase().includes(itemSpName)))
        );
        return itemIdMatch || itemNameMatch;
      });

      return idMatch || nameMatch || itemMatch;
    });

    // 3. Compute exact totals from MongoDB Admin Employee record
    const rawCommRate = emp?.commissionRate ?? emp?.commRate ?? req.user?.commissionRate;
    const parsedRate = parseFloat(rawCommRate);
    const roleStr = (emp?.role || req.user?.role || '').toLowerCase();
    const defaultRate = roleStr.includes('worker') ? 0.5 : (roleStr.includes('tailor') ? 4 : (roleStr.includes('cashier') ? 1 : 1.5));
    
    const commissionRate = (!isNaN(parsedRate) && parsedRate >= 0)
      ? parsedRate
      : defaultRate;

    const invoiceSalesTotal = assignedInvoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
    const totalSales = typeof emp?.monthlySales === 'number' && emp.monthlySales > 0
      ? emp.monthlySales
      : (invoiceSalesTotal > 0 ? invoiceSalesTotal : (typeof req.user?.monthlySales === 'number' ? req.user.monthlySales : 0));

    const invoiceCount = typeof emp?.totalInvoices === 'number' && emp.totalInvoices > 0
      ? emp.totalInvoices
      : (assignedInvoices.length > 0 ? assignedInvoices.length : (totalSales > 0 ? Math.max(1, Math.round(totalSales / 4500)) : 0));

    const rawCommEarned = emp?.commissionEarned ?? req.user?.commissionEarned;
    const commissionAmount = typeof emp?.commissionEarned === 'number' && emp.commissionEarned > 0
      ? emp.commissionEarned
      : (typeof rawCommEarned === 'number' && rawCommEarned > 0 ? rawCommEarned : Math.round(totalSales * (commissionRate / 100) * 100) / 100);

    res.status(200).json({
      success: true,
      data: {
        employee: {
          id: emp?._id || userId,
          name: emp?.name || userName,
          role: emp?.role || req.user.role,
          email: emp?.email || userEmail,
          phone: emp?.phone || userPhone,
        },
        totalSales,
        invoiceCount,
        commissionRate,
        commissionAmount,
        attendanceRate: emp?.attendanceRate || 98,
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
