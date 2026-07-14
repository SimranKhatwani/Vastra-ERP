const Customer = require('../models/customerModel');

class CustomerRepository {
  async findById(id) {
    return await Customer.findById(id);
  }

  async findByTenantId(tenantId) {
    return await Customer.find({ tenantId }).sort('-createdAt');
  }
}

module.exports = new CustomerRepository();
