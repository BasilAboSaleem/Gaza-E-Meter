const mongoose = require('mongoose');

const meterSchema = new mongoose.Schema(
  {
    serialNumber: { type: String, required: true, unique: true, trim: true },
    subscriberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscriber' },
    installationDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Meter', meterSchema);
