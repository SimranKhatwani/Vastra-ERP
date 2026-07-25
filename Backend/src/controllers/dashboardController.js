const Customer = require('../models/customerModel');
const Invoice = require('../models/invoiceModel');
const Employee = require('../models/employeeModel');
const SupportTicket = require('../models/supportTicketModel');
const EmployeeResolver = require('../services/employeeResolver');
const UniversalDashboardService = require('../services/universalDashboardService');

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
    // Step 1: Resolve employee using Universal Employee Resolver
    const resolvedEmployee = await EmployeeResolver.resolve(req.user);

    // Step 2: Calculate dashboard using Universal Dashboard Service
    const dashboardData = await UniversalDashboardService.getEmployeeDashboard(resolvedEmployee);

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error fetching staff dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
