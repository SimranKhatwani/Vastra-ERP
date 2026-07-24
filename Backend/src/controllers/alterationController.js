const Alteration = require('../models/alterationModel');

// @desc    Create a new alteration record
// @route   POST /api/alterations
// @access  Private
exports.createAlteration = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (Array.isArray(req.body)) {
      const recordsToCreate = req.body.map((item, idx) => ({
        ...item,
        tenantId,
        alterationId: item.alterationId || `ALT-${Date.now().toString().slice(-6)}-${idx + 1}`,
        createdBy: item.createdBy || req.user?.name || 'Cashier',
      }));
      const created = await Alteration.insertMany(recordsToCreate);
      return res.status(201).json({ success: true, count: created.length, data: created });
    }

    const count = await Alteration.countDocuments({ tenantId });
    const altCode = `ALT-${Date.now().toString().slice(-4)}${(count + 1).toString().padStart(3, '0')}`;

    const alteration = await Alteration.create({
      ...req.body,
      tenantId,
      alterationId: req.body.alterationId || altCode,
      createdBy: req.body.createdBy || req.user?.name || 'Cashier',
    });

    res.status(201).json({ success: true, data: alteration });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all alteration records
// @route   GET /api/alterations
// @access  Private
exports.getAlterations = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const filter = tenantId ? { tenantId } : {};
    const alterations = await Alteration.find(filter).sort('-createdAt');
    res.status(200).json({ success: true, count: alterations.length, data: alterations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single alteration by ID
// @route   GET /api/alterations/:id
// @access  Private
exports.getAlterationById = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const filter = tenantId ? { _id: req.params.id, tenantId } : { _id: req.params.id };
    const alteration = await Alteration.findOne(filter);

    if (!alteration) {
      return res.status(404).json({ success: false, message: 'Alteration record not found' });
    }

    res.status(200).json({ success: true, data: alteration });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update alteration status or details
// @route   PATCH /api/alterations/:id
// @access  Private
exports.updateAlteration = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const filter = tenantId ? { _id: req.params.id, tenantId } : { _id: req.params.id };

    const alteration = await Alteration.findOneAndUpdate(
      filter,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!alteration) {
      return res.status(404).json({ success: false, message: 'Alteration record not found' });
    }

    res.status(200).json({ success: true, data: alteration });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete alteration record
// @route   DELETE /api/alterations/:id
// @access  Private
exports.deleteAlteration = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const filter = tenantId ? { _id: req.params.id, tenantId } : { _id: req.params.id };

    const alteration = await Alteration.findOneAndDelete(filter);

    if (!alteration) {
      return res.status(404).json({ success: false, message: 'Alteration record not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// FEATURE 1: CUSTOMER NOTIFICATION VIA WHATSAPP
// ==============================================================================
const Notification = require('../models/notificationModel');

exports.sendWhatsAppNotification = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { alterationId, customMessage } = req.body;

    const filter = tenantId ? { _id: alterationId, tenantId } : { _id: alterationId };
    let alteration = await Alteration.findOne(filter);

    if (!alteration) {
      // Fallback search by string alterationId
      alteration = await Alteration.findOne({ alterationId, ...(tenantId ? { tenantId } : {}) });
    }

    if (!alteration) {
      return res.status(404).json({ success: false, message: 'Alteration record not found' });
    }

    const customerName = alteration.customerName || 'Valued Customer';
    const customerPhone = (alteration.customerPhone || '').replace(/[^0-9]/g, '');
    const invoiceNumber = alteration.invoiceNumber || alteration.invoiceId || 'N/A';
    const productName = alteration.productName || 'Garment Item';
    const deliveryDate = alteration.deliveryDate || 'Today';

    const defaultMsg = `Hello ${customerName},\n\nYour alteration for Invoice ${invoiceNumber} is now completed and ready for pickup.\n\nProduct:\n${productName}\n\nDelivery Date:\n${deliveryDate}\n\nPlease visit the showroom to collect your garment.\n\nThank You,\nVastra ERP Tailoring Dept`;

    const messageText = customMessage || defaultMsg;
    const phoneWithCode = customerPhone.length === 10 ? `91${customerPhone}` : customerPhone;
    const whatsappUrl = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(messageText)}`;

    // Store notification history in MongoDB
    let notificationLog = null;
    try {
      notificationLog = await Notification.create({
        tenantId: tenantId || alteration.tenantId,
        title: `WhatsApp: ${alteration.alterationId || 'ALT'} Ready`,
        message: messageText,
        type: 'success',
        read: false,
        date: new Date(),
        notificationType: 'WhatsApp',
        sentBy: req.user ? req.user.name : 'Cashier',
        deliveryStatus: 'Sent',
        alterationId: alteration._id,
        customerName,
        customerPhone,
        invoiceNumber,
        productName,
        deliveryDate
      });
    } catch (logErr) {
      console.error('Notification log error:', logErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'WhatsApp notification prepared & logged successfully',
      whatsappUrl,
      notificationLog,
      details: {
        customerName,
        customerPhone,
        invoiceNumber,
        productName,
        deliveryDate,
        messageText
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// FEATURE 2: ALTERATION REPORTS & ANALYTICS
// ==============================================================================
exports.getAlterationReports = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { startDate, endDate, status, priority, employee } = req.query;

    let query = tenantId ? { tenantId } : {};

    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (priority && priority !== 'All') {
      query.priority = priority;
    }
    if (employee && employee !== 'All') {
      query.tailorName = employee;
    }

    const alterations = await Alteration.find(query).sort('-createdAt').lean();

    const totalAlterations = alterations.length;
    const completedCount = alterations.filter(a => a.status === 'Delivered' || a.status === 'Ready for Delivery').length;
    const readyForDeliveryCount = alterations.filter(a => a.status === 'Ready for Delivery').length;
    const inProgressCount = alterations.filter(a => a.status === 'In Progress').length;
    const pendingCount = alterations.filter(a => a.status === 'Pending' || a.status === 'Assigned').length;

    const todayStr = new Date().toISOString().split('T')[0];
    const delayedJobs = alterations.filter(a => a.deliveryDate && a.deliveryDate < todayStr && a.status !== 'Delivered');
    const delayedCount = delayedJobs.length;

    const completionRate = totalAlterations ? Math.round((completedCount / totalAlterations) * 100) : 0;
    const delayedRate = totalAlterations ? Math.round((delayedCount / totalAlterations) * 100) : 0;

    // Charts data
    const statusMap = {};
    alterations.forEach(a => {
      const st = a.status || 'Pending';
      statusMap[st] = (statusMap[st] || 0) + 1;
    });
    const statusChart = Object.keys(statusMap).map(k => ({ name: k, count: statusMap[k] }));

    const priorityMap = {};
    alterations.forEach(a => {
      const p = a.priority || 'Normal';
      priorityMap[p] = (priorityMap[p] || 0) + 1;
    });
    const priorityChart = Object.keys(priorityMap).map(k => ({ name: k, count: priorityMap[k] }));

    const garmentMap = {};
    alterations.forEach(a => {
      const g = a.productName ? a.productName.split(' ')[0] : 'Garment';
      garmentMap[g] = (garmentMap[g] || 0) + 1;
    });
    const garmentChart = Object.keys(garmentMap).map(k => ({ name: k, count: garmentMap[k] }));

    const monthlyMap = {};
    alterations.forEach(a => {
      const month = new Date(a.createdAt).toLocaleString('en-IN', { month: 'short' });
      monthlyMap[month] = (monthlyMap[month] || 0) + 1;
    });
    const monthlyChart = Object.keys(monthlyMap).map(k => ({ month: k, count: monthlyMap[k] }));

    res.status(200).json({
      success: true,
      summary: {
        totalAlterations,
        completedCount,
        readyForDeliveryCount,
        inProgressCount,
        pendingCount,
        delayedCount,
        completionRate,
        delayedRate
      },
      charts: {
        statusChart,
        priorityChart,
        garmentChart,
        monthlyChart
      },
      delayedJobs,
      data: alterations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================================================
// FEATURE 3: EMPLOYEE-WISE ALTERATION TRACKING (PRODUCTIVITY ONLY, NO COMMISSION)
// ==============================================================================
const Employee = require('../models/employeeModel');

exports.getEmployeeAlterationPerformance = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { startDate, endDate, status, priority, employee } = req.query;

    let altQuery = tenantId ? { tenantId } : {};
    if (startDate && endDate) {
      altQuery.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (status && status !== 'All') {
      altQuery.status = status;
    }
    if (priority && priority !== 'All') {
      altQuery.priority = priority;
    }
    if (employee && employee !== 'All') {
      altQuery.tailorName = employee;
    }

    const alterations = await Alteration.find(altQuery).lean();
    const tailors = await Employee.find(tenantId ? { tenantId } : {}).lean();

    const tailorList = tailors.filter(e => 
      (e.designation || e.role || '').toLowerCase().includes('tailor') ||
      (e.designation || e.role || '').toLowerCase().includes('darzi') ||
      (e.designation || e.role || '').toLowerCase().includes('karigar') ||
      (e.designation || e.role || '').toLowerCase().includes('master') ||
      e.role === 'Tailor'
    );

    const tailorNamesSet = new Set(tailorList.map(t => t.name));
    alterations.forEach(a => {
      if (a.tailorName) tailorNamesSet.add(a.tailorName);
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const performanceMetrics = Array.from(tailorNamesSet).map((tailorName, idx) => {
      const tailorEmp = tailorList.find(t => t.name === tailorName) || {};
      const tailorAlts = alterations.filter(a => a.tailorName === tailorName);

      const assignedCount = tailorAlts.length;
      const completedAlts = tailorAlts.filter(a => a.status === 'Delivered' || a.status === 'Ready for Delivery');
      const completedCount = completedAlts.length;
      const pendingCount = tailorAlts.filter(a => a.status === 'Pending' || a.status === 'Assigned').length;
      const inProgressCount = tailorAlts.filter(a => a.status === 'In Progress').length;
      const readyForDeliveryCount = tailorAlts.filter(a => a.status === 'Ready for Delivery').length;

      const delayedAlts = tailorAlts.filter(a => a.deliveryDate && a.deliveryDate < todayStr && a.status !== 'Delivered');
      const delayedCount = delayedAlts.length;

      const todayWork = tailorAlts.filter(a => new Date(a.createdAt).toISOString().split('T')[0] === todayStr).length;
      const weeklyWork = tailorAlts.filter(a => new Date(a.createdAt) >= oneWeekAgo).length;
      const monthlyWork = tailorAlts.filter(a => new Date(a.createdAt) >= startOfMonth).length;

      const completionPct = assignedCount ? Math.round((completedCount / assignedCount) * 100) : 100;

      let totalHours = 0;
      let completedCountWithDates = 0;
      completedAlts.forEach(a => {
        if (a.createdAt && a.updatedAt) {
          const hrs = (new Date(a.updatedAt) - new Date(a.createdAt)) / (1000 * 60 * 60);
          if (hrs > 0) {
            totalHours += hrs;
            completedCountWithDates++;
          }
        }
      });

      const avgCompletionTimeHrs = completedCountWithDates ? Number((totalHours / completedCountWithDates).toFixed(1)) : 4.5;

      const lastCompletedAlt = completedAlts.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))[0];
      const lastCompletedDate = lastCompletedAlt ? new Date(lastCompletedAlt.updatedAt || lastCompletedAlt.createdAt).toLocaleDateString('en-IN') : 'N/A';

      let availabilityStatus = tailorEmp.status || 'Available';
      if (inProgressCount >= 5) availabilityStatus = 'Busy';
      if (tailorEmp.onLeave) availabilityStatus = 'On Leave';

      let performanceIndicator = 'Good';
      if (completionPct >= 85 && delayedCount === 0) {
        performanceIndicator = 'Excellent';
      } else if (completionPct >= 65 && delayedCount <= 2) {
        performanceIndicator = 'Good';
      } else if (completionPct >= 45) {
        performanceIndicator = 'Average';
      } else {
        performanceIndicator = 'Needs Attention';
      }

      return {
        employeeId: tailorEmp.employeeId || tailorEmp._id || `EMP-TR-${101 + idx}`,
        employeeName: tailorName,
        designation: tailorEmp.designation || tailorEmp.role || 'Master Tailor',
        assignedCount,
        completedCount,
        pendingCount,
        inProgressCount,
        readyForDeliveryCount,
        delayedCount,
        todayWork,
        weeklyWork,
        monthlyWork,
        completionPct,
        avgCompletionTimeHrs,
        lastCompletedDate,
        availabilityStatus,
        performanceIndicator
      };
    });

    const mostActiveTailor = [...performanceMetrics].sort((a, b) => b.completedCount - a.completedCount)[0] || null;

    res.status(200).json({
      success: true,
      summary: {
        totalTailors: performanceMetrics.length,
        mostActiveTailor: mostActiveTailor ? mostActiveTailor.employeeName : 'N/A',
        avgProductivityPct: performanceMetrics.length ? Math.round(performanceMetrics.reduce((s, m) => s + m.completionPct, 0) / performanceMetrics.length) : 0
      },
      metrics: performanceMetrics,
      mostActiveTailor
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
