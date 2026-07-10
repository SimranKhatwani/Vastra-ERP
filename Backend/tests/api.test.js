const http = require('http');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

const SUPERADMIN_EMAIL = 'hp@gmail.com';
const SUPERADMIN_SECRET_KEY = 'Requin@SaaS2026';

let superAdminToken = '';
let businessAdminToken = '';
let businessCode = '';
let tenantId = '';
let businessAdminEmail = `testadmin_${Date.now()}@example.com`;
let businessAdminPassword = 'Password123';
let businessAdminPhone = `98765${Math.floor(10000 + Math.random() * 90000)}`;

// Test State variables
let brandId = '';
let categoryId = '';
let productId = '';
let supplierId = '';
let purchaseOrderId = '';
let customerId = '';
let employeeId = '';
let expenseId = '';
let ticketId = '';
let notificationId = '';

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

async function makeRequest(url, method, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsedData });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// --------------------- TEST DEFINITIONS ---------------------

test('1. SuperAdmin Login', async () => {
  const res = await makeRequest(`${BASE_URL}/superadmin/login`, 'POST', {}, {
    email: SUPERADMIN_EMAIL,
    secretKey: SUPERADMIN_SECRET_KEY,
  });

  if (res.status !== 200 || !res.body.success || !res.body.token) {
    throw new Error(`SuperAdmin Login failed. Status: ${res.status}, Body: ${JSON.stringify(res.body)}`);
  }
  superAdminToken = res.body.token;
  console.log('   ✓ SuperAdmin token acquired.');
});

test('2. SuperAdmin - Register Business', async () => {
  const businessName = `Test Garments ${Date.now()}`;
  const res = await makeRequest(`${BASE_URL}/superadmin/register-business`, 'POST', {
    'Authorization': `Bearer ${superAdminToken}`,
  }, {
    businessName,
    email: businessAdminEmail,
    plan: 'Starter',
    adminName: 'Test Admin',
    adminPassword: businessAdminPassword,
    adminPhone: businessAdminPhone,
    aadhaarNumber: '123456789012',
    address: {
      street: '123 Test Street',
      city: 'Delhi',
      district: 'North Delhi',
      state: 'Delhi',
    },
  });

  if (res.status !== 201 || !res.body.success || !res.body.data || !res.body.data.tenant) {
    throw new Error(`Register Business failed. Status: ${res.status}, Body: ${JSON.stringify(res.body)}`);
  }

  businessCode = res.body.data.tenant.businessCode;
  tenantId = res.body.data.tenant._id;
  console.log(`   ✓ Registered Business: ${businessName} (Code: ${businessCode})`);
});

test('3. SuperAdmin - Get Tenants', async () => {
  const res = await makeRequest(`${BASE_URL}/superadmin/tenants`, 'GET', {
    'Authorization': `Bearer ${superAdminToken}`,
  });

  if (res.status !== 200 || !res.body.success || !Array.isArray(res.body.data)) {
    throw new Error(`Get Tenants failed. Status: ${res.status}, Body: ${JSON.stringify(res.body)}`);
  }
  console.log(`   ✓ Found ${res.body.data.length} tenants.`);
});

test('4. SuperAdmin - Update Tenant Details & Toggle Status', async () => {
  // Update
  const updateRes = await makeRequest(`${BASE_URL}/superadmin/tenants/${tenantId}`, 'PUT', {
    'Authorization': `Bearer ${superAdminToken}`,
  }, {
    plan: 'Enterprise',
  });
  if (updateRes.status !== 200 || !updateRes.body.success) {
    throw new Error(`Update tenant details failed. Status: ${updateRes.status}, Body: ${JSON.stringify(updateRes.body)}`);
  }

  // Toggle Status to Suspended
  const toggleRes1 = await makeRequest(`${BASE_URL}/superadmin/tenants/${tenantId}/toggle-status`, 'PUT', {
    'Authorization': `Bearer ${superAdminToken}`,
  });
  if (toggleRes1.status !== 200 || toggleRes1.body.data.status !== 'Suspended') {
    throw new Error(`Toggle status to Suspended failed. Status: ${toggleRes1.status}, Body: ${JSON.stringify(toggleRes1.body)}`);
  }

  // Toggle Status back to Active
  const toggleRes2 = await makeRequest(`${BASE_URL}/superadmin/tenants/${tenantId}/toggle-status`, 'PUT', {
    'Authorization': `Bearer ${superAdminToken}`,
  });
  if (toggleRes2.status !== 200 || toggleRes2.body.data.status !== 'Active') {
    throw new Error(`Toggle status back to Active failed. Status: ${toggleRes2.status}, Body: ${JSON.stringify(toggleRes2.body)}`);
  }
  console.log('   ✓ Tenant details updated and status toggles validated.');
});

