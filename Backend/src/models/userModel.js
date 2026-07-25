const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true, // Every user MUST belong to a business
    },
    businessCode: {
      type: String,
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
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
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    passwordHash: {
      type: String,
      minlength: 6,
      select: false,
    },
    encryptedPassword: {
      type: String,
      select: false, // Don't return this by default
    },
    phone: {
      type: String,
      match: [/^\d{10}$/, 'Phone number must be exactly 10 digits'],
    },
    role: {
      type: String,
      default: 'Cashier',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function () {
  const isPasswordModified = this.isModified('password');
  const isPasswordHashModified = this.isModified('passwordHash');

  if (!isPasswordModified && !isPasswordHashModified) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  
  if (isPasswordModified && this.password) {
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  if (isPasswordHashModified && this.passwordHash) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  }
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  const hashToCompare = this.passwordHash || this.password;
  if (!hashToCompare) return false;
  return await bcrypt.compare(enteredPassword, hashToCompare);
};

module.exports = mongoose.model('User', userSchema);
