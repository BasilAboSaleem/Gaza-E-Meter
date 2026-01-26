const mongoose = require('mongoose');
const CompanyRepository = require('../../repositories/super-admin/company');
const UserRepository = require('../../repositories/super-admin/user');
const User = require('../../models/User');

class CompanyService {

  static async findAllCompanies() {
    return CompanyRepository.findAllCompanies();
  }

  static async createCompanyWithAdmin({ company, admin, createdBy }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // تأكد أن الإيميل غير مستخدم
      const emailExists = await UserRepository.existsByEmail(admin.email);
      if (emailExists) {
        throw new Error('البريد الإلكتروني مستخدم مسبقًا');
      }
      const phoneExists = await UserRepository.existsByPhone(admin.phone);
      if (phoneExists) {
        throw new Error('رقم الهاتف مستخدم مسبقًا');
      }
      const nameExists = await CompanyRepository.findByName(company.name);
      if (nameExists) {
        throw new Error('اسم الشركة مستخدم مسبقًا');
      }

      // إنشاء الشركة
      const newCompany = await CompanyRepository.create(
        {
          ...company,
          createdBy,
          subscriptionStart: new Date(),
          subscriptionEnd: new Date(
            new Date().setMonth(new Date().getMonth() + 1)
          )
        },
        session
      );

      // إنشاء مدير الشركة
      const adminUser = await UserRepository.create(
        {
          fullName: admin.fullName,
          email: admin.email,
          phone: admin.phone,
          password: admin.password,
          role: 'COMPANY_ADMIN',
          company: newCompany._id
        },
        session
      );

      await session.commitTransaction();
      session.endSession();

      return { company: newCompany, admin: adminUser };

    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }


  static async findCompanyWithAdmin(companyId) {
    const company = await CompanyRepository.findById(companyId);
    if (!company) throw new Error('الشركة غير موجودة');

    const admin = await UserRepository.findCompanyAdmin(companyId);
    if (!admin) throw new Error('مدير الشركة غير موجود');

    return { company, admin };
  }

 
  static async updateCompanyWithAdmin(companyId, { company, admin }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existingCompany = await CompanyRepository.findById(companyId);
      if (!existingCompany) throw new Error('الشركة غير موجودة');

      const adminUser = await UserRepository.findCompanyAdmin(companyId);
      if (!adminUser) throw new Error('مدير الشركة غير موجود');

      /** 🟢 تحديث بيانات الشركة */
      Object.keys(company).forEach(key => {
        if (
          company[key] !== undefined &&
          company[key]?.toString() !== existingCompany[key]?.toString()
        ) {
          existingCompany[key] = company[key];
        }
      });

      await existingCompany.save({ session });

      /** 🟢 تحديث بيانات المدير */
      Object.keys(admin).forEach(key => {
        if (key === 'password') {
          if (admin.password) {
            adminUser.password = admin.password;
          }
        } else if (
          admin[key] !== undefined &&
          admin[key] !== adminUser[key]
        ) {
          adminUser[key] = admin[key];
        }
      });

      await adminUser.save({ session });

      await session.commitTransaction();
      session.endSession();

      return true;

    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  static async autoExpireCompanies() {
  const now = new Date();

  await CompanyRepository.updateMany(
    {
      status: 'active',
      subscriptionEnd: { $lt: now }
    },
    {
      $set: { status: 'expired' }
    }
  );
}

}





module.exports = CompanyService;
