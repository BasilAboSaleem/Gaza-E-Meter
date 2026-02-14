const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  subscriberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscriber', required: true },
  readingId: { type: mongoose.Schema.Types.ObjectId, ref: 'MeterReading', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  
  invoiceNumber: { type: String, required: true, unique: true },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },

  consumption: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  
  fixedFees: { type: Number, default: 0 },
  taxes: { type: Number, default: 0 },
  arrears: { type: Number, default: 0 }, // ديون سابقة
  previousBalance: { type: Number, default: 0 },

  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: function() { return this.totalAmount } },
  
  paymentMethod: { type: String, enum: ['CASH', 'BANK', 'MIXED'], default: 'CASH' },
  paymentProof: { type: String },

  status: { type: String, enum: ['UNPAID','PARTIAL','PAID'], default: 'UNPAID' }
}, { timestamps: true });

// عند الإنشاء: تحديث totalAmount تلقائيًا بناءً على الاستهلاك
invoiceSchema.pre('validate', async function() {
  if(this.consumption != null && this.unitPrice != null) {
    const consumptionValue = this.consumption * this.unitPrice;
    this.totalAmount = consumptionValue + (this.fixedFees || 0) + (this.taxes || 0) + (this.arrears || 0);
    this.remainingAmount = this.totalAmount - (this.paidAmount || 0);
  }
});


module.exports = mongoose.model('Invoice', invoiceSchema);
