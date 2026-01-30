const e = require('connect-flash');
const Fund = require('../../models/Fund');

exports.create = async (data) => {
  const fund = new Fund(data);
  return await fund.save();
};
exports.findById = async (id) => {
    return await Fund.findById(id)
    .populate({
        path: 'owner',
        select: 'fullName email phone role isActive'
    });
};
exports.findByCompany = async (companyId) => {
  return Fund.find({
    company: companyId
  })
    .populate({
      path: 'owner',
      select: 'fullName email phone role isActive'
    })
    .sort({ createdAt: -1 });
};

exports.findOne = async (query) => {
  return await Fund.findOne(query);
};