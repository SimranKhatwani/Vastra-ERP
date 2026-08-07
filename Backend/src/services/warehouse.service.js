const BaseRepository = require('../repositories/BaseRepository');
const Warehouse = require('../models/masters/Warehouse');

class WarehouseService {
  static async createWarehouse(data, tenantId) {
    const repo = new BaseRepository(Warehouse);
    return repo.create({ ...data, tenantId }, tenantId);
  }

  static async getWarehouses(query = {}, tenantId) {
    const filter = { tenantId };
    if (query.isActive) filter.isActive = query.isActive === 'true';
    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [{ name: regex }, { code: regex }];
    }
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;
    const items = await Warehouse.find(filter).skip(skip).limit(limit);
    const total = await Warehouse.countDocuments(filter);
    return { items, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  static async getWarehouseById(id, tenantId) {
    const repo = new BaseRepository(Warehouse);
    return repo.findById(id, tenantId);
  }

  static async updateWarehouse(id, data, tenantId) {
    const repo = new BaseRepository(Warehouse);
    return repo.update(id, data, tenantId);
  }

  static async deleteWarehouse(id, userId, tenantId) {
    const repo = new BaseRepository(Warehouse);
    return repo.softDelete(id, userId, tenantId);
  }
}

module.exports = WarehouseService;
