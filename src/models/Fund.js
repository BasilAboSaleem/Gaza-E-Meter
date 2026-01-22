const mongoose = require('mongoose');

const FUND_TYPES = ['COMPANY', 'COLLECTOR', 'BANK', 'EXPENSES', 'OTHER'];

const fundSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    type: {
      type: String,
      enum: FUND_TYPES,
      required: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // null if it's a company-wide fund
    },
    balance: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'شيكل' // Default to Israeli Shekel as common in Gaza
    },
    isActive: {
      type: Boolean,
      default: true
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Fund', fundSchema);
