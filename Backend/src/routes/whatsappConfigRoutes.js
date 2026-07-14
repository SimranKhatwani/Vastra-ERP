const express = require('express');
const {
  getConfig,
  saveConfig,
  verifyWebhook,
  handleWebhookEvent,
} = require('../controllers/whatsappConfigController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Settings CRUD — Admin and BusinessAdmin only
router.route('/')
  .get(protect, authorize('BusinessAdmin', 'Admin', 'SuperAdmin', 'Manager'), getConfig)
  .post(protect, authorize('BusinessAdmin', 'Admin', 'SuperAdmin'), saveConfig);

// Meta Webhook endpoints — No JWT (Meta calls these directly)
router.route('/webhook')
  .get(verifyWebhook)
  .post(handleWebhookEvent);

module.exports = router;
