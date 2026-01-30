const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema(
  {
       company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    parentArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Area',
      default: null // null means it's a primary area
    },
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Area', areaSchema);
