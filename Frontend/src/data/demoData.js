// Helper to generate deterministic-looking random numbers based on a seed
function createRandom(seedValue) {
  let s = seedValue;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const random = createRandom(42);

// Raw categories & styles
const categories = [
  "Casual Shirts",
  "Formal Shirts",
  "Trousers",
  "Chinos",
  "Denim Jeans",
  "Kurtas & Kurtis",
  "Sarees",
  "Salwar Suits",
  "Ethnic Wear",
  "Suits & Blazers",
  "Winter Jackets",
  "Hoodies & Sweatshirts",
  "T-Shirts",
  "Polos",
  "Activewear Shorts",
  "Track Pants",
  "Athletic Tees",
  "Maternity Wear",
  "Kids Frocks",
  "Kids Rompers",
];

const brands = [
  "Raymond",
  "Allen Solly",
  "Zara",
  "Levis",
  "Biba",
  "Manyavar",
  "Fabindia",
  "Blackberrys",
  "Peter England",
  "H&M",
  "Louis Philippe",
  "Van Heusen",
  "Wrangler",
  "Tommy Hilfiger",
  "Calvin Klein",
];

const colors = [
  "Crimson Red",
  "Royal Blue",
  "Forest Green",
  "Emerald",
  "Midnight Black",
  "Classic White",
  "Charcoal Gray",
  "Navy Blue",
  "Mustard Yellow",
  "Beige",
  "Olive Drab",
  "Peach",
  "Teal",
  "Burgundy",
  "Ivory Cream",
  "Khaki",
];

const sizes = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];

const fabrics = [
  "Egyptian Cotton",
  "Pure Linen",
  "Mulberry Silk",
  "Denim",
  "Merino Wool",
  "Viscose Rayon",
  "Polyester Blend",
  "Satin Silk",
  "Cashmere",
  "Georgette",
];

const patterns = [
  "Solid Plain",
  "Classic Stripes",
  "Windowpane Checks",
  "Plaid",
  "Floral Print",
  "Geometric Patterns",
  "Self-Weave textured",
  "Polka Dots",
  "Jacquard",
];

const sleeveTypes = [
  "Full Sleeves",
  "Half Sleeves",
  "Sleeveless",
  "Three-Quarter",
];
const neckTypes = [
  "Collar",
  "Crew Neck",
  "V-Neck",
  "Mandarin Collar",
  "Boat Neck",
  "Henley",
];

// Dynamic Generators
export const generateDemoProducts = () => {
  const prds = [];
  const prodRandom = createRandom(101);

  for (let i = 1; i <= 300; i++) {
    const category = categories[Math.floor(prodRandom() * categories.length)];
    const brand = brands[Math.floor(prodRandom() * brands.length)];
    const color = colors[Math.floor(prodRandom() * colors.length)];
    const size = sizes[Math.floor(prodRandom() * sizes.length)];
    const fabric = fabrics[Math.floor(prodRandom() * fabrics.length)];

    const gender = prodRandom() > 0.5 ? "Men" : "Women";
    const name = `${brand} ${gender}'s ${category} - ${color} (${fabric})`;

    const sku = `${brand.substring(0, 3).toUpperCase()}-${category.substring(0, 3).toUpperCase()}-${size}-${1000 + i}`;
    const barcode = `890${String(100000000 + i)}`;

    const purchasePrice = Math.floor(prodRandom() * 2000) + 350; // 350 to 2350
    const mrp = Math.floor(purchasePrice * (1.8 + prodRandom() * 1.2)); // MRP double or triple
    const sellingPrice = Math.floor(mrp * 0.9); // 10% off MRP

    const gstPercent = prodRandom() > 0.4 ? 12 : prodRandom() > 0.5 ? 5 : 18;
    const stock = Math.floor(prodRandom() * 150);
    const minStockAlert = Math.floor(prodRandom() * 20) + 10;

    let status = "In Stock";
    if (stock === 0) status = "Out of Stock";
    else if (stock <= minStockAlert) status = "Low Stock";

    prds.push({
      id: `p-${i}`,
      name,
      category,
      brand,
      sku,
      barcode,
      color,
      size,
      purchasePrice,
      sellingPrice,
      mrp,
      gstPercent,
      stock,
      minStockAlert,
      status,
      description: `Premium quality ${gender.toLowerCase()}'s ${category.toLowerCase()} by ${brand}. Fabricated from ${fabric.toLowerCase()} with a ${color.toLowerCase()} shade. Perfect for all seasons.`,
    });
  }
  return prds;
};

