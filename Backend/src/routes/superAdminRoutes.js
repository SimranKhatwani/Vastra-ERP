const express = require('express');
const { superAdminLogin, registerBusiness } = require('../controllers/superAdminController');
const { protectSuperAdmin } = require('../middlewares/superAdminMiddleware');

const router = express.Router();

router.post('/login', superAdminLogin);
router.post('/register-business', protectSuperAdmin, registerBusiness);

module.exports = router;
