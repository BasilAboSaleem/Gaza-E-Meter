const MeterReading = require('../../models/meterReading');
const Invoice = require('../../models/Invoice');
const Subscriber = require('../../models/Subscriber');
const User = require('../../models/User');
const Area = require('../../models/Area');

exports.getCompanyAdminStats = async (companyId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 1. Readings today
  const readingsToday = await MeterReading.countDocuments({
    company: companyId,
    readingDate: { $gte: today, $lt: tomorrow }
  });

  // 2. Invoices issued today
  const invoicesToday = await Invoice.countDocuments({
    company: companyId,
    issueDate: { $gte: today, $lt: tomorrow }
  });

  // 3. Total consumption today
  const consumptionResult = await MeterReading.aggregate([
    { $match: { company: companyId, readingDate: { $gte: today, $lt: tomorrow } } },
    { $group: { _id: null, total: { $sum: "$consumption" } } }
  ]);
  const totalConsumptionToday = consumptionResult[0]?.total || 0;

  // 4. Total Invoiced Amount & Collection Ratio
  const invoiceStats = await Invoice.aggregate([
    { $match: { company: companyId } },
    { 
      $group: { 
        _id: null, 
        totalValue: { $sum: "$totalAmount" },
        totalPaid: { $sum: "$paidAmount" }
      } 
    }
  ]);

  const totalInvoicedAmount = invoiceStats[0]?.totalValue || 0;
  const totalPaid = invoiceStats[0]?.totalPaid || 0;
  const collectionRatio = totalInvoicedAmount > 0 ? (totalPaid / totalInvoicedAmount) * 100 : 0;

  // 5. Additional Entity Counts
  const [totalSubscribers, totalCollectors, totalAreas] = await Promise.all([
    Subscriber.countDocuments({ company: companyId }),
    User.countDocuments({ company: companyId, role: 'COLLECTOR' }),
    Area.countDocuments({ company: companyId })
  ]);

  return {
    readingsToday,
    invoicesToday,
    totalConsumptionToday,
    totalInvoicedAmount,
    collectionRatio: collectionRatio.toFixed(1),
    totalSubscribers,
    totalCollectors,
    totalAreas
  };
};