export const generateDemoCustomers = () => {
  const custs = [];
  const names = [
    "Aditya Sharma",
    "Aarav Patel",
    "Neha Gupta",
    "Priyanka Sen",
    "Rahul Verma",
    "Simran Kaur",
    "Amit Trivedi",
    "Karan Johar",
    "Deepika Padukone",
    "Ananya Panday",
    "Rajesh Kumar",
    "Vikram Seth",
    "Sneha Reddy",
    "Vijay Devarkonda",
    "Siddharth Roy",
    "Ishita Roy",
    "Tanmay Bhat",
    "Nikhil Kamath",
    "Kunal Shah",
    "Ritesh Agarwal",
    "Arjun Kapoor",
    "Sanjay Dutt",
    "Shraddha Kapoor",
    "Kiara Advani",
    "Varun Dhawan",
    "Ranbir Kapoor",
    "Alia Bhatt",
    "Kriti Sanon",
    "Ayushmann Khurrana",
    "Rajkummar Rao",
    "Bhumi Pednekar",
    "Pankaj Tripathi",
    "Manoj Bajpayee",
    "Nawazuddin Siddiqui",
    "Radhika Apte",
    "Sushmita Sen",
    "Lara Dutta",
    "Zeenat Aman",
    "Rekha Ganesan",
    "Hema Malini",
    "Jaya Bachchan",
    "Rishi Kapoor",
    "Shashi Kapoor",
    "Dev Anand",
    "Dilip Kumar",
    "Sunil Dutt",
    "Madhubala",
    "Meena Kumari",
    "Nargis Dutt",
    "Nutans Bahl",
  ];

  const custRandom = createRandom(202);

  for (let i = 1; i <= 50; i++) {
    const name = names[i - 1] || `Customer ${i}`;
    const phone = `${9000000000 + Math.floor(custRandom() * 999999999)}`;
    const email = `${name.toLowerCase().replace(/\s+/g, "")}@gmail.com`;
    const membership =
      custRandom() > 0.85
        ? "Platinum"
        : custRandom() > 0.6
          ? "Gold"
          : custRandom() > 0.3
            ? "Silver"
            : "Bronze";
    const walletBalance =
      custRandom() > 0.7 ? Math.floor(custRandom() * 2500) : 0;
    const loyaltyPoints = Math.floor(custRandom() * 1500) + 50;
    const birthdayMonth = String(Math.floor(custRandom() * 12) + 1).padStart(
      2,
      "0",
    );
    // Set a few birthdays to 28 or 29 June for reminders
    const birthdayDay =
      i % 10 === 0
        ? "28"
        : String(Math.floor(custRandom() * 28) + 1).padStart(2, "0");
    const birthday = `1990-${birthdayMonth}-${birthdayDay}`;

    const totalInvoices = Math.floor(custRandom() * 25) + 1;
    const totalSpent = Math.floor(totalInvoices * (custRandom() * 3000 + 1500));
    const outstandingBalance =
      custRandom() > 0.8 ? Math.floor(custRandom() * 8000) : 0;

    custs.push({
      id: `c-${i}`,
      name,
      phone,
      email,
      outstandingBalance,
      membership,
      walletBalance,
      loyaltyPoints,
      birthday,
      createdAt: "2025-01-15",
      totalInvoices,
      totalSpent,
    });
  }
  return custs;
};