test('5. BusinessAdmin Login', async () => {
  const res = await makeRequest(`${BASE_URL}/auth/login`, 'POST', {}, {
    businessId: businessCode,
    email: businessAdminEmail,
    password: businessAdminPassword,
  });

  if (res.status !== 200 || !res.body.success || !res.body.token) {
    throw new Error(`BusinessAdmin Login failed. Status: ${res.status}, Body: ${JSON.stringify(res.body)}`);
  }
  businessAdminToken = res.body.token;
  console.log('   ✓ BusinessAdmin logged in successfully.');
});

test('6. BusinessAdmin - Get Profile', async () => {
  const res = await makeRequest(`${BASE_URL}/auth/profile`, 'GET', {
    'Authorization': `Bearer ${businessAdminToken}`,
  });

  if (res.status !== 200 || !res.body.success || !res.body.data) {
    throw new Error(`Get Profile failed. Status: ${res.status}, Body: ${JSON.stringify(res.body)}`);
  }
  console.log(`   ✓ Active profile retrieved: ${res.body.data.name} (${res.body.data.role})`);
});

test('7. Brand CRUD', async () => {
  // Create
  const createRes = await makeRequest(`${BASE_URL}/brands`, 'POST', {
    'Authorization': `Bearer ${businessAdminToken}`,
  }, {
    name: 'Zara Test',
    description: 'Testing Zara Brand description',
  });
  if (createRes.status !== 201 || !createRes.body.success) {
    throw new Error(`Create Brand failed. Status: ${createRes.status}`);
  }
  brandId = createRes.body.data._id;

  // Read
  const readRes = await makeRequest(`${BASE_URL}/brands`, 'GET', {
    'Authorization': `Bearer ${businessAdminToken}`,
  });
  if (readRes.status !== 200 || readRes.body.count === 0) {
    throw new Error('Read Brands failed.');
  }

  // Update
  const updateRes = await makeRequest(`${BASE_URL}/brands/${brandId}`, 'PUT', {
    'Authorization': `Bearer ${businessAdminToken}`,
  }, {
    description: 'Updated Zara Brand Description',
  });
  if (updateRes.status !== 200 || updateRes.body.data.description !== 'Updated Zara Brand Description') {
    throw new Error('Update Brand failed.');
  }
  console.log('   ✓ Brand CRUD verified.');
});

test('8. Category CRUD', async () => {
  // Create
  const createRes = await makeRequest(`${BASE_URL}/categories`, 'POST', {
    'Authorization': `Bearer ${businessAdminToken}`,
  }, {
    name: 'Shirts Test',
    description: 'Testing Shirts Category description',
  });
  if (createRes.status !== 201 || !createRes.body.success) {
    throw new Error(`Create Category failed. Status: ${createRes.status}`);
  }
  categoryId = createRes.body.data._id;

  // Read
  const readRes = await makeRequest(`${BASE_URL}/categories`, 'GET', {
    'Authorization': `Bearer ${businessAdminToken}`,
  });
  if (readRes.status !== 200 || readRes.body.count === 0) {
    throw new Error('Read Categories failed.');
  }

  // Update
  const updateRes = await makeRequest(`${BASE_URL}/categories/${categoryId}`, 'PUT', {
    'Authorization': `Bearer ${businessAdminToken}`,
  }, {
    description: 'Updated Shirts Category Description',
  });
  if (updateRes.status !== 200 || updateRes.body.data.description !== 'Updated Shirts Category Description') {
    throw new Error('Update Category failed.');
  }
  console.log('   ✓ Category CRUD verified.');
});

