const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    ticketId: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Low',
    },
    status: {
      type: String,
      enum: ['Open', 'Resolved'],
      default: 'Open',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate ticket ID before validation if not provided
supportTicketSchema.pre('validate', function () {
  if (!this.ticketId) {
    this.ticketId = `TKT-${Date.now().toString().substring(7)}-${Math.floor(Math.random() * 9000) + 1000}`;
  }
});

supportTicketSchema.index({ tenantId: 1, ticketId: 1 }, { unique: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
