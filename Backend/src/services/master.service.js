const ApiError = require('../helpers/ApiError');
const Brand = require('../models/masters/Brand');
const Category = require('../models/masters/Category');
const SubCategory = require('../models/masters/SubCategory');
const Color = require('../models/masters/Color');
const Size = require('../models/masters/Size');
const HSN = require('../models/masters/HSN');
const GST = require('../models/masters/GST');
const Rack = require('../models/masters/Rack');
const Warehouse = require('../models/masters/Warehouse');
const Firm = require('../models/masters/Firm');
const Vendor = require('../models/masters/Vendor');
const Salesman = require('../models/masters/Salesman');
const BaseRepository = require('../repositories/BaseRepository');
const { formatExportData } = require('../helpers/export.helper');

const getModel = (type) => {
  const models = {
    brand: Brand,
    category: Category,
    subcategory: SubCategory,
    color: Color,
    size: Size,
    hsn: HSN,
    gst: GST,
    rack: Rack,
    warehouse: Warehouse,
    firm: Firm,
    vendor: Vendor,
    salesman: Salesman
  };
  const model = models[type.toLowerCase()];
  if (!model) throw new ApiError(400, `Invalid master entity type: ${type}`);
  return model;
};

class MasterService {
  static async createMaster(type, data, tenantId) {
    const Model = getModel(type);
    const repo = new BaseRepository(Model);

    if (type.toLowerCase() === 'salesman') {
      const User = require('../models/User');
      let user = null;
      if (data.userId) {
        user = await User.findOne({ _id: data.userId, tenantId, isDeleted: false });
      } else {
        user = await User.findOne({
          tenantId,
          isDeleted: false,
          $or: [
            { phone: data.phone },
            { email: data.email },
            { name: data.name }
          ]
        });
      }
      if (user) {
        data.userId = user._id;
        data.designation = user.designation || 'salesperson';
      }
    }

    return repo.create({ ...data, tenantId }, tenantId);
  }

  static async getMasters(type, tenantId, query = {}) {
    const Model = getModel(type);

    if (type.toLowerCase() === 'salesman') {
      const User = require('../models/User');
      // Automatically sync Salesmen with User collection to link userId and sync designation
      const users = await User.find({ tenantId, isDeleted: false }).lean();
      const usersMap = {};
      users.forEach(u => {
        if (u.phone) usersMap[u.phone.trim()] = u;
        if (u.email) usersMap[u.email.toLowerCase().trim()] = u;
        if (u.name) usersMap[u.name.toLowerCase().trim()] = u;
      });

      // Update existing salesmen that don't have designation or userId set
      const unlinkedSalesmen = await Model.find({
        tenantId,
        $or: [{ userId: { $exists: false } }, { userId: null }, { designation: '' }, { designation: { $exists: false } }]
      });

      for (const s of unlinkedSalesmen) {
        const u = (s.phone ? usersMap[s.phone.trim()] : null) ||
                  (s.email ? usersMap[s.email.toLowerCase().trim()] : null) ||
                  (s.name ? usersMap[s.name.toLowerCase().trim()] : null);
        if (u) {
          s.userId = u._id;
          s.designation = u.designation || 'salesperson';
          await s.save();
        }
      }
    }

    const filter = { tenantId };
    if (query.includeDeleted === 'true') {
      // include deleted
    } else {
      filter.isDeleted = false;
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { title: searchRegex },
        { designation: searchRegex }
      ];
    }

    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.warehouseId) filter.warehouseId = query.warehouseId;
    if (query.status) filter.status = query.status;

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const populate = type.toLowerCase() === 'subcategory' 
      ? 'categoryId' 
      : type.toLowerCase() === 'rack' 
      ? 'warehouseId' 
      : type.toLowerCase() === 'salesman' 
      ? 'userId' 
      : '';
    const sortField = query.sort || 'createdAt';
    const sortOrder = query.order === 'asc' ? 1 : -1;

    const items = await Model.find(filter)
      .populate(populate)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total = await Model.countDocuments(filter);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getMasterById(type, id, tenantId) {
    const Model = getModel(type);
    const repo = new BaseRepository(Model);
    const populate = type.toLowerCase() === 'subcategory' 
      ? 'categoryId' 
      : type.toLowerCase() === 'rack' 
      ? 'warehouseId' 
      : type.toLowerCase() === 'salesman' 
      ? 'userId' 
      : '';
    const item = await repo.findById(id, tenantId, { populate });
    if (!item) throw new ApiError(404, `${type} record not found.`);
    return item;
  }

  static async updateMaster(type, id, data, tenantId) {
    const Model = getModel(type);
    const repo = new BaseRepository(Model);

    if (type.toLowerCase() === 'salesman') {
      const User = require('../models/User');
      let user = null;
      if (data.userId) {
        user = await User.findOne({ _id: data.userId, tenantId, isDeleted: false });
      } else {
        user = await User.findOne({
          tenantId,
          isDeleted: false,
          $or: [
            { phone: data.phone },
            { email: data.email },
            { name: data.name }
          ]
        });
      }
      if (user) {
        data.userId = user._id;
        data.designation = user.designation || 'salesperson';
      }
    }

    const item = await repo.update(id, data, tenantId);
    if (!item) throw new ApiError(404, `${type} record not found.`);
    return item;
  }

  static async deleteMaster(type, id, userId, tenantId) {
    const Model = getModel(type);
    const repo = new BaseRepository(Model);
    return repo.softDelete(id, userId, tenantId);
  }

  static async restoreMaster(type, id, tenantId) {
    const Model = getModel(type);
    const item = await Model.findOne({ _id: id, tenantId });
    if (!item) throw new ApiError(404, `${type} record not found.`);
    item.restore();
    return item;
  }

  static async bulkDeleteMasters(type, ids = [], userId, tenantId) {
    const Model = getModel(type);
    const result = await Model.updateMany(
      { _id: { $in: ids }, tenantId },
      { isDeleted: true, deletedAt: new Date(), deletedBy: userId }
    );
    return { count: result.modifiedCount };
  }

  static async bulkUpdateStatus(type, ids = [], isActive, tenantId) {
    const Model = getModel(type);
    const result = await Model.updateMany(
      { _id: { $in: ids }, tenantId },
      { isActive }
    );
    return { modifiedCount: result.modifiedCount };
  }

  static async exportMasters(type, tenantId, query = {}, format = 'csv') {
    const { items } = await this.getMasters(type, tenantId, { ...query, limit: 10000 });
    const cleanData = items.map(item => item.toObject());
    return formatExportData(cleanData, format);
  }
}

module.exports = MasterService;
