const mongoose = require('mongoose');

const Subscriber = require('../../models/Subscriber');
const Meter = require('../../models/Meter');
const User = require('../../models/User');
const Invoice = require('../../models/Invoice');
const MeterReading = require('../../models/meterReading');
const Transaction = require('../../models/Transaction');
const subscriberRepository = require('../../repositories/companyAdmin/subscribers');

exports.createSubscriberWithMeterAndUser = async (companyId, subscriberData, meterData) => {
  // 1️⃣ التحقق من وجود المشترك في نفس الشركة بواسطة رقم الهاتف
  const existingSubscriber = await Subscriber.findOne({
    company: companyId,
    phone: subscriberData.phone
  });
  if (existingSubscriber) {
    throw new Error('رقم الهاتف موجود مسبقاً داخل نفس الشركة');
  }

  // 2️⃣ التحقق من وجود يوزر لنفس المشترك داخل نفس الشركة
  const existingUser = await User.findOne({
    company: companyId,
    phone: subscriberData.phone
  });
  if (existingUser) {
    throw new Error('يوزر بنفس رقم الهاتف موجود مسبقاً داخل نفس الشركة');
  }

  // 3️⃣ إذا أردنا التحقق من العداد مسبقًا، يجب أن يكون لدينا subscriberId
  const existingMeter = await Meter.findOne({
    company: companyId,
    serialNumber: meterData.serialNumber
  });
  if (existingMeter) {
    throw new Error('رقم العداد موجود مسبقاً');
  }

  // ✅ كل التحققات نجحت، الآن نبدأ بإنشاء السجلات

  // 4️⃣ إنشاء المشترك
  const subscriber = await Subscriber.create({
    company: companyId,
    fullName: subscriberData.fullName,
    phone: subscriberData.phone,
    nationalId: subscriberData.nationalId,
    address: subscriberData.address,
    primaryArea: subscriberData.primaryArea,
    secondaryArea: subscriberData.secondaryArea,
    type: subscriberData.type,
    collectionFrequency: subscriberData.collectionFrequency,
    assignedCollector: subscriberData.assignedCollector,
    isActive: subscriberData.isActive
  });

  // 5️⃣ إنشاء العداد وربطه بالمشترك
  const meter = await Meter.create({
    company: companyId,
    serialNumber: meterData.serialNumber,
    initialReading: meterData.initialReading || 0,
    installationDate: meterData.installationDate || Date.now(),
    status: meterData.status,
    subscriberId: subscriber._id
  });

  subscriber.meterId = meter._id;
  await subscriber.save();

  // 6️⃣ إنشاء يوزر للمشترك
  const subscriberUser = await User.create({
    company: companyId,
    subscriber: subscriber._id,
    fullName: subscriber.fullName,
    phone: subscriber.phone,
    password: subscriber.phone, // كلمة مرور مؤقتة
    role: 'SUBSCRIBER',
    isActive: true
  });

  return {
    subscriber,
    meter,
    user: subscriberUser
  };
};


exports.getSubscribersByCompany = async (companyId) => {
  return await subscriberRepository.findByCompany(companyId);
};

/**
 * جلب تفاصيل المشترك الكاملة (الملف الشخصي، القراءات، الفواتير)
 */
