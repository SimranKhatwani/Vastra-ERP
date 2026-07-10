const express = require('express');
const { login, getProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.get('/profile', protect, getProfile);

module.exports = router;
