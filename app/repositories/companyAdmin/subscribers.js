const Subscriber = require('../../models/Subscriber');

exports.findByCompany = async (companyId) => {
  return await Subscriber.find({ company: companyId })
    .populate('primaryArea', 'name')
    .populate('secondaryArea', 'name')
    .populate('assignedCollector', 'fullName')
    .sort({ createdAt: -1 });
};
 