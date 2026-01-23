const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  subscriberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscriber', required: true },
  readingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reading', required: true },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },

  consumption: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalAmount: { type: Number, required: true },   // يحسب تلقائيًا عند الإنشاء

  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: function() { return this.totalAmount } },
  paymentMethod: { type: String, enum: ['CASH', 'BANK', 'MIXED'], default: 'CASH' },
  paymentProof: { type: String },

  status: { type: String, enum: ['UNPAID','PARTIAL','PAID'], default: 'UNPAID' }
}, { timestamps: true });

// عند الإنشاء: تحديث totalAmount تلقائيًا بناءً على الاستهلاك
invoiceSchema.pre('validate', function(next) {
  if(this.consumption != null && this.unitPrice != null) {
    this.totalAmount = this.consumption * this.unitPrice;
    this.remainingAmount = this.totalAmount - (this.paidAmount || 0);
  }
  next();
});


module.exports = mongoose.model('Invoice', invoiceSchema);