export const generateDemoSuppliers = () => {
  const sups = [];
  const supplierNames = [
    "Aura Textile Mills",
    "Vardhman Fabrics",
    "Indo Count Industries",
    "Arvind Ltd",
    "Raymond Weaving Unit",
    "Pratibha Syntex",
    "Grasim Industries",
    "Sutlej Textiles",
    "Welspun Wholesalers",
    "Bombay Dyeing Corp",
    "Alok Industries Ltd",
    "Page Garment Suppliers",
    "Filatex India",
    "Sangam India Ltd",
    "Nahar Spinning Mills",
    "Nitix Textiles",
    "LNJ Bhilwara Group",
    "Rupa & Co Distributors",
    "Dollar Industries Ltd",
    "Lux Cozi Wholesalers",
  ];

  const supRandom = createRandom(303);

  for (let i = 1; i <= 20; i++) {
    const name = supplierNames[i - 1];
    const contactPerson = `Contact ${i}`;
    const phone = `${8000000000 + Math.floor(supRandom() * 1999999999)}`;
    const email = `wholesale@${name.toLowerCase().replace(/[^a-z]/g, "")}.com`;
    const gstin = `27${Array.from({ length: 5 }, () => String.fromCharCode(65 + Math.floor(supRandom() * 26))).join("")}${Math.floor(supRandom() * 9000) + 1000}${String.fromCharCode(65 + Math.floor(supRandom() * 26))}1Z${Math.floor(supRandom() * 9)}`;
    const outstandingBalance =
      supRandom() > 0.5 ? Math.floor(supRandom() * 50000) + 5000 : 0;

    const paymentHistory = [];
    for (let h = 0; h < 3; h++) {
      paymentHistory.push({
        date: `2026-05-${10 + h * 5}`,
        amount: Math.floor(supRandom() * 20000) + 5000,
        method: supRandom() > 0.5 ? "Bank Transfer" : "UPI",
      });
    }

    sups.push({
      id: `s-${i}`,
      name,
      contactPerson,
      phone,
      email,
      gstin,
      outstandingBalance,
      paymentHistory,
      totalOrders: Math.floor(supRandom() * 30) + 5,
      status: supRandom() > 0.9 ? "Inactive" : "Active",
    });
  }
  return sups;
};

export const generateDemoEmployees = () => {
  const emps = [];
  const empNames = [
    "Vijay Shekhar",
    "Richa Chadha",
    "Sachin Pilot",
    "Milind Soman",
    "Sania Mirza",
    "Abhishek Bachchan",
    "Bobby Deol",
    "Suniel Shetty",
    "Jackie Shroff",
    "Govinda Ahuja",
    "Karishma Kapoor",
    "Raveena Tandon",
    "Urmila Matondkar",
    "Tabu Naidu",
    "Kajol Devgan",
    "Zoya Akhtar",
    "Farhan Akhtar",
    "Karan Johar",
    "Zakir Khan",
    "Kanan Gill",
    "Kenny Sebastian",
    "Biswa Kalyan",
    "Abish Mathew",
    "Samay Raina",
    "Munawar Faruqui",
  ];

  const roles = [
    "Manager",
    "Cashier",
    "Salesperson",
    "Tailor",
    "Salesperson",
    "Cashier",
    "Salesperson",
    "Tailor",
  ];

  const empRandom = createRandom(404);

  for (let i = 1; i <= 25; i++) {
    const name = empNames[i - 1];
    const email = `${name.toLowerCase().replace(/\s+/g, "")}@garmentflow.com`;
    const phone = `${7000000000 + Math.floor(empRandom() * 2999999999)}`;
    // Employee 1 is Admin
    const role = i === 1 ? "Admin" : roles[i % roles.length];
    const status = empRandom() > 0.95 ? "Inactive" : "Active";
    const attendanceRate = Math.floor(empRandom() * 15) + 85; // 85% to 100%
    const salary =
      role === "Admin"
        ? 85000
        : role === "Manager"
          ? 45000
          : role === "Tailor"
            ? 22000
            : 18000;
    const commissionRate =
      role === "Salesperson" ? 2 : role === "Tailor" ? 5 : 0;
    const monthlySales =
      role === "Salesperson" ? Math.floor(empRandom() * 250000) + 100000 : 0;
    const salesTarget = role === "Salesperson" ? 300000 : 0;
    const commissionEarned = Math.floor(monthlySales * (commissionRate / 100));
    const leavesRemaining = Math.floor(empRandom() * 10) + 2;

    emps.push({
      id: `e-${i}`,
      name,
      email,
      phone,
      role,
      status,
      attendanceRate,
      salary,
      commissionEarned,
      commissionRate,
      monthlySales,
      salesTarget,
      leavesRemaining,
    });
  }
  return emps;
};

