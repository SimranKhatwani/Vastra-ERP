const Invoice = require('../models/invoiceModel');

class InvoiceRepository {
  async findById(id) {
    return await Invoice.findById(id).populate('customerId', 'name phone email whatsappNumber');
  }

  async findByInvoiceNo(invoiceNo, tenantId) {
    return await Invoice.findOne({ invoiceNo, tenantId });
  }

  async findByMessageId(messageId) {
    return await Invoice.findOne({ messageId });
  }

  async updateWhatsAppStatus(id, updateData) {
    return await Invoice.findByIdAndUpdate(id, updateData, { new: true });
  }
}

module.exports = new InvoiceRepository();
