
const router = require('express').Router();
const authMiddleware = require('../middlewares/authMiddleware');
const attendanceController = require('../controllers/attendanceController');

router.use(authMiddleware.protect);

router.get('/policy', attendanceController.getPolicy);
router.put('/policy', attendanceController.updatePolicy);

router.get('/status', attendanceController.getPunchStatus);
router.post('/punch-in', attendanceController.punchIn);
router.post('/punch-out', attendanceController.punchOut);

router.get('/records', attendanceController.getRecords);
router.put('/review', attendanceController.reviewRecord);

router.get('/dashboard-stats', attendanceController.getDashboardStats);

module.exports = router;