// Generates 100 POs
export const generateDemoPurchaseOrders = (suppliers, products) => {
  const pos = [];
  const poRandom = createRandom(505);

  for (let i = 1; i <= 100; i++) {
    const supplier = suppliers[Math.floor(poRandom() * suppliers.length)];
    const poNo = `PO-${20260000 + i}`;

    // 2 to 5 items
    const itemCount = Math.floor(poRandom() * 4) + 2;
    const items = [];
    let subTotal = 0;

    for (let j = 0; j < itemCount; j++) {
      const product = products[Math.floor(poRandom() * products.length)];
      const quantity = Math.floor(poRandom() * 50) + 10;
      const purchasePrice = product.purchasePrice;
      const totalPrice = quantity * purchasePrice;
      subTotal += totalPrice;

      items.push({
        productId: product.id,
        name: product.name,
        quantity,
        purchasePrice,
        totalPrice,
      });
    }

    const gstTotal = Math.floor(subTotal * 0.12); // Average 12% GST
    const grandTotal = subTotal + gstTotal;
    const status = i < 85 ? "Completed" : "Pending";
    const outstandingPaid =
      status === "Completed"
        ? grandTotal
        : poRandom() > 0.5
          ? Math.floor(grandTotal * 0.5)
          : 0;

    // Dynamic past dates over the last 5 months
    const dateOffsetDays = Math.floor(poRandom() * 150);
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() - dateOffsetDays);
    const dateStr = dateObj.toISOString().split("T")[0];

    pos.push({
      id: `po-${i}`,
      poNo,
      date: dateStr,
      supplierId: supplier.id,
      supplierName: supplier.name,
      items,
      subTotal,
      gstTotal,
      grandTotal,
      status,
      outstandingPaid,
    });
  }

  // Sort descending by date
  return pos.sort((a, b) => b.date.localeCompare(a.date));
};