test('9. Product Management (Schema, CRUD & Stock Adjustments)', async () => {
  // Create
  const createRes = await makeRequest(`${BASE_URL}/products`, 'POST', {
    'Authorization': `Bearer ${businessAdminToken}`,
  }, {
    name: 'Denim Shirt',
    description: 'Zara Denim Shirt Special',
    category: 'Shirts Test',
    brand: 'Zara Test',
    basePrice: 1200,
    taxRate: 12,
    stock: 20,
    minStockAlert: 10,
    variants: [
      { sku: 'DS-M', color: 'Blue', size: 'M', stockQuantity: 10 },
      { sku: 'DS-L', color: 'Blue', size: 'L', stockQuantity: 10 },
    ],
  });
  if (createRes.status !== 201 || !createRes.body.success) {
    throw new Error(`Create Product failed. Status: ${createRes.status}, Body: ${JSON.stringify(createRes.body)}`);
  }
  productId = createRes.body.data._id;

  // Verify stock status logic
  if (createRes.body.data.stock !== 20 || createRes.body.data.status !== 'In Stock') {
    throw new Error(`Product schema status calculation failed. Expected 'In Stock', got: ${createRes.body.data.status}`);
  }

  // Stock decrement to trigger Low Stock
  const adjustRes1 = await makeRequest(`${BASE_URL}/products/${productId}/adjust-stock`, 'PUT', {
    'Authorization': `Bearer ${businessAdminToken}`,
  }, {
    amount: -12, // New stock: 8 (<= minStockAlert 10)
  });
  if (adjustRes1.status !== 200 || adjustRes1.body.data.stock !== 8 || adjustRes1.body.data.status !== 'Low Stock') {
    throw new Error(`Low Stock adjustment logic failed. Stock: ${adjustRes1.body.data.stock}, Status: ${adjustRes1.body.data.status}`);
  }

  // Stock decrement to trigger Out of Stock
  const adjustRes2 = await makeRequest(`${BASE_URL}/products/${productId}/adjust-stock`, 'PUT', {
    'Authorization': `Bearer ${businessAdminToken}`,
  }, {
    amount: -10, // Stock cannot be negative, should cap at 0
  });
  if (adjustRes2.status !== 200 || adjustRes2.body.data.stock !== 0 || adjustRes2.body.data.status !== 'Out of Stock') {
    throw new Error(`Out of Stock adjustment logic failed. Stock: ${adjustRes2.body.data.stock}, Status: ${adjustRes2.body.data.status}`);
  }

  // Adjust stock back up
  const adjustRes3 = await makeRequest(`${BASE_URL}/products/${productId}/adjust-stock`, 'PUT', {
    'Authorization': `Bearer ${businessAdminToken}`,
  }, {
    amount: 50, // New stock: 50
  });
  if (adjustRes3.status !== 200 || adjustRes3.body.data.stock !== 50 || adjustRes3.body.data.status !== 'In Stock') {
    throw new Error('Stock replenishment adjustment failed.');
  }

  console.log('   ✓ Product CRUD & Auto stock levels verified.');
});

test('10. Supplier CRUD', async () => {
  // Create
  const createRes = await makeRequest(`${BASE_URL}/suppliers`, 'POST', {
    'Authorization': `Bearer ${businessAdminToken}`,
  }, {
    name: 'Global Fabrics Corp',
    contactPerson: 'John Supplier',
    email: 'john@globalfabrics.com',
    phone: `999000${Math.floor(1000 + Math.random() * 9000)}`,
    gstin: '07AAAAA1111A1Z1',
  });
  if (createRes.status !== 201 || !createRes.body.success) {
    throw new Error(`Create Supplier failed. Status: ${createRes.status}`);
  }
  supplierId = createRes.body.data._id;

  // Read
  const readRes = await makeRequest(`${BASE_URL}/suppliers`, 'GET', {
    'Authorization': `Bearer ${businessAdminToken}`,
  });
  if (readRes.status !== 200 || readRes.body.count === 0) {
    throw new Error('Read Suppliers failed.');
  }

  // Update
  const updateRes = await makeRequest(`${BASE_URL}/suppliers/${supplierId}`, 'PUT', {
    'Authorization': `Bearer ${businessAdminToken}`,
  }, {
    contactPerson: 'John Updated Supplier',
  });
  if (updateRes.status !== 200 || updateRes.body.data.contactPerson !== 'John Updated Supplier') {
    throw new Error('Update Supplier failed.');
  }
  console.log('   ✓ Supplier CRUD verified.');
});

