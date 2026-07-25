const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const Permission = require('../models/permissionModel');

async function syncPermissionsDB() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/garment_erp';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully.');

    const permissions = await Permission.find({});
    console.log(`Found ${permissions.length} permission documents.`);

    for (const doc of permissions) {
      let updated = false;
      const roleStr = (doc.role || '').toLowerCase();

      // Ensure dashboard is in allowedModules if missing
      if (!doc.allowedModules.includes('dashboard')) {
        doc.allowedModules.unshift('dashboard');
        updated = true;
      }

      // Ensure moduleAccessLevels.dashboard is NOT NO_ACCESS
      if (doc.moduleAccessLevels) {
        if (doc.moduleAccessLevels instanceof Map) {
          if (doc.moduleAccessLevels.get('dashboard') === 'NO_ACCESS' || !doc.moduleAccessLevels.get('dashboard')) {
            doc.moduleAccessLevels.set('dashboard', 'VIEW_ONLY');
            updated = true;
          }
        } else {
          if (doc.moduleAccessLevels.dashboard === 'NO_ACCESS' || !doc.moduleAccessLevels.dashboard) {
            doc.moduleAccessLevels.dashboard = 'VIEW_ONLY';
            updated = true;
          }
        }
      }

      if (updated) {
        await doc.save();
        console.log(`Updated permissions for role: ${roleStr}, employeeId: ${doc.employeeId || 'none'}`);
      }
    }

    console.log('Permission sync complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error syncing permissions DB:', err);
    process.exit(1);
  }
}

syncPermissionsDB();