// Generates 500 Invoices
export const generateDemoInvoices = (customers, products, employees) => {
  const invs = [];
  const invRandom = createRandom(606);
  const salespeople = employees.filter(
    (e) =>
      e.role === "Salesperson" || e.role === "Cashier" || e.role === "Admin",
  );

  for (let i = 1; i <= 500; i++) {
    const customer = customers[Math.floor(invRandom() * customers.length)];
    const employee =
      salespeople[Math.floor(invRandom() * salespeople.length)] || employees[0];
    const invoiceNo = `INV-${20260000 + i}`;

    // 1 to 4 items
    const itemCount = Math.floor(invRandom() * 4) + 1;
    const items = [];
    let subTotal = 0;
    let discountTotal = 0;
    let gstTotal = 0;

    for (let j = 0; j < itemCount; j++) {
      const product = products[Math.floor(invRandom() * products.length)];
      const quantity = Math.floor(invRandom() * 3) + 1;
      const price = product.sellingPrice;
      const discount = invRandom() > 0.7 ? Math.floor(invRandom() * 15) : 0; // 0 to 15% discount
      const discountAmount = Math.floor(price * (discount / 100)) * quantity;
      const itemGst = Math.floor(
        (price * quantity - discountAmount) * (product.gstPercent / 100),
      );

      const totalPrice = price * quantity - discountAmount + itemGst;

      subTotal += price * quantity;
      discountTotal += discountAmount;
      gstTotal += itemGst;

      items.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        size: product.size,
        color: product.color,
        quantity,
        price,
        discount,
        gstPercent: product.gstPercent,
        totalPrice,
      });
    }

    const couponCodes = [
      "FESTIVE15",
      "WINTER20",
      "EID25",
      "DIWALI10",
      "LOYALTY50",
    ];
    const couponCode =
      invRandom() > 0.85
        ? couponCodes[Math.floor(invRandom() * couponCodes.length)]
        : undefined;
    const couponDiscount = couponCode
      ? couponCode === "LOYALTY50"
        ? 500
        : Math.floor(subTotal * 0.1)
      : 0;

    const grandTotal = Math.max(
      100,
      subTotal - discountTotal - couponDiscount + gstTotal,
    );
    const paymentMethods = ["Cash", "Card", "UPI", "Wallet", "Credit", "Split"];
    let paymentMethod =
      paymentMethods[Math.floor(invRandom() * paymentMethods.length)];
    if (customer.id === "c-1" && paymentMethod === "Credit") {
      // Keep credit sales distributed
    }
    let splitPayments = [];
    if (paymentMethod === "Split") {
      const uUPI = Math.floor(grandTotal * 0.6);
      splitPayments = [
        { method: "UPI", amount: uUPI },
        { method: "Cash", amount: grandTotal - uUPI },
      ];
    }

    const status = paymentMethod === "Credit" ? "Unpaid" : "Paid";

    // Dates distributed over previous 180 days (6 months)
    const dateOffsetDays = Math.floor(invRandom() * 180);
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() - dateOffsetDays);
    const dateStr = dateObj.toISOString().split("T")[0];

    invs.push({
      id: `inv-${i}`,
      invoiceNo,
      date: dateStr,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      items,
      subTotal,
      discountTotal: discountTotal + couponDiscount,
      couponCode,
      couponDiscount,
      gstTotal,
      grandTotal,
      paymentMethod,
      splitPayments: splitPayments.length > 0 ? splitPayments : undefined,
      status,
      employeeId: employee.id,
      employeeName: employee.name,
    });
  }

  // Sort descending by date
  return invs.sort((a, b) => b.date.localeCompare(a.date));
};

export const generateExpenses = () => {
  const exp = [];
  const expRandom = createRandom(707);
  const categories = [
    ["Rent", "Electricity", "Salaries", "Marketing", "Logistics", "Misc"],
  ];

  // Generate 50 expenses
  for (let i = 1; i <= 50; i++) {
    const catList = categories[0];
    const category = catList[Math.floor(expRandom() * catList.length)];
    const amount =
      category === "Rent"
        ? 65000
        : category === "Salaries"
          ? 120000
          : category === "Electricity"
            ? 12000
            : Math.floor(expRandom() * 8000) + 1500;
    const description = `${category} expenses for retail operations`;
    const paymentMethod = expRandom() > 0.4 ? "Bank Transfer" : "UPI";

    const dateOffsetDays = Math.floor(expRandom() * 120);
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() - dateOffsetDays);
    const dateStr = dateObj.toISOString().split("T")[0];

    exp.push({
      id: `exp-${i}`,
      date: dateStr,
      category,
      amount,
      description,
      paymentMethod,
    });
  }
  return exp.sort((a, b) => b.date.localeCompare(a.date));
};

