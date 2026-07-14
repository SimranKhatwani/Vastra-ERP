const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
      match: [/^\d{10}$/, 'Phone number must be exactly 10 digits'],
    },
    designation: {
      type: String,
      required: [true, 'Please add a designation'],
    },
    monthlyTarget: {
      type: Number,
      default: 150000,
    },
    salary: {
      type: Number,
      default: 0,
    },
    commissionRate: {
      type: Number,
      default: 0,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: [true, 'Please specify gender'],
    },
    age: {
      type: Number,
      required: [true, 'Please add age'],
    },
    address: {
      type: String,
      required: [true, 'Please add address'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    encryptedPassword: {
      type: String,
      select: true, // Need this for the admin view
    },
    businessCode: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Staff', staffSchema);
