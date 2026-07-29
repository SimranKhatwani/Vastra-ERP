const express = require('express');
const { login, getProfile, logout } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout); // Can also be protected, but safe either way
router.get('/profile', protect, getProfile);

module.exports = router;