export const generateSaaSTenants = () => {
  return [
    {
      id: "t-1",
      name: "Ziva Fashion Boutique",
      email: "billing@ziva.com",
      plan: "Enterprise",
      status: "Active",
      createdAt: "2024-05-10",
      joinedDate: "May 10, 2024",
      activeUsers: 14,
      storageUsed: "4.2 GB",
      apiCalls: 125400,
      billingCycle: "Annual",
    },
    {
      id: "t-2",
      name: "Raymond Retail - Bandra",
      email: "bandra@raymondstore.com",
      plan: "Enterprise",
      status: "Active",
      createdAt: "2024-08-15",
      joinedDate: "Aug 15, 2024",
      activeUsers: 25,
      storageUsed: "8.1 GB",
      apiCalls: 340900,
      billingCycle: "Annual",
    },
    {
      id: "t-3",
      name: "Biba Ethnic Outlet 12",
      email: "outlet12@biba.in",
      plan: "Professional",
      status: "Active",
      createdAt: "2024-11-01",
      joinedDate: "Nov 01, 2024",
      activeUsers: 8,
      storageUsed: "2.5 GB",
      apiCalls: 84000,
      billingCycle: "Monthly",
    },
    {
      id: "t-4",
      name: "Trendz Apparel Wholesalers",
      email: "contact@trendzwholesale.com",
      plan: "Professional",
      status: "Active",
      createdAt: "2025-01-20",
      joinedDate: "Jan 20, 2025",
      activeUsers: 10,
      storageUsed: "5.6 GB",
      apiCalls: 195000,
      billingCycle: "Monthly",
    },
    {
      id: "t-5",
      name: "Little Buds Kidswear",
      email: "info@littlebuds.com",
      plan: "Starter",
      status: "Active",
      createdAt: "2025-03-05",
      joinedDate: "Mar 05, 2025",
      activeUsers: 3,
      storageUsed: "512 MB",
      apiCalls: 18000,
      billingCycle: "Monthly",
    },
    {
      id: "t-6",
      name: "Studio Threads & Tailoring",
      email: "tailorstudio@gmail.com",
      plan: "Trial",
      status: "Active",
      createdAt: "2026-06-15",
      joinedDate: "Jun 15, 2026",
      activeUsers: 2,
      storageUsed: "120 MB",
      apiCalls: 4500,
      billingCycle: "Monthly",
    },
    {
      id: "t-7",
      name: "Urban Gent Menswear",
      email: "ops@urbangent.com",
      plan: "Starter",
      status: "Suspended",
      createdAt: "2025-02-14",
      joinedDate: "Feb 14, 2025",
      activeUsers: 0,
      storageUsed: "800 MB",
      apiCalls: 0,
      billingCycle: "Monthly",
      outstandingInvoice: 49,
    },
  ];
};

export const generateIntegrations = () => {
  return [
    {
      id: "int-1",
      name: "Razorpay PG",
      category: "Payment Gateway",
      description:
        "Enables quick UPI, credit cards, net banking, and wallets at POS terminals.",
      status: "Connected",
      commissionPercent: 1.8,
      revenueGenerated: 4254000,
    },
    {
      id: "int-2",
      name: "Stripe Global",
      category: "Payment Gateway",
      description:
        "Power multi-currency, credit cards, and Apple Pay checkout sequences.",
      status: "Disconnected",
      commissionPercent: 2.9,
      revenueGenerated: 0,
    },
    {
      id: "int-3",
      name: "Delhivery Shipping",
      category: "Shipping & Logistics",
      description:
        "Generate automatic shipping labels, waybills, and real-time transit telemetry.",
      status: "Connected",
      commissionPercent: 5.0,
      revenueGenerated: 840000,
    },
    {
      id: "int-4",
      name: "Shiprocket Pro",
      category: "Shipping & Logistics",
      description:
        "Integrate multi-carrier logistics intelligence into wholesale shipments.",
      status: "Connected",
      commissionPercent: 4.5,
      revenueGenerated: 1250000,
    },
    {
      id: "int-5",
      name: "WhatsApp Business API",
      category: "Communications",
      description:
        "Send automated invoice PDFs, loyalty updates, and birthday alerts to customers.",
      status: "Connected",
      commissionPercent: 0.0,
      revenueGenerated: 0,
    },
    {
      id: "int-6",
      name: "Twilio SMS Gateway",
      category: "Communications",
      description: "Fallback text alerts and POS billing verification codes.",
      status: "Connected",
      commissionPercent: 0.0,
      revenueGenerated: 0,
    },
    {
      id: "int-7",
      name: "Tally Prime sync",
      category: "Accounting ERP",
      description:
        "Bidirectional sync of vouchers, ledger accounts, and tax books.",
      status: "Connected",
      commissionPercent: 0.0,
      revenueGenerated: 0,
    },
    {
      id: "int-8",
      name: "Shopify Store Connect",
      category: "E-commerce Connector",
      description:
        "Auto-sync inventory, orders, product variants, and price catalog changes.",
      status: "Connected",
      commissionPercent: 2.0,
      revenueGenerated: 1850000,
    },
    {
      id: "int-9",
      name: "WooCommerce Bridge",
      category: "E-commerce Connector",
      description: "Sync products and process checkout receipts.",
      status: "Disconnected",
      commissionPercent: 1.5,
      revenueGenerated: 0,
    },
    {
      id: "int-10",
      name: "Epson POS Printers",
      category: "POS Hardwares",
      description:
        "Raw thermal print engine integrations and ESC/POS drawer support.",
      status: "Connected",
      commissionPercent: 0.0,
      revenueGenerated: 0,
    },
  ];
};

