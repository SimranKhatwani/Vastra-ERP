const SupportTicket = require('../models/supportTicketModel');

exports.createTicket = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const ticket = await SupportTicket.create({
      ...req.body,
      tenantId
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTickets = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const tickets = await SupportTicket.find({ tenantId }).sort('-createdAt');
      
    res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resolveTicket = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    let ticket = await SupportTicket.findOne({ _id: req.params.id, tenantId });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    ticket.status = 'Resolved';
    await ticket.save();

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
