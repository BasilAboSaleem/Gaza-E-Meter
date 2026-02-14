const readingRepository = require('../../repositories/companyAdmin/readings');
const ElectricityRate = require('../../models/ElectricityRate');
const Invoice = require('../../models/Invoice');

exports.getReadingsByCompany = async (companyId, filters) => {
  return await readingRepository.findReadings(companyId, filters);
};

exports.getReadingById = async (id) => {
  return await readingRepository.findById(id);
};

exports.approveReading = async (readingId) => {
  // Initially set to REVIEW as per plan, then trigger invoice generation which sets it to INVOICED
  const reading = await readingRepository.findById(readingId);
  if (!reading) throw new Error('القراءة غير موجودة');

  // Trigger invoice generation (this will be called by controller usually, or here if we want auto)
  // For now, let's keep it explicit in the controller or a separate call
  return await readingRepository.updateStatus(readingId, 'REVIEW');
};

exports.rejectReading = async (readingId, reason) => {
  return await readingRepository.updateStatus(readingId, 'REJECTED', { rejectionReason: reason });
};
