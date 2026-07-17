const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    employeeId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD format
      required: true,
    },
    
    // Punch Details
    punchInTime: { type: Date },
    punchInLocation: { type: String },
    punchInDevice: { type: String },
    punchInIP: { type: String },
    punchInStoreBranch: { type: String },

    punchOutTime: { type: Date },
    punchOutLocation: { type: String },
    punchOutDevice: { type: String },
    
    workingHours: { type: Number, default: 0 }, // in hours

    // Classifications
    arrivalClassification: {
      type: String,
      enum: ['Perfect Arrival', 'Normal Arrival', 'Very Late Arrival', 'N/A'],
      default: 'N/A',
    },
    exitClassification: {
      type: String,
      enum: ['Severe Early Exit', 'Early Exit', 'Minor Early Exit', 'Normal Exit', 'Overtime', 'N/A'],
      default: 'N/A',
    },
    
    // Status & Reasons
    attendanceStatus: {
      type: String,
      enum: ['Present', 'Absent', 'Half Day', 'Expected Half Day', 'Early Exit', 'Incomplete'],
      default: 'Incomplete',
    },
    halfDayReason: { type: String },
    lateReason: { type: String },

    // Financial Impacts
    overtimeAmount: { type: Number, default: 0 },
    rewardAmount: { type: Number, default: 0 },
    deductionAmount: { type: Number, default: 0 },

    // Flags & Trackers
    veryLateBufferUsed: { type: Boolean, default: false },
    earlyExitBufferUsed: { type: Boolean, default: false },
    redFlag: { type: Boolean, default: false },

    // Management Review
    managerReviewPending: { type: Boolean, default: false },
    managerReview: {
      reviewedBy: { type: String }, // Name or ID
      reviewedAt: { type: Date },
      decision: { type: String }, // e.g., 'Approved Half Day', 'Kept Early Exit', 'Ignored'
      remarks: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one record per employee per date per tenant
attendanceRecordSchema.index({ tenantId: 1, employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
