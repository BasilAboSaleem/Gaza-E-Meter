const fundRepo = require('../../repositories/companyAdmin/fund');
const transactionRepo = require('../../repositories/companyAdmin/transaction');

exports.getFundsByCompany = async (companyId) => {
    return await fundRepo.findByCompany(companyId);
};


exports.createFund = async ({
  companyId,
  name,
  type,
  currency = 'شيكل',
  notes
}) => {
  // 1️⃣ Validation أساسي
  if (!name || !name.trim()) {
    const err = new Error('اسم الصندوق مطلوب');
    err.statusCode = 400;
    err.field = 'name';
    throw err;
  }

  if (!type) {
    const err = new Error('نوع الصندوق مطلوب');
    err.statusCode = 400;
    err.field = 'type';
    throw err;
  }

  // 2️⃣ منع إنشاء أنواع غير مسموحة
  const ALLOWED_TYPES = ['BANK', 'EXPENSES', 'OTHER'];

  if (!ALLOWED_TYPES.includes(type)) {
    const err = new Error('نوع الصندوق غير مسموح');
    err.statusCode = 400;
    err.field = 'type';
    throw err;
  }

  // 3️⃣ منع التكرار داخل نفس الشركة
  const exists = await fundRepo.findOne({
    company: companyId,
    name: name.trim()
  });

  if (exists) {
    const err = new Error('يوجد صندوق بنفس الاسم داخل الشركة');
    err.statusCode = 400;
    err.field = 'name';
    throw err;
  }

  // 4️⃣ إنشاء الصندوق
  const fund = await fundRepo.create({
    company: companyId,
    name: name.trim(),
    type,
    owner: null,
    balance: 0,
    currency,
    notes
  });

  return fund;
};

exports.getFundById = async (fundId) => {
    return await fundRepo.findById(fundId);
};

exports.getFundTransactions = async (fundId) => {
  return await transactionRepo.findByFund(fundId);
};


exports.getFundsByCompany = async (companyId) => {
    return await fundRepo.findByCompany(companyId);
}