test('11. Purchase Order Creation & Supplier Balance Logic', async () => {
  // Create completed PO
  const createRes = await makeRequest(`${BASE_URL}/purchase-orders`, 'POST', {
    'Authorization': `Bearer ${businessAdminToken}`,
  }, {
    supplierId: supplierId,
    supplierName: 'Global Fabrics Corp',
    items: [
      {
        productId: productId,
        name: 'Denim Shirt',
        sku: 'DS-M',
        quantity: 10,
        purchasePrice: 600,
        totalPrice: 6000,
      }
    ],
    subTotal: 6000,
    grandTotal: 6000,
    outstandingPaid: 1500, // outstanding debt: 4500
    status: 'Completed',
  });

  if (createRes.status !== 201 || !createRes.body.success) {
    throw new Error(`Create PO failed. Status: ${createRes.status}, Body: ${JSON.stringify(createRes.body)}`);
  }
  purchaseOrderId = createRes.body.data._id;

  // Verify stock added (Product stock was 50, now should be 60 because status is Completed)
  const productRes = await makeRequest(`${BASE_URL}/products`, 'GET', {
    'Authorization': `Bearer ${businessAdminToken}`,
  });
  const testedProduct = productRes.body.data.find(p => p._id === productId);
  if (!testedProduct || testedProduct.stock !== 60) {
    throw new Error(`Purchase order stock increment logic failed. Expected 60 stock, got: ${testedProduct ? testedProduct.stock : 'null'}`);
  }

  // Verify supplier outstanding balance updated (Expected 4500)
  const supplierRes = await makeRequest(`${BASE_URL}/suppliers`, 'GET', {
    'Authorization': `Bearer ${businessAdminToken}`,
  });
  const testedSupplier = supplierRes.body.data.find(s => s._id === supplierId);
  if (!testedSupplier || testedSupplier.outstandingBalance !== 4500) {
    throw new Error(`Supplier balance accumulation logic failed. Expected 4500, got: ${testedSupplier ? testedSupplier.outstandingBalance : 'null'}`);
  }

  console.log('   ✓ Purchase Order creation, completed-status stock addition, and Supplier Balance accumulation verified.');
});

test('12. Customer Loyalty & Settle Balance', async () => {
  // Create
  const createRes = await makeRequest(`${BASE_URL}/customers`, 'POST', {
    'Authorization': `Bearer ${businessAdminToken}`,
  }, {
    name: 'Jane Doe',
    email: `jane_${Date.now()}@example.com`,
    phone: `911000${Math.floor(1000 + Math.random() * 9000)}`,
  });
  if (createRes.status !== 201 || !createRes.body.success) {
    throw new Error(`Create Customer failed. Status: ${createRes.status}`);
  }
  customerId = createRes.body.data._id;

  // Update totalSpent manually to verify tier calculation
  const updateRes1 = await makeRequest(`${BASE_URL}/customers/${customerId}`, 'PUT', {
    'Authorization': `Bearer ${businessAdminToken}`,
  }, {
    totalSpent: 30000, // Should trigger tier -> Gold
  });
  if (updateRes1.status !== 200 || updateRes1.body.data.tier !== 'Gold') {
    throw new Error(`Customer loyalty tier pre-save hooks failed. Tier: ${updateRes1.body.data.tier}`);
  }

  // Set initial outstanding balance
  const updateRes2 = await makeRequest(`${BASE_URL}/customers/${customerId}`, 'PUT', {
    'Authorization': `Bearer ${businessAdminToken}`,
  }, {
    outstandingBalance: 5000,
  });

  // Settle Customer Balance
  const settleRes = await makeRequest(`${BASE_URL}/customers/${customerId}/settle`, 'PUT', {
    'Authorization': `Bearer ${businessAdminToken}`,
  }, {
    amount: 3500, // Should leave 1500 outstanding
  });
  if (settleRes.status !== 200 || settleRes.body.data.outstandingBalance !== 1500) {
    throw new Error(`Customer settle outstanding balance API failed. Outstanding: ${settleRes.body.data.outstandingBalance}`);
  }

  console.log('   ✓ Customer loyalty tier calculation and settle endpoint verified.');
});

