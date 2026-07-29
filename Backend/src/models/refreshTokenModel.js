const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    ipAddress: {
      type: String,
    },
    browser: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

refreshTokenSchema.statics.verifyExpiration = (token) => {
  return token.expiryDate.getTime() < new Date().getTime();
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
