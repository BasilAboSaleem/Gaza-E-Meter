const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    subscriberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscriber', required: true },
    readingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reading', required: true },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    consumption: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['CASH', 'BANK', 'MIXED', 'UNPAID'], default: 'UNPAID' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
