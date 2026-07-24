const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { protect } = require('../middlewares/authMiddleware');

// All permission management routes require authentication
router.use(protect);

router.get('/', permissionController.getPermissions);
router.put('/', permissionController.updatePermissions);
router.post('/reset', permissionController.resetPermissions);

module.exports = router;
