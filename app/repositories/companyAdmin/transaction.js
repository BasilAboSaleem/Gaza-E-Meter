const Transaction = require('../../models/Transaction');

exports.create = async (data) => {
  const transaction = new Transaction(data);
  return await transaction.save();
};

exports.findByCompany = async (companyId) => {
  return Transaction.find({ company: companyId })
    .populate({
      path: 'fund sourceFund destinationFund performedBy',
      select: 'name fullName email phone'
    })
    .sort({ createdAt: -1 });
};
