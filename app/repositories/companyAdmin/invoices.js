const Invoice = require('../../models/Invoice');
const Subscriber = require('../../models/Subscriber');

exports.findInvoices = async (companyId, filters = {}) => {
  const query = { company: companyId };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.subscriberName) {
    // We need to find subscribers first or use aggregate
    const subscribers = await Subscriber.find({
      company: companyId,
      fullName: { $regex: filters.subscriberName, $options: 'i' }
    }).select('_id');
    query.subscriberId = { $in: subscribers.map(s => s._id) };
  }

  if (filters.startDate || filters.endDate) {
    query.issueDate = {};
    if (filters.startDate) query.issueDate.$gte = new Date(filters.startDate);
    if (filters.endDate) query.issueDate.$lte = new Date(filters.endDate);
  }

  return await Invoice.find(query)
    .populate('subscriberId', 'fullName phone nationalId')
    .populate('readingId')
    .sort({ issueDate: -1 });
};

exports.findById = async (id) => {
  return await Invoice.findById(id).populate('subscriberId');
};

exports.update = async (id, data) => {
  return await Invoice.findByIdAndUpdate(id, data, { new: true });
};

exports.findUnpaidBySubscriber = async (subscriberId) => {
  return await Invoice.find({
    subscriberId,
    status: { $in: ['UNPAID', 'PARTIAL'] }
  });
};
