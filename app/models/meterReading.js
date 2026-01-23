// app/models/MeterReading.js
const mongoose = require('mongoose');

const meterReadingSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  subscriber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscriber',
    required: true
  },

  collector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  readingValue: {
    type: Number,
    required: true
  },

  readingImage: {
    type: String, // path أو S3
    required: true
  },

  readingDate: {
    type: Date,
    default: Date.now
  },

  source: {
    type: String,
    enum: ['OFFLINE', 'ONLINE'],
    default: 'OFFLINE'
  },

  deviceId: String, // لتفادي التكرار عند الـ sync

  isSynced: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model('MeterReading', meterReadingSchema);
