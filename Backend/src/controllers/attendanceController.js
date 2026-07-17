const mongoose = require('mongoose');
const AttendanceRecord = require('../models/attendanceRecordModel');
const AttendancePolicy = require('../models/attendancePolicyModel');
const Employee = require('../models/employeeModel');
const moment = require('moment'); // Using moment if available, otherwise native Date

// Helper to parse time string "HH:mm" into a comparable minutes since midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper to get minutes since midnight for a Date
const getMinutesSinceMidnight = (date) => {
  return date.getHours() * 60 + date.getMinutes();
};

// 1. Get or Create Policy
const getPolicy = async (req, res) => {
  try {
    let policy = await AttendancePolicy.findOne({ tenantId: req.user.tenantId });
    if (!policy) {
      policy = await AttendancePolicy.create({ tenantId: req.user.tenantId });
    }
    res.json(policy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePolicy = async (req, res) => {
  try {
    const policy = await AttendancePolicy.findOneAndUpdate(
      { tenantId: req.user.tenantId },
      req.body,
      { new: true, upsert: true }
    );
    res.json(policy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Punch Status
const getPunchStatus = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const record = await AttendanceRecord.findOne({
      tenantId: req.user.tenantId,
      employeeId: req.query.employeeId,
      date: today
    });
    res.json(record || { status: 'Not Punched In' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Punch In
const punchIn = async (req, res) => {
  try {
    const { employeeId, location, device, ip, storeBranch } = req.body;
    const tenantId = req.user.tenantId;
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Check existing
    let record = await AttendanceRecord.findOne({ tenantId, employeeId, date: today });
    if (record) {
      return res.status(400).json({ message: 'Already punched in today.' });
    }

    // Get Policy
    let policy = await AttendancePolicy.findOne({ tenantId });
    if (!policy) policy = await AttendancePolicy.create({ tenantId });

    const punchInMins = getMinutesSinceMidnight(now);
    const reportingMins = timeToMinutes(policy.officialReportingTime);
    const normalArrivalMins = timeToMinutes(policy.normalArrivalThreshold);

    let arrivalClass = 'Very Late Arrival';
    if (punchInMins <= reportingMins) {
      arrivalClass = 'Perfect Arrival';
    } else if (punchInMins <= normalArrivalMins) {
      arrivalClass = 'Normal Arrival';
    }

    // Very Late Buffer Logic
    let deductionAmount = 0;
    let veryLateBufferUsed = false;
    
    // Count very late arrivals this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    if (arrivalClass === 'Very Late Arrival') {
      const veryLateCount = await AttendanceRecord.countDocuments({
        tenantId, employeeId,
        date: { $gte: startOfMonth, $lte: today },
        arrivalClassification: 'Very Late Arrival'
      });
      
      const newCount = veryLateCount + 1;
      if (newCount <= policy.lateBufferCount) {
        veryLateBufferUsed = true;
      } else {
        deductionAmount = policy.lateDeductionAmount;
        // If it's exactly the threshold + 1 (e.g. 6th), retroactive deduction
        if (newCount === policy.lateBufferCount + 1) {
          await AttendanceRecord.updateMany(
            { tenantId, employeeId, date: { $gte: startOfMonth }, arrivalClassification: 'Very Late Arrival' },
            { $set: { deductionAmount: policy.lateDeductionAmount } }
          );
        }
      }
    }

    // Perfect Arrival Logic
    let rewardAmount = 0;
    if (arrivalClass === 'Perfect Arrival') {
      const perfectCount = await AttendanceRecord.countDocuments({
        tenantId, employeeId,
        date: { $gte: startOfMonth, $lte: today },
        arrivalClassification: 'Perfect Arrival'
      });
      if (perfectCount + 1 === policy.perfectArrivalRewardThreshold) {
        rewardAmount = policy.perfectArrivalRewardAmount;
      }
    }

    record = await AttendanceRecord.create({
      tenantId,
      employeeId,
      date: today,
      punchInTime: now,
      punchInLocation: location,
      punchInDevice: device,
      punchInIP: ip,
      punchInStoreBranch: storeBranch,
      arrivalClassification: arrivalClass,
      deductionAmount,
      rewardAmount,
      veryLateBufferUsed,
      attendanceStatus: 'Incomplete'
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Punch Out
const punchOut = async (req, res) => {
  try {
    const { employeeId, location, device } = req.body;
    const tenantId = req.user.tenantId;
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const record = await AttendanceRecord.findOne({ tenantId, employeeId, date: today });
    if (!record) return res.status(404).json({ message: 'No punch-in record found for today.' });
    if (record.punchOutTime) return res.status(400).json({ message: 'Already punched out.' });

    let policy = await AttendancePolicy.findOne({ tenantId });
    if (!policy) policy = await AttendancePolicy.create({ tenantId });

    const punchInDate = new Date(record.punchInTime);
    const workingHours = (now - punchInDate) / (1000 * 60 * 60);

    const punchOutMins = getMinutesSinceMidnight(now);
    const severeEarlyMins = timeToMinutes(policy.severeEarlyExitTime);
    const earlyStartMins = timeToMinutes(policy.earlyExitWindowStart);
    const earlyEndMins = timeToMinutes(policy.earlyExitWindowEnd);
    const minorStartMins = timeToMinutes(policy.minorEarlyExitWindowStart);
    const minorEndMins = timeToMinutes(policy.minorEarlyExitWindowEnd);
    const overtimeMins = timeToMinutes(policy.overtimeStartTime);

    let exitClass = 'Normal Exit';
    let overtimeAmount = 0;
    let redFlag = false;

    if (punchOutMins < severeEarlyMins) {
      exitClass = 'Severe Early Exit';
    } else if (punchOutMins >= earlyStartMins && punchOutMins <= earlyEndMins) {
      exitClass = 'Early Exit';
    } else if (punchOutMins >= minorStartMins && punchOutMins <= minorEndMins) {
      exitClass = 'Minor Early Exit';
      redFlag = true;
    } else if (punchOutMins >= overtimeMins) {
      exitClass = 'Overtime';
      overtimeAmount = policy.overtimeAmountPerDay;
    }

    // Half Day Evaluation Engine
    let finalStatus = 'Present';
    let halfDayReason = '';
    let managerReviewPending = false;

    // Rule 1: Working hours < 4 -> Absent
    if (workingHours < policy.minWorkingHoursAbsent) {
      finalStatus = 'Absent';
      halfDayReason = 'Less than Minimum Working Hours';
    } 
    // Rule 2: Exit Before Severe Early -> Half Day
    else if (exitClass === 'Severe Early Exit') {
      finalStatus = 'Half Day';
      halfDayReason = 'Severe Early Exit';
    }
    // Rule 3: Working hours < 8 -> Half Day
    else if (workingHours < policy.minWorkingHoursFullDay) {
      finalStatus = 'Half Day';
      halfDayReason = 'Insufficient Working Hours';
    }
    // Rule 4: Expected Half Day (Early Exit)
    else if (exitClass === 'Early Exit') {
      finalStatus = 'Expected Half Day';
      managerReviewPending = true;
    }

    // Default Rule for Expected Half Day if not reviewed is Early Exit, but initially we set to Expected Half Day.
    
    record.punchOutTime = now;
    record.punchOutLocation = location;
    record.punchOutDevice = device;
    record.workingHours = Number(workingHours.toFixed(2));
    record.exitClassification = exitClass;
    record.attendanceStatus = finalStatus;
    record.halfDayReason = halfDayReason;
    record.managerReviewPending = managerReviewPending;
    record.overtimeAmount = overtimeAmount;
    record.redFlag = redFlag;

    await record.save();

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Manager Review
const reviewRecord = async (req, res) => {
  try {
    const { recordId, decision, remarks } = req.body; // decisions: 'Approve Half Day', 'Keep Early Exit', 'Ignore', 'Approve Overtime'
    const record = await AttendanceRecord.findOne({ _id: recordId, tenantId: req.user.tenantId });
    if (!record) return res.status(404).json({ message: 'Record not found' });

    record.managerReview = {
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      decision,
      remarks
    };
    record.managerReviewPending = false;

    if (decision === 'Approve Half Day') {
      record.attendanceStatus = 'Half Day';
    } else if (decision === 'Keep Early Exit') {
      record.attendanceStatus = 'Early Exit';
    } else if (decision === 'Ignore') {
      record.attendanceStatus = 'Present'; // Or full day
    }

    await record.save();
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. Get Records
const getRecords = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    let query = { tenantId: req.user.tenantId };
    
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }
    if (employeeId) {
      query.employeeId = employeeId;
    }

    const records = await AttendanceRecord.find(query).populate('employeeId', 'name role businessCode').sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. Get Dashboard Stats
const getDashboardStats = async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    const tenantId = req.user.tenantId;
    let matchQuery = { tenantId };
    if (month) {
      matchQuery.date = { $regex: `^${month}` };
    }

    const records = await AttendanceRecord.find(matchQuery);
    
    let stats = {
      present: 0,
      absent: 0,
      halfDays: 0,
      expectedHalfDays: 0,
      perfectArrivals: 0,
      normalArrivals: 0,
      veryLates: 0,
      earlyExits: 0,
      minorEarlyExits: 0,
      redFlags: 0,
      pendingReviews: 0,
      overtimeAmount: 0,
      totalWorkingHours: 0,
    };

    records.forEach(r => {
      if (r.attendanceStatus === 'Present') stats.present++;
      if (r.attendanceStatus === 'Absent') stats.absent++;
      if (r.attendanceStatus === 'Half Day') stats.halfDays++;
      if (r.attendanceStatus === 'Expected Half Day') stats.expectedHalfDays++;
      
      if (r.arrivalClassification === 'Perfect Arrival') stats.perfectArrivals++;
      if (r.arrivalClassification === 'Normal Arrival') stats.normalArrivals++;
      if (r.arrivalClassification === 'Very Late Arrival') stats.veryLates++;
      
      if (r.exitClassification === 'Early Exit') stats.earlyExits++;
      if (r.exitClassification === 'Minor Early Exit') stats.minorEarlyExits++;
      
      if (r.redFlag) stats.redFlags++;
      if (r.managerReviewPending) stats.pendingReviews++;
      
      stats.overtimeAmount += (r.overtimeAmount || 0);
      stats.totalWorkingHours += (r.workingHours || 0);
    });

    stats.averageWorkingHours = records.length ? (stats.totalWorkingHours / records.length).toFixed(2) : 0;

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPolicy,
  updatePolicy,
  getPunchStatus,
  punchIn,
  punchOut,
  reviewRecord,
  getRecords,
  getDashboardStats
};
