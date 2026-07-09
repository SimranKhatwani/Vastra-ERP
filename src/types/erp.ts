export interface Tenant {
  id: string;
  name: string;
  email: string;
  plan: 'Trial' | 'Starter' | 'Professional' | 'Enterprise';
  status: 'Active' | 'Suspended';
  createdAt: string;
  joinedDate: string;
  activeUsers: number;
  storageUsed: string;
  apiCalls: number;
  billingCycle: 'Monthly' | 'Annual';
  outstandingInvoice?: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  sku: string;
  barcode: string;
  color: string;
  size: 'XXS' | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL';
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  gstPercent: number; // 5, 12, 18
  stock: number;
  minStockAlert: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  image?: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
  totalProducts: number;
}

export interface Brand {
  id: string;
  name: string;
  code: string;
  totalProducts: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  outstandingBalance: number;
  membership: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  walletBalance: number;
  loyaltyPoints: number;
  birthday: string;
  createdAt: string;
  totalInvoices: number;
  totalSpent: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  outstandingBalance: number;
  paymentHistory: Array<{ date: string; amount: number; method: string }>;
  totalOrders: number;
  status: 'Active' | 'Inactive';
}

export interface InvoiceItem {
  productId: string;
  name: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  discount: number; // percentage or flat
  gstPercent: number;
  totalPrice: number;
  isCustom?: boolean;
  customDetails?: CustomGarmentDetails;
}

export interface CustomGarmentDetails {
  fabric: string;
  color: string;
  size: string;
  pattern: string;
  sleeveType: string;
  neckType: string;
  embroidery: boolean;
  logoPrinting: boolean;
  alterationCharges: number;
  measurements: {
    chest: number;
    waist: number;
    length: number;
    shoulder: number;
    sleeves: number;
  };
  specialInstructions: string;
  estimatedCost: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: InvoiceItem[];
  subTotal: number;
  discountTotal: number;
  couponCode?: string;
  couponDiscount?: number;
  gstTotal: number;
  grandTotal: number;
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Wallet' | 'Credit' | 'Split';
  splitPayments?: { method: 'Cash' | 'Card' | 'UPI' | 'Wallet'; amount: number }[];
  status: 'Paid' | 'Unpaid' | 'Partially Paid' | 'Returned';
  employeeId: string;
  employeeName: string;
  salespersonName?: string;
}

export interface PurchaseOrderItem {
  productId: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  totalPrice: number;
  fabricCode?: string;
  gsm?: number;
  width?: number;
  color?: string;
  unit?: string;
  taxPercent?: number;
  taxAmount?: number;
  lotId?: string;
}

export interface PurchaseOrder {
  id: string;
  poNo: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  subTotal: number;
  gstTotal: number;
  grandTotal: number;
  status: 'Pending' | 'Completed' | 'Returned';
  outstandingPaid: number;
  invoiceNo?: string;
  invoiceDate?: string;
  isImported?: boolean;
  importSummary?: {
    totalRows: number;
    successRows: number;
    failedRows: number;
    duplicateRows: number;
  };
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Admin' | 'Manager' | 'Cashier' | 'Salesperson' | 'Tailor';
  status: 'Active' | 'Inactive';
  attendanceRate: number; // percentage
  salary: number;
  commissionEarned: number;
  commissionRate: number; // percentage
  monthlySales: number;
  salesTarget: number;
  leavesRemaining: number;
}

export interface Expense {
  id: string;
  date: string;
  category: 'Rent' | 'Electricity' | 'Salaries' | 'Marketing' | 'Logistics' | 'Misc';
  amount: number;
  description: string;
  paymentMethod: string;
}

export interface Income {
  id: string;
  date: string;
  source: string;
  amount: number;
  description: string;
}

export interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'Connected' | 'Disconnected';
  commissionPercent: number;
  revenueGenerated: number;
}

export interface APIKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string;
  status: 'Active' | 'Revoked';
  rateLimit: number; // requests/min
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  status: 'Active' | 'Inactive';
}

export interface APILog {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  statusCode: number;
  latencyMs: number;
  ipAddress: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  employeeName: string;
  role: string;
  action: string;
  module: string;
  details: string;
}

export interface Notification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  read: boolean;
}

export interface CommissionRecord {
  id: string;
  partnerName: string;
  integration: string;
  commissionPercent: number;
  revenue: number;
  pendingSettlement: number;
  paidSettlement: number;
  date: string;
}

export interface SupportTicket {
  id: string;
  tenantName: string;
  subject: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved';
  date: string;
}
