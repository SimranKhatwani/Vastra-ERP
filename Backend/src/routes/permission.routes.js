const express = require('express');
const PermissionController = require('../controllers/permission.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', PermissionController.getPermissions);
router.put('/', PermissionController.savePermissions);
router.post('/reset', PermissionController.resetPermissions);

module.exports = router;