export const generateAPIKeys = () => {
  return [
    {
      id: "k-1",
      name: "Shopify Sync Server",
      key: "gf_live_8f3d...8e82",
      createdAt: "2026-01-10",
      lastUsed: "2026-06-28 22:05:14",
      status: "Active",
      rateLimit: 600,
    },
    {
      id: "k-2",
      name: "Delhivery Shipping Hook",
      key: "gf_live_2c41...99ef",
      createdAt: "2026-02-14",
      lastUsed: "2026-06-28 21:50:00",
      status: "Active",
      rateLimit: 120,
    },
    {
      id: "k-3",
      name: "Legacy Mobile App",
      key: "gf_live_0a2e...117c",
      createdAt: "2025-05-11",
      lastUsed: "2026-03-12 11:15:32",
      status: "Revoked",
      rateLimit: 60,
    },
  ];
};

export const generateWebhooks = () => {
  return [
    {
      id: "wh-1",
      url: "https://api.zivafashion.com/v1/webhooks/orders",
      events: ["invoice.created", "invoice.returned"],
      status: "Active",
    },
    {
      id: "wh-2",
      url: "https://shipping.delhivery.com/integrations/threadflow",
      events: ["purchase_order.completed"],
      status: "Active",
    },
  ];
};

export const generateAPILogs = () => {
  return [
    {
      id: "al-1",
      timestamp: "2026-06-28 22:11:45",
      method: "POST",
      endpoint: "/v1/invoices",
      statusCode: 201,
      latencyMs: 145,
      ipAddress: "13.233.11.45",
    },
    {
      id: "al-2",
      timestamp: "2026-06-28 22:11:02",
      method: "GET",
      endpoint: "/v1/products/890100000045",
      statusCode: 200,
      latencyMs: 24,
      ipAddress: "13.233.11.45",
    },
    {
      id: "al-3",
      timestamp: "2026-06-28 22:10:14",
      method: "GET",
      endpoint: "/v1/stock/low-alerts",
      statusCode: 200,
      latencyMs: 38,
      ipAddress: "184.21.90.111",
    },
    {
      id: "al-4",
      timestamp: "2026-06-28 22:09:50",
      method: "POST",
      endpoint: "/v1/webhooks/ দিল্লি",
      statusCode: 400,
      latencyMs: 82,
      ipAddress: "103.11.45.22",
    },
    {
      id: "al-5",
      timestamp: "2026-06-28 22:07:33",
      method: "PUT",
      endpoint: "/v1/products/p-12",
      statusCode: 200,
      latencyMs: 110,
      ipAddress: "13.233.11.45",
    },
  ];
};

