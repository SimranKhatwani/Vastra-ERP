const SuperAdmin = require('../models/SuperAdmin');
const { hashPassword } = require('../utils/hash');
const logger = require('../utils/logger');

const seedSuperAdmin = async () => {
  const email = (process.env.SUPER_ADMIN_EMAIL || 'superadmin@vastra.com').toLowerCase();
  const existing = await SuperAdmin.findOne({ email });

  if (!existing) {
    const hashedPassword = await hashPassword(process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123456');
    await SuperAdmin.create({
      name: process.env.SUPER_ADMIN_NAME || 'Super Admin',
      email,
      password: hashedPassword,
      phone: '9999999999',
      isActive: true
    });
    logger.info(`SuperAdmin created: ${email}`);
  } else {
    logger.info(`SuperAdmin already exists: ${email}`);
  }
};

module.exports = seedSuperAdmin;
