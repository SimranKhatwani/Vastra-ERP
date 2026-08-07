/**
 * Generic Base Repository providing Tenant-Isolated MongoDB Query Operations
 */
class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  // Inject tenant filter into query
  _applyTenantFilter(tenantId, query = {}) {
    if (!tenantId) return query;
    return { ...query, tenantId };
  }

  async create(data, tenantId = null) {
    if (tenantId && !data.tenantId) {
      data.tenantId = tenantId;
    }
    return this.model.create(data);
  }

  async find(query = {}, tenantId = null, options = {}) {
    const filter = this._applyTenantFilter(tenantId, query);
    let q = this.model.find(filter);

    if (options.populate) q = q.populate(options.populate);
    if (options.sort) q = q.sort(options.sort);
    if (options.skip) q = q.skip(options.skip);
    if (options.limit) q = q.limit(options.limit);
    if (options.select) q = q.select(options.select);

    return q.exec();
  }

  async findOne(query = {}, tenantId = null, options = {}) {
    const filter = this._applyTenantFilter(tenantId, query);
    let q = this.model.findOne(filter);
    if (options.populate) q = q.populate(options.populate);
    if (options.select) q = q.select(options.select);
    return q.exec();
  }

  async findById(id, tenantId = null, options = {}) {
    const filter = this._applyTenantFilter(tenantId, { _id: id });
    let q = this.model.findOne(filter);
    if (options.populate) q = q.populate(options.populate);
    if (options.select) q = q.select(options.select);
    return q.exec();
  }

  async update(id, data, tenantId = null, options = { new: true }) {
    const filter = this._applyTenantFilter(tenantId, { _id: id });
    return this.model.findOneAndUpdate(filter, data, { new: true, runValidators: true, ...options });
  }

  async updateMany(query = {}, data, tenantId = null) {
    const filter = this._applyTenantFilter(tenantId, query);
    return this.model.updateMany(filter, data);
  }

  async softDelete(id, userId = null, tenantId = null) {
    const item = await this.findById(id, tenantId);
    if (!item) return null;
    return item.softDelete(userId);
  }

  async countDocuments(query = {}, tenantId = null) {
    const filter = this._applyTenantFilter(tenantId, query);
    return this.model.countDocuments(filter);
  }

  async aggregate(pipeline = []) {
    return this.model.aggregate(pipeline);
  }
}

module.exports = BaseRepository;
