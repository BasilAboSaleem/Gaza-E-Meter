const ElectricityRate = require('../../models/ElectricityRate');

exports.create = async (data) => {
  const rate = new ElectricityRate(data);
  return await rate.save();
};

exports.findCurrentRate = async (companyId) => {
  return await ElectricityRate.findOne({ companyId, endDate: null });
};

exports.findRateHistory = async (companyId) => {
  return await ElectricityRate.find({ companyId }).sort({ startDate: -1 });
};

exports.findById = async (id) => {
  return await ElectricityRate.findById(id);
};

exports.update = async (id, data) => {
  return await ElectricityRate.findByIdAndUpdate(id, data, { new: true });
};
