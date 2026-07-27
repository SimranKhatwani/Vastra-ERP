const express = require('express');
const {
  createVendor,
  getVendorList,
  getVendorHub,
  logActivity,
  createFollowUp,
  updateFollowUp,
  addDocument,
  deleteDocument,
  addNote,
  updateVendor,
} = require('../controllers/vendorCommunicationController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', createVendor);
router.get('/list', getVendorList);
router.get('/:vendorId', getVendorHub);
router.put('/:vendorId', updateVendor);
router.post('/:vendorId/log-activity', logActivity);
router.post('/:vendorId/followups', createFollowUp);
router.put('/followups/:followUpId', updateFollowUp);
router.post('/:vendorId/documents', addDocument);
router.delete('/documents/:docId', deleteDocument);
router.post('/:vendorId/notes', addNote);

module.exports = router;
