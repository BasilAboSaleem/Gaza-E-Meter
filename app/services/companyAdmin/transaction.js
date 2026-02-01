const transactionRepo = require('../../repositories/companyAdmin/transaction');
const fundRepo = require('../../repositories/companyAdmin/fund');

exports.createTransaction = async ({
  companyId,
  type,
  sourceFund,
  destinationFund,
  amount,
  description,
  performedBy
}) => {

  // 1️⃣ تحقق أساسي
  if (!type) throw { statusCode: 400, field: 'type', message: 'نوع الحركة مطلوب' };
  if (!description || !description.trim()) throw { statusCode: 400, field: 'description', message: 'الوصف مطلوب' };
  if (!amount || amount <= 0) throw { statusCode: 400, field: 'amount', message: 'المبلغ يجب أن يكون أكبر من صفر' };

  // 2️⃣ جلب الصناديق
  let source = null;
  let destination = null;

  if (sourceFund) {
    source = await fundRepo.findById(sourceFund);
    if (!source) throw { statusCode: 404, field: 'sourceFund', message: 'الصندوق المصدر غير موجود' };
    if (source.company.toString() !== companyId.toString())
      throw { statusCode: 400, field: 'sourceFund', message: 'الصندوق المصدر لا ينتمي للشركة' };
  }

  if (destinationFund) {
    destination = await fundRepo.findById(destinationFund);
    if (!destination) throw { statusCode: 404, field: 'destinationFund', message: 'الصندوق الوجهة غير موجود' };
    if (destination.company.toString() !== companyId.toString())
      throw { statusCode: 400, field: 'destinationFund', message: 'الصندوق الوجهة لا ينتمي للشركة' };
  }

  // 3️⃣ تحقق الرصيد
  if (source && source.balance < amount) {
    throw { statusCode: 400, field: 'sourceFund', message: 'رصيد الصندوق المصدر غير كافي' };
  }

  const createdTransactions = [];

  // =========================
  // 🔁 TRANSFER → حركتين
  // =========================
  if (type === 'TRANSFER' && source && destination) {

    // OUT من المصدر
    const outTx = await transactionRepo.create({
      company: companyId,
      fund: source._id,
      sourceFund: source._id,
      destinationFund: destination._id,
      type,
      direction: 'OUT',
      amount,
      description,
      performedBy
    });

    // IN إلى الوجهة
    const inTx = await transactionRepo.create({
      company: companyId,
      fund: destination._id,
      sourceFund: source._id,
      destinationFund: destination._id,
      type,
      direction: 'IN',
      amount,
      description,
      performedBy,
      referenceId: outTx._id
    });

    // تحديث الأرصدة
    source.balance -= amount;
    destination.balance += amount;
    await source.save();
    await destination.save();

    createdTransactions.push(outTx, inTx);
    return createdTransactions;
  }

  // =========================
  // ➕ COLLECTION
  // =========================
  if (type === 'COLLECTION' && destination) {
    const tx = await transactionRepo.create({
      company: companyId,
      fund: destination._id,
      destinationFund: destination._id,
      type,
      direction: 'IN',
      amount,
      description,
      performedBy
    });

    destination.balance += amount;
    await destination.save();

    return [tx];
  }

  // =========================
  // ➖ EXPENSE
  // =========================
  if (type === 'EXPENSE' && source) {
    const tx = await transactionRepo.create({
      company: companyId,
      fund: source._id,
      sourceFund: source._id,
      type,
      direction: 'OUT',
      amount,
      description,
      performedBy
    });

    source.balance -= amount;
    await source.save();

    return [tx];
  }

  // =========================
  // ⚖️ ADJUSTMENT
  // =========================
  if (type === 'ADJUSTMENT') {
    if (!destination && !source)
      throw { statusCode: 400, field: 'fund', message: 'يجب تحديد صندوق للتسوية' };

    const fund = destination || source;
    const direction = destination ? 'IN' : 'OUT';

    const tx = await transactionRepo.create({
      company: companyId,
      fund: fund._id,
      sourceFund: source ? source._id : null,
      destinationFund: destination ? destination._id : null,
      type,
      direction,
      amount,
      description,
      performedBy
    });

    fund.balance += direction === 'IN' ? amount : -amount;
    await fund.save();

    return [tx];
  }

  throw { statusCode: 400, message: 'سيناريو حركة غير مدعوم' };
};


exports.getTransactionsByCompany = async (companyId) => {
  return await transactionRepo.findByCompany(companyId);
}
