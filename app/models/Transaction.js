const mongoose = require('mongoose');

const TRANSACTION_TYPES = ['COLLECTION', 'TRANSFER', 'EXPENSE', 'ADJUSTMENT'];

const transactionSchema = new mongoose.Schema(
  {
    sourceFund: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fund',
      required: function() { return this.type !== 'COLLECTION'; }
    },
    destinationFund: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fund',
      required: true
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
    description: {
      type: String,
      required: true,
      trim: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      // Reference to Invoice, Reading, or other transaction
    },
    metadata: {
      type: Object // For any additional data like receipt photos, etc.
    }
  },
  {
    timestamps: true
  }
);

// Prevent updates or deletions to transactions for audit integrity
transactionSchema.pre('save', function(next) {
  if (!this.isNew) {
    throw new Error('Transactions are immutable and cannot be updated.');
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
