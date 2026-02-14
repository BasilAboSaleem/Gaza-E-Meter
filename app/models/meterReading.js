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
    type: String, // path to saved file
    required: false
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
  },

  status: {
    type: String,
    enum: ['NEW', 'REVIEW', 'REJECTED', 'INVOICED'],
    default: 'NEW'
  },

  rejectionReason: String,

  previousReading: {
    type: Number,
    default: 0
  },

  consumption: {
    type: Number,
    default: 0
  },

  previousReadingsAvg: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

meterReadingSchema.index({ subscriber: 1, readingDate: -1 });
meterReadingSchema.index({ collector: 1 });
meterReadingSchema.index({ isSynced: 1 });

module.exports = mongoose.model('MeterReading', meterReadingSchema);
