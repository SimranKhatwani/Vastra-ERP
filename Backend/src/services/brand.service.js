const BaseRepository = require('../repositories/BaseRepository');
const Brand = require('../models/masters/Brand');

class BrandService {
  static async createBrand(data, tenantId) {
    const repo = new BaseRepository(Brand);
    return repo.create({ ...data, tenantId }, tenantId);
  }

  static async getBrands(query = {}, tenantId) {
    const repo = new BaseRepository(Brand);
    const filter = { tenantId };
    if (query.isActive) filter.isActive = query.isActive === 'true';
    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [{ name: regex }, { code: regex }];
    }
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;
    const items = await Brand.find(filter).skip(skip).limit(limit);
    const total = await Brand.countDocuments(filter);
    return { items, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  static async getBrandById(id, tenantId) {
    const repo = new BaseRepository(Brand);
    return repo.findById(id, tenantId);
  }

  static async updateBrand(id, data, tenantId) {
    const repo = new BaseRepository(Brand);
    return repo.update(id, data, tenantId);
  }

  static async deleteBrand(id, userId, tenantId) {
    const repo = new BaseRepository(Brand);
    return repo.softDelete(id, userId, tenantId);
  }
}

module.exports = BrandService;
