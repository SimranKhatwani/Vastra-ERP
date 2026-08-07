const mongoose = require('mongoose');
const baseSchemaPlugin = require('../plugins/baseSchema');

const gstSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  rate: { type: Number, required: true }, // Total GST percentage e.g. 5, 12, 18
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 }
});

gstSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('GST', gstSchema);
