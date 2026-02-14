const Invoice = require('../../models/Invoice');
const MeterReading = require('../../models/meterReading');
const User = require('../../models/User');
const Area = require('../../models/Area');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');

/**
 * دالة مساعدة لإنشاء فلاتر التاريخ
 */
const getDateFilter = (filters) => {
  const { startDate, endDate } = filters;
  const query = {};
  if (startDate) query.$gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    query.$lte = end;
  }
  return Object.keys(query).length > 0 ? query : null;
};

/**
 * ملخص مالي: فواتير، تحصيلات، ديون
 */
exports.getFinancialSummary = async (companyId, filters = {}) => {
  const dateQuery = getDateFilter(filters);
  const match = { company: companyId };
  if (dateQuery) match.issueDate = dateQuery;

  const stats = await Invoice.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalInvoiced: { $sum: "$totalAmount" },
        totalPaid: { $sum: "$paidAmount" },
        totalArrears: { $sum: "$arrears" },
        count: { $sum: 1 }
      }
    }
  ]);

  const result = stats[0] || { totalInvoiced: 0, totalPaid: 0, totalArrears: 0, count: 0 };
  result.totalRemaining = result.totalInvoiced - result.totalPaid;
  result.collectionRate = result.totalInvoiced > 0 ? ((result.totalPaid / result.totalInvoiced) * 100).toFixed(1) : 0;

  return result;
};

/**
 * تحليل الاستهلاك: إجمالي الاستهلاك ومتوسطاته
 */
exports.getConsumptionAnalytics = async (companyId, filters = {}) => {
  const dateQuery = getDateFilter(filters);
  const match = { company: companyId };
  if (dateQuery) match.readingDate = dateQuery;

  const stats = await MeterReading.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalConsumption: { $sum: "$consumption" },
        avgConsumption: { $avg: "$consumption" },
        count: { $sum: 1 }
      }
    }
  ]);

  return stats[0] || { totalConsumption: 0, avgConsumption: 0, count: 0 };
};

/**
 * أداء المحصلين: عدد القراءات ونسبة التحصيل
 */
exports.getCollectorPerformance = async (companyId, filters = {}) => {
  const dateQuery = getDateFilter(filters);
  const match = { company: companyId };
  if (dateQuery) match.readingDate = dateQuery;

  const performance = await MeterReading.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$collector",
        readingsCount: { $sum: 1 },
        totalConsumption: { $sum: "$consumption" }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "collectorInfo"
      }
    },
    { $unwind: "$collectorInfo" },
    {
      $project: {
        collectorName: "$collectorInfo.fullName",
        readingsCount: 1,
        totalConsumption: 1
      }
    },
    { $sort: { readingsCount: -1 } }
  ]);

  return performance;
};

/**
 * توزيع الاستهلاك والإيرادات حسب المناطق
 */
exports.getAreaPerformance = async (companyId, filters = {}) => {
  const dateQuery = getDateFilter(filters);
  const invoiceMatch = { company: companyId };
  if (dateQuery) invoiceMatch.issueDate = dateQuery;

  const areaStats = await Invoice.aggregate([
    { $match: invoiceMatch },
    {
      $lookup: {
        from: "subscribers",
        localField: "subscriberId",
        foreignField: "_id",
        as: "subscriber"
      }
    },
    { $unwind: "$subscriber" },
    {
      $group: {
        _id: "$subscriber.primaryArea",
        revenue: { $sum: "$totalAmount" },
        collection: { $sum: "$paidAmount" },
        consumption: { $sum: "$consumption" },
        subscriberCount: { $addToSet: "$subscriberId" }
      }
    },
    {
      $lookup: {
        from: "areas",
        localField: "_id",
        foreignField: "_id",
        as: "areaInfo"
      }
    },
    { $unwind: { path: "$areaInfo", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        areaName: { $ifNull: ["$areaInfo.name", "غير محدد"] },
        revenue: 1,
        collection: 1,
        consumption: 1,
        subscribers: { $size: "$subscriberCount" }
      }
    }
  ]);

  return areaStats;
};

/**
 * تصدير البيانات إلى Excel
 */
exports.exportToExcel = async (companyId, filters = {}) => {
  const [financial, consumption, collectors, areas] = await Promise.all([
    this.getFinancialSummary(companyId, filters),
    this.getConsumptionAnalytics(companyId, filters),
    this.getCollectorPerformance(companyId, filters),
    this.getAreaPerformance(companyId, filters)
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Gaza-E-Meter';
  workbook.lastModifiedBy = 'Admin';
  workbook.created = new Date();

  // 1. Sheet: الملخص العام
  const summarySheet = workbook.addWorksheet('الملخص العام', { views: [{ rightToLeft: true }] });
  summarySheet.columns = [
    { header: 'البيان', key: 'label', width: 25 },
    { header: 'القيمة', key: 'value', width: 20 }
  ];
  summarySheet.addRows([
    { label: 'إجمالي المبالغ المفوترة', value: financial.totalInvoiced },
    { label: 'إجمالي المبالغ المحصلة', value: financial.totalPaid },
    { label: 'إجمالي الديون المتبقية', value: financial.totalRemaining },
    { label: 'نسبة التحصيل', value: financial.collectionRate + '%' },
    { label: 'إجمالي الاستهلاك (KW)', value: consumption.totalConsumption }
  ]);

  // 2. Sheet: أداء المحصلين
  const collectorSheet = workbook.addWorksheet('أداء المحصلين', { views: [{ rightToLeft: true }] });
  collectorSheet.columns = [
    { header: 'اسم المحصل', key: 'collectorName', width: 30 },
    { header: 'عدد القراءات', key: 'readingsCount', width: 15 },
    { header: 'إجمالي الاستهلاك', key: 'totalConsumption', width: 15 }
  ];
  collectorSheet.addRows(collectors);

  // 3. Sheet: أداء المناطق
  const areaSheet = workbook.addWorksheet('أداء المناطق', { views: [{ rightToLeft: true }] });
  areaSheet.columns = [
    { header: 'المنطقة', key: 'areaName', width: 25 },
    { header: 'الإيرادات', key: 'revenue', width: 15 },
    { header: 'التحصيلات', key: 'collection', width: 15 },
    { header: 'الاستهلاك', key: 'consumption', width: 15 },
    { header: 'عدد المشتركين', key: 'subscribers', width: 15 }
  ];
  areaSheet.addRows(areas);

  return workbook;
};