export const generateAuditLogs = () => {
  return [
    {
      id: "aud-1",
      timestamp: "2026-06-28 22:05:14",
      employeeName: "Vijay Shekhar",
      role: "Admin",
      action: "EXPORT_EXCEL",
      module: "Products",
      details: "Exported active stock catalog containing 200 items.",
    },
    {
      id: "aud-2",
      timestamp: "2026-06-28 21:58:32",
      employeeName: "Richa Chadha",
      role: "Manager",
      action: "UPDATE_PRODUCT",
      module: "Products",
      details:
        'Updated purchase price and SKU for "Zara Men\'s Casual Shirt - Crimson Red".',
    },
    {
      id: "aud-3",
      timestamp: "2026-06-28 20:12:44",
      employeeName: "Sachin Pilot",
      role: "Cashier",
      action: "VOID_INVOICE",
      module: "Billing",
      details: "Voided payment line under INV-20260485 for returning customer.",
    },
    {
      id: "aud-4",
      timestamp: "2026-06-28 19:44:10",
      employeeName: "Milind Soman",
      role: "Salesperson",
      action: "CREATE_INVOICE",
      module: "POS Billing",
      details: "Generated sale INV-20260499 total ₹4,250 via UPI payment.",
    },
    {
      id: "aud-5",
      timestamp: "2026-06-28 17:30:15",
      employeeName: "Vijay Shekhar",
      role: "Admin",
      action: "REGENERATE_API_KEY",
      module: "Developer Portal",
      details: "Regenerated live webhook authentication keys.",
    },
  ];
};

export const generateNotifications = () => {
  return [
    {
      id: "not-1",
      timestamp: "10 mins ago",
      title: "Low Stock Warning",
      message:
        "Raymond Men's Formal Shirt - White (Pure Linen) is below threshold (5 left).",
      type: "warning",
      read: false,
    },
    {
      id: "not-2",
      timestamp: "1 hr ago",
      title: "New PO Auto-Approved",
      message: "Vardhman Fabrics PO-20260100 for ₹1,24,000 sent to dispatch.",
      type: "success",
      read: false,
    },
    {
      id: "not-3",
      timestamp: "3 hrs ago",
      title: "Server Memory Load 88%",
      message: "Cloud Run container scaling limits reaching peak thresholds.",
      type: "danger",
      read: true,
    },
    {
      id: "not-4",
      timestamp: "1 day ago",
      title: "Loyalty Points Campaign Live",
      message: "Broadcasting Gold and Platinum tier special discount codes.",
      type: "info",
      read: true,
    },
  ];
};

export const generateCommissionRecords = () => {
  return [
    {
      id: "com-1",
      partnerName: "Delhivery Integration",
      integration: "Delhivery Shipping",
      commissionPercent: 5,
      revenue: 840000,
      pendingSettlement: 12000,
      paidSettlement: 30000,
      date: "2026-06-28",
    },
    {
      id: "com-2",
      partnerName: "Razorpay Merchant Hub",
      integration: "Razorpay PG",
      commissionPercent: 1.8,
      revenue: 4254000,
      pendingSettlement: 21500,
      paidSettlement: 55000,
      date: "2026-06-25",
    },
    {
      id: "com-3",
      partnerName: "Shopify Partners Program",
      integration: "Shopify Store Connect",
      commissionPercent: 2,
      revenue: 1850000,
      pendingSettlement: 18000,
      paidSettlement: 19000,
      date: "2026-06-20",
    },
    {
      id: "com-4",
      partnerName: "Shiprocket logistics Ltd",
      integration: "Shiprocket Pro",
      commissionPercent: 4.5,
      revenue: 1250000,
      pendingSettlement: 9000,
      paidSettlement: 47250,
      date: "2026-06-18",
    },
  ];
};

export const generateSupportTickets = () => {
  return [
    {
      id: "tk-1",
      tenantName: "Ziva Fashion Boutique",
      subject: "Printer ESC/POS cutting logic failing on Epson TM-T88",
      priority: "High",
      status: "Open",
      date: "2026-06-28",
    },
    {
      id: "tk-2",
      tenantName: "Raymond Retail - Bandra",
      subject: "Double payment synchronization issue with UPI QR codes",
      priority: "Urgent",
      status: "In Progress",
      date: "2026-06-27",
    },
    {
      id: "tk-3",
      tenantName: "Little Buds Kidswear",
      subject:
        "Custom field request: Add birthday field to spreadsheet exporter",
      priority: "Low",
      status: "Resolved",
      date: "2026-06-25",
    },
  ];
};
