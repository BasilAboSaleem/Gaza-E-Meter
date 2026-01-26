const User = require('../../models/User');

class UserRepository {
  static async create(data, session) {
    const user = new User(data);
    return user.save({ session });
  }

  static async existsByEmail(email) {
    return User.exists({ email });
  }
  static async existsByPhone(phone) {
    return User.exists({ phone });
  }
    static async findCompanyAdmin(companyId) {
    return User.findOne({
      company: companyId,
      role: 'COMPANY_ADMIN'
    }).select('+password');
  }

}

module.exports = UserRepository;
