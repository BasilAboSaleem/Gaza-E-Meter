const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema(
  {
    company: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Company',
  required: true,
  index: true
},
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    nationalId: { type: String, trim: true }, // رقم الهوية
    address: { type: String, trim: true },
    
    // Areas
    primaryArea: { type: mongoose.Schema.Types.ObjectId, ref: 'Area', required: true },
    secondaryArea: { type: mongoose.Schema.Types.ObjectId, ref: 'Area' },

    // Meter Info
    meterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meter' },
    initialReading: { type: Number, default: 0 },

    // Subscription Settings
    type: { type: String, enum: ['HOME', 'COMMERCIAL'], default: 'HOME' },
    collectionFrequency: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY'], default: 'MONTHLY' },
    
    // Assignment
    assignedCollector: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscriber', subscriberSchema);
