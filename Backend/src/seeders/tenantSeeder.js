const Tenant = require('../models/Tenant');
const Role = require('../models/Role');
const User = require('../models/User');
const Brand = require('../models/masters/Brand');
const Category = require('../models/masters/Category');
const Color = require('../models/masters/Color');
const Size = require('../models/masters/Size');
const Warehouse = require('../models/masters/Warehouse');
const Firm = require('../models/masters/Firm');
const { hashPassword } = require('../utils/hash');
const { ALL_PERMISSIONS } = require('../constants/permissions');
const { ROLES } = require('../constants/roles');
const logger = require('../utils/logger');

const seedDemoTenant = async () => {
  const code = 'VASTRA';
  let tenant = await Tenant.findOne({ code });

  if (!tenant) {
    tenant = await Tenant.create({
      companyName: 'Vastra Retail Pvt Ltd',
      code,
      email: 'contact@vastraretail.com',
      phone: '9876543210',
      address: { street: 'Main Textile Hub', city: 'Surat', state: 'Gujarat', pincode: '395002' },
      status: 'ACTIVE'
    });
    logger.info(`Demo Tenant created: ${tenant.companyName}`);
  }

  // Create Role
  let adminRole = await Role.findOne({ tenantId: tenant._id, name: ROLES.TENANT_ADMIN });
  if (!adminRole) {
    adminRole = await Role.create({
      tenantId: tenant._id,
      name: ROLES.TENANT_ADMIN,
      description: 'Full Administrative Privileges',
      permissions: ALL_PERMISSIONS,
      isSystemRole: true
    });
  }

  // Create Owner User
  const ownerEmail = 'owner@vastraretail.com';
  let owner = await User.findOne({ email: ownerEmail });
  if (!owner) {
    const hashedPassword = await hashPassword('Owner@123456');
    owner = await User.create({
      tenantId: tenant._id,
      name: 'Rajesh Shah (Owner)',
      email: ownerEmail,
      password: hashedPassword,
      phone: '9876543210',
      roleId: adminRole._id,
      isTenantOwner: true
    });
    logger.info(`Demo Tenant Owner created: ${ownerEmail}`);
  }

  // Create Sample Masters
  await Brand.findOneAndUpdate({ tenantId: tenant._id, name: 'Vastra Premium' }, { tenantId: tenant._id, name: 'Vastra Premium' }, { upsert: true });
  await Category.findOneAndUpdate({ tenantId: tenant._id, name: 'Ethnic Wear' }, { tenantId: tenant._id, name: 'Ethnic Wear' }, { upsert: true });
  await Color.findOneAndUpdate({ tenantId: tenant._id, name: 'Royal Blue' }, { tenantId: tenant._id, name: 'Royal Blue', hexCode: '#002366' }, { upsert: true });
  await Size.findOneAndUpdate({ tenantId: tenant._id, name: 'L' }, { tenantId: tenant._id, name: 'L', standardSize: 'L' }, { upsert: true });
  await Warehouse.findOneAndUpdate({ tenantId: tenant._id, name: 'Main Store Warehouse' }, { tenantId: tenant._id, name: 'Main Store Warehouse', isDefault: true }, { upsert: true });
  await Firm.findOneAndUpdate({ tenantId: tenant._id, name: 'Vastra Fashion Firm' }, { tenantId: tenant._id, name: 'Vastra Fashion Firm', gstin: '24AAAAA0000A1Z5' }, { upsert: true });

  logger.info('Sample Master data seeded for demo tenant.');
};

module.exports = seedDemoTenant;
