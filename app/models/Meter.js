const mongoose = require('mongoose');

const meterSchema = new mongoose.Schema(
  {
      company: {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'Company',
     required: true,
     index: true
   }, 
    serialNumber: { type: String, required: true, unique: true, trim: true },
    subscriberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscriber' },
    initialReading: { type: Number, default: 0 },
    installationDate: { type: Date,required: true,  default: Date.now },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Meter', meterSchema);