exports.getSubscriberDetails = async (companyId, subscriberId) => {
  const subscriber = await Subscriber.findOne({ _id: subscriberId, company: companyId })
    .populate('primaryArea')
    .populate('secondaryArea')
    .populate('meterId')
    .populate('assignedCollector');

  if (!subscriber) throw new Error('المشترك غير موجود');

  const [readings, invoices] = await Promise.all([
    MeterReading.find({ subscriber: subscriberId }).populate('collector').sort({ readingDate: -1 }),
    Invoice.find({ subscriberId: subscriberId }).sort({ issueDate: -1 })
  ]);

  const mongoose = require('mongoose');
  const invoiceIds = invoices.map(inv => inv._id);

  const transactions = await Transaction.find({
    company: companyId,
    type: 'COLLECTION',
    $or: [
      { 'metadata.subscriberId': new mongoose.Types.ObjectId(subscriberId) },
      { 'metadata.invoiceId': { $in: invoiceIds } }
    ]
  }).populate('performedBy').sort({ createdAt: -1 });

  // حساب الملخص المالي
  const financialSummary = invoices.reduce((acc, inv) => {
    acc.totalInvoiced += inv.totalAmount;
    acc.totalPaid += inv.paidAmount;
    acc.totalRemaining += inv.remainingAmount;
    if (inv.status !== 'PAID') acc.unpaidBillsCount += 1;
    return acc;
  }, { totalInvoiced: 0, totalPaid: 0, totalRemaining: 0, unpaidBillsCount: 0 });

  return {
    subscriber,
    readings,
    invoices,
    transactions,
    financialSummary,
    lastReading: readings[0] || null,
    lastInvoice: invoices[0] || null
  };
};

exports.updateSubscriberWithMeter = async (
  companyId,
  subscriberId,
  subscriberData = {},
  meterData = {}
) => {

  const subscriber = await Subscriber.findOne({
    _id: subscriberId,
    company: companyId
  });

  if (!subscriber) throw new Error('المشترك غير موجود');

  const meter = await Meter.findOne({
    _id: subscriber.meterId,
    company: companyId
  });

  /*
  =========================
  🔎 1️⃣ التحقق من رقم الهاتف
  =========================
  */
  if (
    subscriberData.phone &&
    subscriberData.phone !== subscriber.phone
  ) {
    const existingPhone = await Subscriber.findOne({
      company: companyId,
      phone: subscriberData.phone,
      _id: { $ne: subscriberId }
    });

    if (existingPhone) {
      throw new Error('رقم الهاتف مستخدم مسبقاً');
    }
  }

  /*
  =========================
  🔎 2️⃣ التحقق من رقم العداد
  =========================
  */
  if (
    meter &&
    meterData.serialNumber &&
    meterData.serialNumber !== meter.serialNumber
  ) {
    const existingMeter = await Meter.findOne({
      company: companyId,
      serialNumber: meterData.serialNumber,
      _id: { $ne: meter._id }
    });

    if (existingMeter) {
      throw new Error('رقم العداد مستخدم مسبقاً');
    }
  }

  /*
  =========================
  ✏️ 3️⃣ تحديث المشترك فقط بالحقول المرسلة
  =========================
  */

  Object.keys(subscriberData).forEach(key => {
    if (
      subscriberData[key] !== undefined &&
      subscriberData[key] !== null
    ) {
      subscriber[key] = subscriberData[key];
    }
  });

  await subscriber.save();

  /*
  =========================
  ✏️ 4️⃣ تحديث العداد
  =========================
  */

  if (meter) {
    Object.keys(meterData).forEach(key => {
      if (
        meterData[key] !== undefined &&
        meterData[key] !== null
      ) {
        meter[key] = meterData[key];
      }
    });

    await meter.save();
  }

  return {
    subscriber,
    meter
  };
};

exports.deleteSubscriber = async (companyId, subscriberId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const subscriber = await Subscriber.findOne({
      _id: subscriberId,
      company: companyId
    }).session(session);

    if (!subscriber) {
      throw new Error('المشترك غير موجود');
    }

    // حذف العداد
    const meter = await Meter.findOne({
      subscriber: subscriber._id
    }).session(session);

    if (meter) {
      // حذف القراءات
      await Reading.deleteMany({
        meter: meter._id
      }).session(session);

      // حذف الفواتير
      await Invoice.deleteMany({
        subscriber: subscriber._id
      }).session(session);

      await Meter.deleteOne({
        _id: meter._id
      }).session(session);
    }

    // حذف المستخدم المرتبط
    if (subscriber.user) {
      await User.deleteOne({
        _id: subscriber.user
      }).session(session);
    }

    // حذف المشترك
    await Subscriber.deleteOne({
      _id: subscriber._id
    }).session(session);

    await session.commitTransaction();
    session.endSession();

    return true;

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};