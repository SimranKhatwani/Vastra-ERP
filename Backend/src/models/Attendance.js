const mongoose = require('mongoose');
const baseSchemaPlugin = require('./plugins/baseSchema');

const attendanceSchema = new mongoose.Schema({
  salesmanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salesman'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  staffName: String,
  date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'],
    default: 'PRESENT'
  },
  remarks: String
});

attendanceSchema.index({ tenantId: 1, date: 1, salesmanId: 1 });
attendanceSchema.plugin(baseSchemaPlugin);

module.exports = mongoose.model('Attendance', attendanceSchema);
