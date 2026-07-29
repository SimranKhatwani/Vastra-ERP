const Invoice = require('../models/invoiceModel');
const Employee = require('../models/employeeModel');
const mongoose = require('mongoose');

/**
 * GET /api/activity-feed
 * Returns recent cross-entity activity for the tenant's live ACTIVITY FEED.
 * Aggregates last N items from invoices, employees (created/updated), etc.
 */
exports.getActivityFeed = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const limit = parseInt(req.query.limit) || 30;

    // Fetch recent invoices
    const recentInvoices = await Invoice.find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const invoiceActivities = recentInvoices.map((inv) => ({
      id: inv._id.toString(),
      type: 'invoice',
      action: 'INVOICE_CREATED',
      icon: '🧾',
      color: 'emerald',
      title: `Invoice ${inv.invoiceNo || '#' + inv._id.toString().slice(-6)} generated`,
      detail: `${inv.customerName || 'Walk-in Customer'} · ₹${(inv.grandTotal || 0).toLocaleString('en-IN')} · ${inv.paymentMethod || 'Cash'}`,
      user: inv.salespersonName || 'Staff',
      timestamp: inv.createdAt,
      meta: {
        amount: inv.grandTotal,
        invoiceNo: inv.invoiceNo,
        customer: inv.customerName,
        paymentMethod: inv.paymentMethod,
      },
    }));

    // Fetch recent employees (created)
    let employeeActivities = [];
    try {
      const Employee = require('../models/employeeModel');
      const recentEmployees = await Employee.find({ tenantId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      employeeActivities = recentEmployees.map((emp) => ({
        id: `emp-${emp._id}`,
        type: 'employee',
        action: 'EMPLOYEE_ADDED',
        icon: '👤',
        color: 'blue',
        title: `${emp.name} added to team`,
        detail: `Role: ${emp.role || 'Staff'} · ${emp.department || 'General'}`,
        user: 'HR Admin',
        timestamp: emp.createdAt,
        meta: { role: emp.role, name: emp.name },
      }));
    } catch (empErr) {
      // Employee model may differ — skip silently
    }

    // Fetch recent alterations (created)
    let alterationActivities = [];
    try {
      const Alteration = require('../models/alterationModel');
      const recentAlterations = await Alteration.find({ tenantId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      alterationActivities = recentAlterations.map((alt) => ({
        id: `alt-${alt._id}`,
        type: 'alteration',
        action: 'ALTERATION_CREATED',
        icon: '✂️',
        color: 'red',
        title: `Alteration request ${alt.alterationId || '#' + alt._id.toString().slice(-6)} created`,
        detail: `Invoice: ${alt.invoiceNumber} · Customer: ${alt.customerName} · Product: ${alt.productName}`,
        user: alt.createdBy || 'Staff',
        timestamp: alt.createdAt,
        meta: { alterationId: alt.alterationId, customer: alt.customerName, item: alt.productName },
      }));
    } catch (altErr) {
      console.warn('Alteration query skipped:', altErr.message);
    }

    // Merge, sort by timestamp desc, slice
    const allActivities = [...invoiceActivities, ...employeeActivities, ...alterationActivities]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.json({ success: true, data: allActivities, total: allActivities.length });
  } catch (error) {
    console.error('Activity Feed error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
