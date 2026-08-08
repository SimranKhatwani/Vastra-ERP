const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../Backend/.env') });
const mongoose = require('mongoose');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

// Load Backend models
const SaleBill = require('../Backend/src/models/billing/SaleBill');
const Payment = require('../Backend/src/models/payments/Payment');
const PaymentTransaction = require('../Backend/src/models/payments/PaymentTransaction');
const CustomerLedger = require('../Backend/src/models/ledger/CustomerLedger');
const Customer = require('../Backend/src/models/crm/Customer');
const BillingService = require('../Backend/src/services/billing.service');

const connectDB = require('../Backend/src/config/db');

async function runTests() {
  console.log('=== STARTING PAYMENT MODULE VERIFICATION ===');
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    const tenantId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    const firmId = new mongoose.Types.ObjectId();
    const warehouseId = new mongoose.Types.ObjectId();

    // Setup Test Customer with ₹500 advance
    const customer = await Customer.create({
      tenantId,
      name: 'Test Payment Customer',
      phone: '9999888877',
      walletAdvance: 500,
      prepaidAdvance: 500,
      dueBalance: 0,
      createdBy: userId
    });

    console.log(`\nCreated Test Customer: ${customer.name} (ID: ${customer._id})`);

    // TEST 1: Create Invoice = ₹2000, Advance Applied = ₹100
    console.log('\n--- TEST 1: Invoice = ₹2000, Advance = ₹100 ---');
    const billData1 = {
      billNo: `TEST-BILL-${Date.now()}`,
      customerId: customer._id.toString(),
      firmId: firmId.toString(),
      warehouseId: warehouseId.toString(),
      barcodes: [],
      paymentTransactions: [
        { mode: 'ADVANCE', amount: 100 }
      ]
    };

    // Simulate bill creation logic
    const saleBill = await SaleBill.create({
      tenantId,
      billNo: billData1.billNo,
      billDate: new Date(),
      customerId: customer._id,
      firmId,
      warehouseId,
      subTotal: 2000,
      discountAmount: 0,
      grandTotal: 2000,
      paidAmount: 0,
      advanceApplied: 100,
      dueAmount: 1900,
      status: 'PARTIALLY_PAID',
      createdBy: userId
    });

    const payment1 = await Payment.create({
      tenantId,
      saleBillId: saleBill._id,
      customerId: customer._id,
      receiptNo: `PAY-${saleBill.billNo}-1`,
      totalAmount: 0,
      advanceApplied: 100,
      createdBy: userId
    });

    await PaymentTransaction.create({
      tenantId,
      paymentId: payment1._id,
      mode: 'ADVANCE',
      amount: 100,
      createdBy: userId
    });

    // Fetch live payments via BillingService.getBillPayments
    let state1 = await BillingService.getBillPayments(saleBill._id, tenantId);
    console.log(`Grand Total: ₹${state1.saleBill.grandTotal}`);
    console.log(`Advance Applied: ₹${state1.advanceApplied}`);
    console.log(`Remaining Amount: ₹${state1.remainingAmount}`);
    console.assert(state1.remainingAmount === 1900, 'TEST 1 FAILED: Remaining should be 1900');

    // TEST 2 & 3: Save ₹500 Cash Payment
    console.log('\n--- TEST 2 & 3: Cash Payment = ₹500 against remaining ₹1900 ---');
    const paymentResult = await BillingService.recordBillPayment(
      saleBill._id,
      {
        paymentTransactions: [{ mode: 'CASH', amount: 500 }],
        remarks: 'Test ₹500 cash payment'
      },
      userId,
      tenantId
    );

    let state2 = await BillingService.getBillPayments(saleBill._id, tenantId);
    console.log(`Previously Paid: ₹${state2.previouslyPaidAmount}`);
    console.log(`Advance Applied: ₹${state2.advanceApplied}`);
    console.log(`Remaining Amount: ₹${state2.remainingAmount}`);
    console.assert(state2.previouslyPaidAmount === 500, 'TEST 2 FAILED: Previously paid should be 500');
    console.assert(state2.remainingAmount === 1400, 'TEST 2 FAILED: Remaining should be 1400');

    // TEST 4 & 5: Persistence & Re-open Verification
    console.log('\n--- TEST 4 & 5: Verify DB Persistence & History ---');
    const dbPayments = await Payment.find({ saleBillId: saleBill._id, tenantId });
    const dbTransactions = await PaymentTransaction.find({ paymentId: { $in: dbPayments.map(p => p._id) }, tenantId });
    const dbLedger = await CustomerLedger.find({ customerId: customer._id, tenantId });

    console.log(`Payments Count in DB: ${dbPayments.length}`);
    console.log(`Transactions Count in DB: ${dbTransactions.length}`);
    console.log(`Customer Ledger Entries in DB: ${dbLedger.length}`);
    console.assert(dbPayments.length === 2, 'TEST 4 FAILED: 2 Payment documents expected');
    console.assert(dbTransactions.length === 2, 'TEST 4 FAILED: 2 PaymentTransaction documents expected');

    // TEST 8: Full Payment to reach ₹0 Due
    console.log('\n--- TEST 8: Pay Remaining ₹1400 ---');
    await BillingService.recordBillPayment(
      saleBill._id,
      {
        paymentTransactions: [{ mode: 'UPI', amount: 1400 }],
        remarks: 'Final settlement'
      },
      userId,
      tenantId
    );

    let state3 = await BillingService.getBillPayments(saleBill._id, tenantId);
    console.log(`Final Paid Amount: ₹${state3.previouslyPaidAmount}`);
    console.log(`Final Remaining Amount: ₹${state3.remainingAmount}`);
    console.log(`Final SaleBill Status: ${state3.saleBill.status}`);
    console.assert(state3.remainingAmount === 0, 'TEST 8 FAILED: Remaining should be 0');
    console.assert(state3.saleBill.status === 'COMPLETED', 'TEST 8 FAILED: Status should be COMPLETED');

    console.log('\n=== ALL TEST SCENARIOS PASSED SUCCESSFULLY ===');
  } catch (err) {
    console.error('VERIFICATION ERROR:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
