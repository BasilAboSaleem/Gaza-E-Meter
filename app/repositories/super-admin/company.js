const Company = require('../../models/Company');
const Plan = require('../../models/Plan');
const User = require('../../models/User');

class CompanyRepository {
   static async create(data, session) {
    const company = new Company(data);
    return company.save({ session });
  }

  static async findAllCompanies() {
    return Company.find().populate('plan').exec();
  }

   static async findById(id) {
    return Company.findById(id)
        .populate('plan')      // الباقة
        .exec();
}

    static async findByName(name) {
        return Company.findOne({ name });
    }
    static async findCompanyAdmin(companyId) {
  return User.findOne({ company: companyId, role: 'COMPANY_ADMIN' }).select('+password');
}
static async updateMany(filter, update) {
  return Company.updateMany(filter, update);
}

}

module.exports = CompanyRepository;