test('13. Employee & Commission Disbursal', async () => {
  // Create
  const createRes = await makeRequest(`${BASE_URL}/employees`, 'POST', {
    'Authorization': `Bearer ${businessAdminToken}`,
  }, {
    name: 'Alice Employee',
    role: 'Salesperson',
    phone: `922000${Math.floor(1000 + Math.random() * 9000)}`,
    salary: 15000,
    shift: 'Full-Day',
  });
  if (createRes.status !== 201 || !createRes.body.success) {
    throw new Error(`Create Employee failed. Status: ${createRes.status}`);
  }
  employeeId = createRes.body.data._id;

  // Update commission manually
  const updateRes = await makeRequest(`${BASE_URL}/employees/${employeeId}`, 'PUT', {
    'Authorization': `Bearer ${businessAdminToken}`,
  }, {
    commissionEarned: 2000,
  });
  if (updateRes.status !== 200 || updateRes.body.data.commissionEarned !== 2000) {
    throw new Error('Update Employee commission failed.');
  }

  // Disburse commission
  const disburseRes = await makeRequest(`${BASE_URL}/employees/${employeeId}/disburse`, 'PUT', {
    'Authorization': `Bearer ${businessAdminToken}`,
  }, {
    amount: 1500, // leaves 500
  });
  if (disburseRes.status !== 200 || disburseRes.body.data.commissionEarned !== 500) {
    throw new Error(`Disburse employee commission failed. Commission left: ${disburseRes.body.data.commissionEarned}`);
  }

  console.log('   ✓ Employee CRUD and disburse commissions verified.');
});

test('14. Downstream Invoice Logic (Stock, CRM, Employee Commission)', async () => {
  // Product stock was 60. Customer outstandingBalance was 1500. Employee commission was 500.
  // We create an invoice with total: 10000. paymentMethod: 'Credit', amountPaid: 0.
  const createRes = await makeRequest(`${BASE_URL}/invoices`, 'POST', {
    'Authorization': `Bearer ${businessAdminToken}`,
  }, {
    customerId: customerId,
    customerName: 'Jane Doe',
    employeeId: employeeId,
    items: [
      {
        productId: productId,
        name: 'Denim Shirt',
        sku: 'DS-M',
        quantity: 5,
        price: 2000,
        totalPrice: 10000,
      }
    ],
    subTotal: 10000,
    grandTotal: 10000,
    paymentMethod: 'Credit',
    amountPaid: 0,
  });

  if (createRes.status !== 201 || !createRes.body.success) {
    throw new Error(`Create Invoice failed. Status: ${createRes.status}, Body: ${JSON.stringify(createRes.body)}`);
  }

  // 1. Verify Product Stock decremented (60 - 5 = 55)
  const productRes = await makeRequest(`${BASE_URL}/products`, 'GET', {
    'Authorization': `Bearer ${businessAdminToken}`,
  });
  const testedProduct = productRes.body.data.find(p => p._id === productId);
  if (!testedProduct || testedProduct.stock !== 55) {
    throw new Error(`Invoice stock decrement failed. Expected 55, got: ${testedProduct ? testedProduct.stock : 'null'}`);
  }

  // 2. Verify Customer Outstanding Balance increased (1500 + 10000 = 11500)
  // Verify loyaltyPoints added (5% of 10000 = 500 points added to initial 0 = 500)
  // Verify totalSpent updated (+10000 = 30000 + 10000 = 40000)
  const customerRes = await makeRequest(`${BASE_URL}/customers`, 'GET', {
    'Authorization': `Bearer ${businessAdminToken}`,
  });
  const testedCustomer = customerRes.body.data.find(c => c._id === customerId);
  if (!testedCustomer || testedCustomer.outstandingBalance !== 11500 || testedCustomer.loyaltyPoints < 500 || testedCustomer.totalSpent !== 40000) {
    throw new Error(`Invoice customer financials update failed. Outstanding: ${testedCustomer ? testedCustomer.outstandingBalance : 'null'}, Loyalty: ${testedCustomer ? testedCustomer.loyaltyPoints : 'null'}`);
  }

  // 3. Verify Employee Commission increased (2% of 10000 = 200 commission added to initial 500 = 700)
  const employeeRes = await makeRequest(`${BASE_URL}/employees`, 'GET', {
    'Authorization': `Bearer ${businessAdminToken}`,
  });
  const testedEmployee = employeeRes.body.data.find(e => e._id === employeeId);
  if (!testedEmployee || testedEmployee.commissionEarned !== 700) {
    throw new Error(`Invoice employee commission calculation failed. Expected 700, got: ${testedEmployee ? testedEmployee.commissionEarned : 'null'}`);
  }

  console.log('   ✓ Downstream invoice billing logic verified (Stock decrement, customer loyalty & outstanding accumulation, employee commission calculation).');
});

