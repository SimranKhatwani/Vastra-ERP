const express = require('express');
const { createTicket, getTickets, resolveTicket } = require('../controllers/supportTicketController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, createTicket)
  .get(protect, getTickets);

router.route('/:id/resolve')
  .put(protect, resolveTicket);

module.exports = router;
