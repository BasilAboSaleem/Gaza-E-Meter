const e = require('connect-flash');
const collectorRepo = require('../../repositories/companyAdmin/collectors');

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

  return newCollector;
};

exports.getCollectorsByCompany = async (companyId) => {
  return await collectorRepo.findByCompany(companyId);
};

exports.getCollectorById = async (id) => {
  return await collectorRepo.findById(id);
}

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
