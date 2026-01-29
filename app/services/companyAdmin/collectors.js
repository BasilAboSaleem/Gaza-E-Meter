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