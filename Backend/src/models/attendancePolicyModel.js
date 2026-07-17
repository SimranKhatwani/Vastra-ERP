const mongoose = require('mongoose');

const attendancePolicySchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Timings
    officialReportingTime: { type: String, default: '10:30' },
    officialExitTime: { type: String, default: '21:30' },
    
    // Arrival Rules
    normalArrivalThreshold: { type: String, default: '11:05' },
    lateBufferCount: { type: Number, default: 5 },
    lateDeductionAmount: { type: Number, default: 100 },
    perfectArrivalRewardAmount: { type: Number, default: 500 },
    perfectArrivalRewardThreshold: { type: Number, default: 25 },
    
    // Half Day Rules
    minWorkingHoursAbsent: { type: Number, default: 4 },
    minWorkingHoursFullDay: { type: Number, default: 8 },
    
    // Exit Rules
    severeEarlyExitTime: { type: String, default: '18:30' },
    earlyExitWindowStart: { type: String, default: '18:30' },
    earlyExitWindowEnd: { type: String, default: '20:59' },
    minorEarlyExitWindowStart: { type: String, default: '21:00' },
    minorEarlyExitWindowEnd: { type: String, default: '21:29' },
    earlyExitBufferCount: { type: Number, default: 5 },
    redFlagLimit: { type: Number, default: 5 },
    
    // Overtime Rules
    overtimeStartTime: { type: String, default: '22:00' },
    overtimeAmountPerDay: { type: Number, default: 100 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AttendancePolicy', attendancePolicySchema);
