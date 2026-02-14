const MeterReading = require('../../models/meterReading');

exports.findReadings = async (companyId, filters = {}) => {
  const query = { company: companyId };

  if (filters.collector) query.collector = filters.collector;
  if (filters.status) query.status = filters.status;
  if (filters.subscriber) query.subscriber = filters.subscriber;
  
  if (filters.startDate || filters.endDate) {
    query.readingDate = {};
    if (filters.startDate) query.readingDate.$gte = new Date(filters.startDate);
    if (filters.endDate) query.readingDate.$lte = new Date(filters.endDate);
  }

  return await MeterReading.find(query)
    .populate('subscriber', 'fullName nationalId phone')
    .populate('collector', 'fullName')
    .sort({ readingDate: -1 });
};

exports.findById = async (id) => {
  return await MeterReading.findById(id)
    .populate('subscriber')
    .populate('collector', 'fullName');
};

exports.updateStatus = async (id, status, extraFields = {}) => {
  return await MeterReading.findByIdAndUpdate(
    id,
    { status, ...extraFields },
    { new: true }
  );
};

exports.getSubscriberReadingsAvg = async (subscriberId, limit = 3) => {
  const readings = await MeterReading.find({ 
    subscriber: subscriberId, 
    status: 'INVOICED' 
  })
  .sort({ readingDate: -1 })
  .limit(limit);

  if (readings.length === 0) return 0;
  
  const totalConsumption = readings.reduce((sum, r) => sum + (r.consumption || 0), 0);
  return totalConsumption / readings.length;
};
