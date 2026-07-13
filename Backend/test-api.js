require('dotenv').config();

async function run() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessId: "VASTRA-001", email: "admin@vastra.com", password: "password123" })
  });
  const loginData = await loginRes.json();
  if (!loginData.success) {
    console.error("Login failed:", loginData);
    return;
  }
  const token = loginData.token;

  const inv = {
    invoiceNo: "INV-9999999",
    date: "2026-06-28",
    customerName: "Walk-in Customer",
    items: [
      {
        productId: "p-1234",
        name: "Test Shirt",
        quantity: 1,
        price: 100,
        discount: 0,
        gstPercent: 0,
        totalPrice: 100
      }
    ],
    subTotal: 100,
    discountTotal: 0,
    couponDiscount: 0,
    gstTotal: 0,
    grandTotal: 100,
    paymentMethod: "Cash",
    amountPaid: 100,
    status: "Paid",
    employeeId: "e-default" // Maybe this is it!
  };

  const res = await fetch("http://localhost:5000/api/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(inv)
  });
  
  const data = await res.json();
  console.log("Backend response:", JSON.stringify(data, null, 2));
}

run();
