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

      // تحديد مدة الاشتراك حسب النوع
    const now = new Date();
    let subscriptionEnd = new Date(now);

    switch (company.subscriptionType) {
      case 'monthly':
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
        break;
      case '3month':
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 3);
        break;
      case '6month':
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 6);
        break;
      case 'yearly':
        subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
        break;
      case 'permanent':
        subscriptionEnd = null; // دائم، لا يوجد تاريخ انتهاء
        break;
      default:
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1); // افتراضي شهر
    }


      // إنشاء الشركة
      const newCompany = await CompanyRepository.create(
        {
          ...company,
          createdBy,
          subscriptionStart: now,
          subscriptionEnd,

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

    /** 🟢 منطق تحديث مدة الاشتراك */
    if (
      company.subscriptionType &&
      company.subscriptionType !== existingCompany.subscriptionType
    ) {
      const now = new Date();
      let newSubscriptionEnd = new Date(now);

      switch (company.subscriptionType) {
        case 'monthly':
          newSubscriptionEnd.setMonth(newSubscriptionEnd.getMonth() + 1);
          break;
        case '3month':
          newSubscriptionEnd.setMonth(newSubscriptionEnd.getMonth() + 3);
          break;
        case '6month':
          newSubscriptionEnd.setMonth(newSubscriptionEnd.getMonth() + 6);
          break;
        case 'yearly':
          newSubscriptionEnd.setFullYear(newSubscriptionEnd.getFullYear() + 1);
          break;
        case 'permanent':
          newSubscriptionEnd = null;
          break;
      }

      existingCompany.subscriptionType = company.subscriptionType;
      existingCompany.subscriptionStart = now;
      existingCompany.subscriptionEnd = newSubscriptionEnd;
      existingCompany.status = 'active';
    }

    /** 🟢 تحديث باقي بيانات الشركة (بدون العبث بالاشتراك) */
    Object.keys(company).forEach(key => {
      if (
        key !== 'subscriptionType' &&
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
        if (admin.password) adminUser.password = admin.password;
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
