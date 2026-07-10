const express = require('express');
const { 
  superAdminLogin, 
  registerBusiness, 
  getAllTenants, 
  toggleTenantStatus, 
  updateTenantDetails 
} = require('../controllers/superAdminController');
const { protectSuperAdmin } = require('../middlewares/superAdminMiddleware');

const router = express.Router();

router.post('/login', superAdminLogin);
router.post('/register-business', protectSuperAdmin, registerBusiness);
router.get('/tenants', protectSuperAdmin, getAllTenants);
router.put('/tenants/:id/toggle-status', protectSuperAdmin, toggleTenantStatus);
router.put('/tenants/:id', protectSuperAdmin, updateTenantDetails);

module.exports = router;
