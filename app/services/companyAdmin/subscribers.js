const Subscriber = require('../../models/Subscriber');
const Meter = require('../../models/Meter');
const User = require('../../models/User');

exports.createSubscriberWithMeterAndUser = async (
  companyId,
  subscriberData,
  meterData
) => {
  // 1. تحقق من وجود رقم العداد
  const existingMeter = await Meter.findOne({
    serialNumber: meterData.serialNumber
  });
  if (existingMeter) {
    throw new Error('Meter serial number already exists');
  }

  // 2. إنشاء المشترك
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

  // 3. إنشاء العداد
  const meter = await Meter.create({
    serialNumber: meterData.serialNumber,
    installationDate: meterData.installationDate || Date.now(),
    status: meterData.status,
    subscriberId: subscriber._id
  });

  // 4. ربط العداد بالمشترك
  subscriber.meterId = meter._id;
  await subscriber.save();

  // 5. إنشاء يوزر للمشترك
  const subscriberUser = await User.create({
    company: companyId,
    subscriber: subscriber._id,
    fullName: subscriber.fullName,
    phone: subscriber.phone,
    password: subscriber.phone, // 👈 كلمة مرور مؤقتة
    role: 'SUBSCRIBER',
    isActive: true
  });

  return {
    subscriber,
    meter,
    user: subscriberUser
  };
};