test('15. Support Tickets', async () => {
  // Create ticket
  const createRes = await makeRequest(`${BASE_URL}/tickets`, 'POST', {
    'Authorization': `Bearer ${businessAdminToken}`,
  }, {
    subject: 'Billing system calculation error',
    description: 'We are seeing some minor rounding error in GST calculations.',
    priority: 'Medium',
  });
  if (createRes.status !== 201 || !createRes.body.success) {
    throw new Error(`Create support ticket failed. Status: ${createRes.status}`);
  }
  ticketId = createRes.body.data._id;

  // Verify compound index ticket format uniqueness
  if (!createRes.body.data.ticketId.startsWith('TKT-')) {
    throw new Error(`Ticket ID validation pre-save format error: ${createRes.body.data.ticketId}`);
  }

  // Resolve Ticket
  const resolveRes = await makeRequest(`${BASE_URL}/tickets/${ticketId}/resolve`, 'PUT', {
    'Authorization': `Bearer ${businessAdminToken}`,
  });
  if (resolveRes.status !== 200 || resolveRes.body.data.status !== 'Resolved') {
    throw new Error(`Resolve ticket API failed. Status: ${resolveRes.body.data.status}`);
  }
  console.log(`   ✓ Support ticket CRUD and custom index formats verified.`);
});

test('16. Notifications', async () => {
  // Get notifications
  const readRes = await makeRequest(`${BASE_URL}/notifications`, 'GET', {
    'Authorization': `Bearer ${businessAdminToken}`,
  });
  if (readRes.status !== 200 || !readRes.body.success) {
    throw new Error('Get notifications failed.');
  }

  console.log(`   ✓ Active notifications fetch verified. Found ${readRes.body.data.length} notifications.`);
});

test('17. Expense CRUD', async () => {
  // Create
  const createRes = await makeRequest(`${BASE_URL}/expenses`, 'POST', {
    'Authorization': `Bearer ${businessAdminToken}`,
  }, {
    category: 'Utilities',
    amount: 1500,
    description: 'Electricity bill payment for July',
    paymentMethod: 'UPI',
  });
  if (createRes.status !== 201 || !createRes.body.success) {
    throw new Error(`Create Expense failed. Status: ${createRes.status}`);
  }
  expenseId = createRes.body.data._id;

  // Read
  const readRes = await makeRequest(`${BASE_URL}/expenses`, 'GET', {
    'Authorization': `Bearer ${businessAdminToken}`,
  });
  if (readRes.status !== 200 || readRes.body.count === 0) {
    throw new Error('Read Expenses failed.');
  }

  // Update
  const updateRes = await makeRequest(`${BASE_URL}/expenses/${expenseId}`, 'PUT', {
    'Authorization': `Bearer ${businessAdminToken}`,
  }, {
    amount: 1750,
  });
  if (updateRes.status !== 200 || updateRes.body.data.amount !== 1750) {
    throw new Error('Update Expense failed.');
  }

  // Delete
  const deleteRes = await makeRequest(`${BASE_URL}/expenses/${expenseId}`, 'DELETE', {
    'Authorization': `Bearer ${businessAdminToken}`,
  });
  if (deleteRes.status !== 200) {
    throw new Error('Delete Expense failed.');
  }

  console.log('   ✓ Expense CRUD verified.');
});

// --------------------- RUN RUN RUN ---------------------

async function runTests() {
  console.log('\n======================================================');
  console.log('   STARTING VASTRAERP INTEGRATION TEST RUNNER');
  console.log('======================================================\n');

  let successCount = 0;
  let failureCount = 0;

  for (const t of tests) {
    console.log(`[TEST] Running: ${t.name}`);
    try {
      await t.fn();
      successCount++;
    } catch (e) {
      console.error(`[ERROR] Test "${t.name}" failed:`);
      console.error(e);
      failureCount++;
      break; // Stop execution on first failure to debug easily
    }
  }

  console.log('\n======================================================');
  console.log('   TEST RUN SUMMARY');
  console.log('======================================================');
  console.log(`   Total Tests : ${tests.length}`);
  console.log(`   Passed      : ${successCount}`);
  console.log(`   Failed      : ${failureCount}`);
  console.log('======================================================\n');

  process.exit(failureCount > 0 ? 1 : 0);
}

runTests();
