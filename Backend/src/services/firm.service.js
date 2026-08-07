const BaseRepository = require('../repositories/BaseRepository');
const Firm = require('../models/masters/Firm');

class FirmService {
  static async createFirm(data, tenantId) {
    const repo = new BaseRepository(Firm);
    return repo.create({ ...data, tenantId }, tenantId);
  }

  static async getFirms(query = {}, tenantId) {
    const filter = { tenantId };
    if (query.isActive) filter.isActive = query.isActive === 'true';
    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [{ name: regex }, { code: regex }];
    }
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;
    const items = await Firm.find(filter).skip(skip).limit(limit);
    const total = await Firm.countDocuments(filter);
    return { items, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  static async getFirmById(id, tenantId) {
    const repo = new BaseRepository(Firm);
    return repo.findById(id, tenantId);
  }

  static async updateFirm(id, data, tenantId) {
    const repo = new BaseRepository(Firm);
    return repo.update(id, data, tenantId);
  }

  static async deleteFirm(id, userId, tenantId) {
    const repo = new BaseRepository(Firm);
    return repo.softDelete(id, userId, tenantId);
  }
}

module.exports = FirmService;
