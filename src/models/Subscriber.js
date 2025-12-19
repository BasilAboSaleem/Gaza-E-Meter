const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    meterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meter' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscriber', subscriberSchema);
