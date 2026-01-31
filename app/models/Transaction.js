const mongoose = require('mongoose');

const TRANSACTION_TYPES = ['COLLECTION', 'TRANSFER', 'EXPENSE', 'ADJUSTMENT'];
const TRANSACTION_DIRECTIONS = ['IN', 'OUT'];

const transactionSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },

    fund: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fund',
      required: true
    },

    sourceFund: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fund'
    },

    destinationFund: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fund'
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01
    },

    type: {
      type: String,
      enum: TRANSACTION_TYPES,
      required: true
    },

    direction: {
      type: String,
      enum: TRANSACTION_DIRECTIONS,
      required: true
    },

    description: {
      type: String,
      trim: true,
      required: true
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId
    },

    metadata: {
      type: Object
    }
  },
  {
    timestamps: true
  }
);
// تحقق من صحة البيانات قبل الحفظ
transactionSchema.pre('validate', function (next) {
  if (this.direction === 'IN' && !this.destinationFund) {
    return next(new Error('IN transaction requires destinationFund'));
  }

  if (this.direction === 'OUT' && !this.sourceFund) {
    return next(new Error('OUT transaction requires sourceFund'));
  }

});

// منع التعديل بعد الإنشاء (Audit-safe)
transactionSchema.pre('save', function (next) {
  if (!this.isNew) {
    throw new Error('Transactions are immutable');
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
