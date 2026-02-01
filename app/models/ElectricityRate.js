// ElectricityRate.js
const mongoose = require('mongoose');

const electricityRateSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  rate: { type: Number, required: true },
  startDate: { type: Date, required: true, default: Date.now },
  endDate: { type: Date } // null يعني السعر الحالي
}, { timestamps: true });

module.exports = mongoose.model('ElectricityRate', electricityRateSchema);
