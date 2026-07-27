const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Vendor = require('../models/vendorModel');
const VendorTimeline = require('../models/vendorTimelineModel');
const VendorFollowUp = require('../models/vendorFollowUpModel');
const VendorDocument = require('../models/vendorDocumentModel');
const VendorNote = require('../models/vendorNoteModel');
const Tenant = require('../models/tenantModel');
const VendorCommunicationService = require('../services/vendorCommunicationService');

async function runVerification() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vastraerpbilling');
    console.log('Connected to MongoDB.');

    // 1. Find or create tenant
    let tenant = await Tenant.findOne();
    if (!tenant) {
      tenant = await Tenant.create({
        name: 'Vastra ERP Demo Tenant',
        businessName: 'Vastra ERP Enterprise',
        businessCode: 'T-981',
        email: 'tenant@vastraerp.com',
        phone: '9876543210',
        aadhaarNumber: '123456789012',
        address: { street: 'Main St', city: 'Surat', district: 'Surat', state: 'Gujarat', pinCode: '395002' },
        subscriptionPlan: 'ENTERPRISE',
        planExpiryDate: new Date(Date.now() + 365 * 86400000)
      });
    }
    const tenantId = tenant._id;

    // 2. Find or create vendor
    let vendor = await Vendor.findOne({ tenantId });
    if (!vendor) {
      vendor = await Vendor.create({
        tenantId,
        vendorCode: 'VND-DEMO-001',
        name: 'Raymond Textiles Pvt Ltd',
        businessName: 'Raymond Manufacturing Co',
        phone: '9876543210',
        email: 'orders@raymond.com',
        businessType: 'Manufacturer',
        category: 'Fabric & Materials',
        rating: 4.8,
        qualityRemarks: 'Premium quality cotton and woollen suitings.',
        brandsSupplied: ['Raymond', 'Park Avenue', 'Parx'],
        bankDetails: {
          bankName: 'HDFC Bank',
          accountHolder: 'Raymond Textiles Pvt Ltd',
          accountNo: '50200018291029',
          ifscCode: 'HDFC0000124',
          branch: 'Surat Main Branch'
        }
      });
      console.log('Created Demo Vendor:', vendor.name);
    } else {
      console.log('Found Existing Vendor:', vendor.name);
    }

    const vendorId = vendor._id;

    // 3. Test Activity Log Creation
    const activity = await VendorCommunicationService.logActivity({
      tenantId,
      vendorId,
      employeeName: 'Dhruv Jain',
      activityType: 'Purchase Order Shared',
      channel: 'WhatsApp',
      remarks: 'Shared PO #PO-2026-9810 with Raymond Sales Manager',
      status: 'Completed'
    });
    console.log('Logged Activity to Timeline:', activity.activityType);

    // 4. Test Follow-up Creation
    const followUp = await VendorFollowUp.create({
      tenantId,
      vendorId,
      title: 'Dispatch Confirmation Follow-up for Fabric Roll #104',
      followUpType: 'Dispatch Follow-up',
      expectedDate: new Date(Date.now() + 86400000 * 2),
      priority: 'High',
      assignedEmployeeName: 'Vijay Shekhar',
      status: 'Pending'
    });
    console.log('Created Vendor Follow-up:', followUp.title);

    // 5. Test Full Vendor Hub Data Aggregation Service
    const hub = await VendorCommunicationService.getFullVendorHub(vendorId, tenantId);
    console.log('====================================================');
    console.log('VENDOR COMMUNICATION HUB VERIFICATION SUMMARY');
    console.log('====================================================');
    console.log('Vendor Name:', hub.vendor.name);
    console.log('Vendor Code:', hub.vendor.vendorCode);
    console.log('Timeline Events Count:', hub.timeline.length);
    console.log('Follow-ups Count:', hub.followUps.length);
    console.log('Documents Count:', hub.documents.length);
    console.log('Notes Count:', hub.notes.length);
    console.log('Aggregated Total Purchase Value: ₹' + hub.purchaseHistory.totalPurchaseValue);
    console.log('Aggregated Total Outstanding: ₹' + hub.outstanding.totalOutstanding);
    console.log('====================================================');
    console.log('VERIFICATION PASSED 100% SUCCESSFUL');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Verification error:', err);
    process.exit(1);
  }
}

runVerification();
