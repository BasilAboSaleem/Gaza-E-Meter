const electricityRateRepository = require('../../repositories/companyAdmin/electricityRate');

exports.getCurrentRate = async (companyId) => {
  return await electricityRateRepository.findCurrentRate(companyId);
};

exports.getRateHistory = async (companyId) => {
  return await electricityRateRepository.findRateHistory(companyId);
};

exports.updateRate = async (companyId, newRateValue) => {
  const currentRate = await electricityRateRepository.findCurrentRate(companyId);
  
  const now = new Date();

  if (currentRate) {
    // Check if the rate is actually different to avoid redundant records
    if (currentRate.rate === Number(newRateValue)) {
      return currentRate;
    }
    
    // Close current rate
    await electricityRateRepository.update(currentRate._id, { endDate: now });
  }

  // Create new rate
  return await electricityRateRepository.create({
    companyId,
    rate: newRateValue,
    startDate: now,
    endDate: null
  });
};
