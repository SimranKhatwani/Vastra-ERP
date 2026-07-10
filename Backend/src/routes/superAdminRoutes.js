const express = require('express');
const { 
  superAdminLogin, 
  createRazorpayOrder, 
  verifyAndRegisterBusiness, 
  getAllTenants, 
  toggleTenantStatus, 
  updateTenantDetails 
} = require('../controllers/superAdminController');
const { protectSuperAdmin } = require('../middlewares/superAdminMiddleware');

const router = express.Router();

router.post('/login', superAdminLogin);
router.post('/create-order', protectSuperAdmin, createRazorpayOrder);
router.post('/register-business', protectSuperAdmin, verifyAndRegisterBusiness);
router.get('/tenants', protectSuperAdmin, getAllTenants);
router.put('/tenants/:id/toggle-status', protectSuperAdmin, toggleTenantStatus);
router.put('/tenants/:id', protectSuperAdmin, updateTenantDetails);

module.exports = router;
