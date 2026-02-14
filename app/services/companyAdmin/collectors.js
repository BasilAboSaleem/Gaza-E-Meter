const e = require('connect-flash');
const collectorRepo = require('../../repositories/companyAdmin/collectors');
const fundRepo = require('../../repositories/companyAdmin/fund');
const Subscriber = require('../../models/Subscriber');
const MeterReading = require('../../models/meterReading');
const Transaction = require('../../models/Transaction');
const { name } = require('ejs');

exports.createCollector = async (data, currentUser) => {
  const { fullName, email, phone, password, isActive = true } = data;

  // 1. التحقق من الحقول المطلوبة
  if (!fullName?.trim()) {
    const error = new Error('الاسم الكامل مطلوب');
    error.statusCode = 400;
    error.field = 'fullName';
    throw error;
  }

  if (!phone?.trim()) {
    const error = new Error('رقم الهاتف مطلوب');
    error.statusCode = 400;
    error.field = 'phone';
    throw error;
  }

  if (!password?.trim()) {
    const error = new Error('كلمة المرور مطلوبة');
    error.statusCode = 400;
    error.field = 'password';
    throw error;
  }

  // 2. التحقق من التكرار
  if (email && email.trim()) {
    const existing = await collectorRepo.findByEmail(email.trim());
    if (existing) {
      const error = new Error('البريد الإلكتروني مستخدم بالفعل');
      error.statusCode = 400;
      error.field = 'email';
      throw error;
    }
  }

  const existingPhone = await collectorRepo.findByPhone(phone.trim());
  if (existingPhone) {
    const error = new Error('رقم الهاتف مستخدم بالفعل');
    error.statusCode = 400;
    error.field = 'phone';
    throw error;
  }

  // 3. إنشاء المحصل
  const newCollector = await collectorRepo.create({
    company: currentUser.company,
    fullName: fullName.trim(),
    email: email?.trim() || null,
    phone: phone.trim(),
    password,                    // هيتشفر في pre-save في المودل
    role: 'COLLECTOR',
    isActive
  });

  //4. انشاء صندوق خاص بالمحصل
  await fundRepo.create({
    company: currentUser.company,
    name: `صندوق المحصل ${newCollector.fullName}`,
    type: 'COLLECTOR',
    owner: newCollector._id,
    balance: 0
  });


  return newCollector;
};

exports.getCollectorsByCompany = async (companyId) => {
  return await collectorRepo.findByCompany(companyId);
};

/**
 * جلب الملف الكامل للمحصل (عرض الأداء والمدفوعات والمشتركين)
 */
exports.getCollectorProfile = async (companyId, collectorId) => {
  const collector = await collectorRepo.findById(collectorId);
  if (!collector || collector.company.toString() !== companyId.toString()) {
    throw new Error('المحصل غير موجود');
  }

  // 1. الصندوق الخاص به
  const fund = await fundRepo.findOne({ owner: collectorId, company: companyId });

  // 2. المشتركون التابعون له
  const subscribers = await Subscriber.find({ assignedCollector: collectorId })
    .populate('primaryArea')
    .sort({ fullName: 1 });

  // 3. الأداء (القراءات والتحصيل)
  const [readingsCount, collectionsSummary, lastTransactions] = await Promise.all([
    // عدد القراءات التي قام بها
    MeterReading.countDocuments({ collector: collectorId }),
    
    // إجمالي التحصيل
    Transaction.aggregate([
      { 
        $match: { 
          company: companyId, 
          type: 'COLLECTION', 
          performedBy: collector._id 
        } 
      },
      { 
        $group: { 
          _id: null, 
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        } 
      }
    ]),

    // آخر 20 حركة في صندوقه
    Transaction.find({ fund: fund?._id })
      .populate('performedBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(20)
  ]);

  return {
    collector,
    fund,
    subscribers,
    stats: {
      readingsCount,
      totalCollected: collectionsSummary[0]?.totalAmount || 0,
      collectionsCount: collectionsSummary[0]?.count || 0
    },
    transactions: lastTransactions
  };
};

exports.getCollectorById = async (id) => {
  return await collectorRepo.findById(id);
};

exports.updateCollector = async (id, data) => {
  const collector = await collectorRepo.findById(id);
  if (!collector) {
    const error = new Error('المحصل غير موجود');
    error.statusCode = 404;
    throw error;
  }

  const { fullName, email, phone, isActive, password } = data;

  // تحديث البريد الإلكتروني إذا تغيّر
  if (email && email.trim() !== collector.email) {
    const existingEmail = await collectorRepo.findByEmail(email.trim());
    if (existingEmail) {
      const error = new Error('البريد الإلكتروني مستخدم بالفعل');
      error.statusCode = 400;
      error.field = 'email';
      throw error;
    }
    collector.email = email.trim();
  }

  // تحديث رقم الهاتف إذا تغيّر
  if (phone && phone.trim() !== collector.phone) {
    const existingPhone = await collectorRepo.findByPhone(phone.trim());
    if (existingPhone) {
      const error = new Error('رقم الهاتف مستخدم بالفعل');
      error.statusCode = 400;
      error.field = 'phone';
      throw error;
    }
    collector.phone = phone.trim();
  }

  // تحديث الاسم فقط إذا تغيّر
  if (fullName && fullName.trim() !== collector.fullName) {
    collector.fullName = fullName.trim();
  }

  // تحديث حالة التفعيل فقط إذا تغيّرت
  if (typeof isActive === 'boolean' && isActive !== collector.isActive) {
    collector.isActive = isActive;
  }

  // تحديث كلمة المرور فقط إذا أدخلت
  if (password && password.trim()) {
    collector.password = password;
  }

  await collector.save();
  return collector;
};

exports.getCollectorsByCompany = async (companyId) => {
  return await collectorRepo.findByCompany(companyId);
};