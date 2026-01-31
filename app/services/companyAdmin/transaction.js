const transactionRepo = require('../../repositories/companyAdmin/transaction');
const fundRepo = require('../../repositories/companyAdmin/fund');

exports.createTransaction = async ({ companyId, type, direction, sourceFund, destinationFund, amount, description, performedBy }) => {

  // 1️⃣ تحقق أساسي
  if (!type) throw { statusCode: 400, field: 'type', message: 'نوع الحركة مطلوب' };
  if (!description || !description.trim()) throw { statusCode: 400, field: 'description', message: 'الوصف مطلوب' };
  if (!amount || amount <= 0) throw { statusCode: 400, field: 'amount', message: 'المبلغ يجب أن يكون أكبر من صفر' };

  // 2️⃣ جلب الصناديق الموجودة (إذا تم اختيارها)
  let source = null;
  let destination = null;

  if (sourceFund) {
    source = await fundRepo.findById(sourceFund);
    if (!source) throw { statusCode: 404, field: 'sourceFund', message: 'الصندوق المصدر غير موجود' };
    if (source.company.toString() !== companyId.toString()) throw { statusCode: 400, field: 'sourceFund', message: 'الصندوق المصدر لا ينتمي للشركة' };
  }

  if (destinationFund) {
    destination = await fundRepo.findById(destinationFund);
    if (!destination) throw { statusCode: 404, field: 'destinationFund', message: 'الصندوق الوجهة غير موجود' };
    if (destination.company.toString() !== companyId.toString()) throw { statusCode: 400, field: 'destinationFund', message: 'الصندوق الوجهة لا ينتمي للشركة' };
  }

  // 3️⃣ تحقق الرصيد للصندوق المصدر (إذا موجود)
  if (source && direction === 'OUT' && source.balance < amount) {
    throw { statusCode: 400, field: 'sourceFund', message: 'رصيد الصندوق المصدر غير كافي' };
  }

  // 4️⃣ إنشاء الحركة
  const transactionData = {
    company: companyId,
    type,
    direction,
    sourceFund: source ? source._id : null,
    destinationFund: destination ? destination._id : null,
    fund: destination || source, // fund عامل للتسهيل (بحسب اتجاه الحركة)
    amount,
    description,
    performedBy
  };

  const transaction = await transactionRepo.create(transactionData);

  // 5️⃣ تحديث الأرصدة تلقائيًا
  if (source && direction === 'OUT') {
    source.balance -= amount;
    await source.save();
  }

  if (destination && direction === 'IN') {
    destination.balance += amount;
    await destination.save();
  }

  // بالنسبة للـTRANSFER، خصم + إضافة
  if (type === 'TRANSFER' && source && destination) {
    source.balance -= amount;
    destination.balance += amount;
    await source.save();
    await destination.save();
  }

  return transaction;
};

exports.getTransactionsByCompany = async (companyId) => {
  return await transactionRepo.findByCompany(companyId);
}
