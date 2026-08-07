const BaseRepository = require('../repositories/BaseRepository');
const Category = require('../models/masters/Category');

class CategoryService {
  static async createCategory(data, tenantId) {
    const repo = new BaseRepository(Category);
    return repo.create({ ...data, tenantId }, tenantId);
  }

  static async getCategories(query = {}, tenantId) {
    const filter = { tenantId };
    if (query.isActive) filter.isActive = query.isActive === 'true';
    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [{ name: regex }, { code: regex }];
    }
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;
    const items = await Category.find(filter).skip(skip).limit(limit);
    const total = await Category.countDocuments(filter);
    return { items, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  static async getCategoryById(id, tenantId) {
    const repo = new BaseRepository(Category);
    return repo.findById(id, tenantId);
  }

  static async updateCategory(id, data, tenantId) {
    const repo = new BaseRepository(Category);
    return repo.update(id, data, tenantId);
  }

  static async deleteCategory(id, userId, tenantId) {
    const repo = new BaseRepository(Category);
    return repo.softDelete(id, userId, tenantId);
  }
}

module.exports = CategoryService;
