const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema(
  {
    meterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meter', required: true },
    collectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    previousReading: { type: Number, required: true },
    currentReading: { type: Number, required: true },
    readingDate: { type: Date, default: Date.now },
    synced: { type: Boolean, default: false } // offline/online sync
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reading', readingSchema);
