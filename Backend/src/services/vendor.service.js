const BaseRepository = require('../repositories/BaseRepository');
const Vendor = require('../models/masters/Vendor');

class VendorService {
  static async createVendor(data, tenantId) {
    const repo = new BaseRepository(Vendor);
    return repo.create({ ...data, tenantId }, tenantId);
  }

  static async getVendors(query = {}, tenantId) {
    const repo = new BaseRepository(Vendor);
    const filter = { tenantId };
    if (query.isActive) filter.isActive = query.isActive === 'true';
    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [{ name: regex }, { companyName: regex }, { email: regex }];
    }
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;
    const items = await Vendor.find(filter).sort({ updatedAt: -1, createdAt: -1 }).skip(skip).limit(limit);
    const total = await Vendor.countDocuments(filter);
    return { items, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  static async getVendorById(id, tenantId) {
    const repo = new BaseRepository(Vendor);
    return repo.findById(id, tenantId);
  }

  static async getVendorHistory(id, tenantId) {
    const PurchaseBill = require('../models/purchase/PurchaseBill');
    const bills = await PurchaseBill.find({ vendorId: id, tenantId, isDeleted: false })
      .sort({ billDate: -1, createdAt: -1 })
      .lean();
    
    const invoices = bills.map(bill => ({
      invoiceNo: bill.billNo,
      date: bill.billDate ? bill.billDate.toISOString().split('T')[0] : bill.createdAt.toISOString().split('T')[0],
      total: bill.totalAmount || 0,
      status: bill.status || 'Completed',
      paymentHistory: bill.paymentHistory || []
    }));

    return { invoices };
  }

  static async updateVendor(id, data, tenantId) {
    const repo = new BaseRepository(Vendor);
    return repo.update(id, data, tenantId);
  }

  static async deleteVendor(id, userId, tenantId) {
    const repo = new BaseRepository(Vendor);
    return repo.softDelete(id, userId, tenantId);
  }
}

module.exports = VendorService;
