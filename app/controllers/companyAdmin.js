const e = require('connect-flash');
const areaService = require('../services/companyAdmin/areas');
const collectorService = require('../services/companyAdmin/collectors');
const subscriberService = require('../services/companyAdmin/subscribers');
const fundService = require('../services/companyAdmin/funds');
const transactionService = require('../services/companyAdmin/transaction');
const electricityRateService = require('../services/companyAdmin/electricityRate');
const readingService = require('../services/companyAdmin/readings');
const invoiceService = require('../services/companyAdmin/invoices');
const reportService = require('../services/companyAdmin/reports');

exports.listReadings = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const { collector, status, startDate, endDate } = req.query;
    
    // Get collectors for filter dropdown
    const collectors = await collectorService.getCollectorsByCompany(companyId);
    
    const readings = await readingService.getReadingsByCompany(companyId, {
      collector,
      status,
      startDate,
      endDate
    });

    res.render('dashboard/companyAdmin/readings/list', {
      title: 'قراءات المحصلين',
      readings,
      collectors,
      filters: { collector, status, startDate, endDate }
    });
  } catch (error) {
    next(error);
  }
};

exports.approveReading = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 1. Approve reading (sets status to REVIEW)
    await readingService.approveReading(id);
    
    // 2. Generate Invoice immediately
    const invoice = await invoiceService.generateInvoiceFromReading(id);

    res.json({ 
      message: 'تم اعتماد القراءة وإصدار الفاتورة بنجاح',
      invoiceId: invoice._id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'حدث خطأ أثناء اعتماد القراءة' });
  }
};

exports.rejectReading = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'سبب الرفض مطلوب' });
    }

    await readingService.rejectReading(id, reason);
    res.json({ message: 'تم رفض القراءة بنجاح' });
  } catch (error) {
    next(error);
  }
};

exports.listInvoices = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const { subscriberName, status, startDate, endDate } = req.query;

    const invoices = await invoiceService.getInvoicesForAdmin(companyId, {
      subscriberName,
      status,
      startDate,
      endDate
    });

    res.render('dashboard/companyAdmin/invoices/list', {
      title: 'إدارة الفواتير',
      invoices,
      filters: { subscriberName, status, startDate, endDate }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateInvoicePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, method, proof } = req.body;
    const performedBy = req.user._id;

    await invoiceService.processPayment(id, { amount, method, proof }, performedBy);

    res.json({ message: 'تم تحديث الدفعة بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'حدث خطأ أثناء تحديث الدفعة' });
  }
};

exports.listPayments = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const { subscriberName, method, startDate, endDate } = req.query;

    const payments = await invoiceService.getPaymentsForAdmin(companyId, {
      subscriberName,
      method,
      startDate,
      endDate
    });

    res.render('dashboard/companyAdmin/payments/list', {
      title: 'سجل الدفعات',
      payments,
      filters: { subscriberName, method, startDate, endDate }
    });
  } catch (error) {
    next(error);
  }
};

exports.showSettingsPage = async (req, res, next) => {
  try {
    res.render('dashboard/companyAdmin/settings/index', {
      title: 'الإعدادات'
    });
  } catch (error) {
    next(error);
  }
};

exports.showElectricityRateSettings = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const currentRate = await electricityRateService.getCurrentRate(companyId);
    const history = await electricityRateService.getRateHistory(companyId);

    res.render('dashboard/companyAdmin/settings/electricity-rate', {
      title: 'إعدادات سعر الكيلو واط',
      currentRate,
      history
    });
  } catch (error) {
    next(error);
  }
};

exports.updateElectricityRate = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const { rate } = req.body;

    if (!rate || isNaN(rate) || rate <= 0) {
      return res.status(400).json({ errors: { rate: 'يرجى إدخال سعر صحيح (رقم أكبر من 0)' } });
    }

    await electricityRateService.updateRate(companyId, rate);

    res.json({ message: 'تم تحديث سعر الكيلو واط بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث السعر' });
  }
};
exports.showCreateAreaForm = (req, res) => {
  res.render("dashboard/companyAdmin/areas/add-area", {
    title: 'إضافة منطقة'
  });
}



exports.createArea = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const companyId = req.user.company;

    // Validate
    if (!name || name.trim() === '') {
      return res.status(400).json({ errors: { name: 'اسم المنطقة مطلوب' } });
    }

    const area = await areaService.createPrimaryArea({ companyId, name, description, isActive });
    return res.status(201).json(area);
  } catch (err) {
    console.error(err);
      if (err.statusCode === 400) {
      return res.status(400).json({ errors: { [err.field]: err.message } });
    }
    return res.status(500).json({ message: 'حدث خطأ أثناء إنشاء المنطقة' });
  }
};

exports.listMainAreas = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const areas = await areaService.getPrimaryAreas(companyId);

    return res.render('dashboard/companyAdmin/areas/main-areas', {
      title: 'المناطق الرئيسية',
      areas
    });
  } catch (error) {
    next(error);
  }
};

exports.showMainAreaDetails = async (req, res, next) => {
  try {
    const areaId = req.params.id;
    const companyId = req.user.company;

    const result = await areaService.getPrimaryAreaWithSubAreas(areaId);

    if (!result) {
      return res.status(404).render('errors/404', {
        message: 'المنطقة غير موجودة'
      });
    }

    const { area, subAreas } = result;

    return res.render('dashboard/companyAdmin/areas/show-main-area', {
      title: 'تفاصيل المنطقة الرئيسية',
      area,
      subAreas
    });
  } catch (error) {
    next(error);
  }
};


exports.showCreateSubAreaForm = async (req, res, next) => {
  try {
    const areaId = req.params.id;
    const area = await areaService.getPrimaryArea(areaId);
    if (!area) {
      return res.status(404).send('المنطقة غير موجودة');
    }

    return res.render('dashboard/companyAdmin/areas/add-sub-area', {
      title: 'إضافة منطقة فرعية',
      area
    });
  } catch (error) {
    next(error);
  }
};

exports.createSubArea = async (req, res) => {
  try {
    const parentAreaId = req.params.id; // ✅
    const companyId = req.user.company;
    const { name, description, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        errors: { name: 'اسم المنطقة مطلوب' }
      });
    }

    const area = await areaService.createSubArea({
      companyId,
      parentAreaId,
      name,
      description,
      isActive
    });

    return res.status(201).json(area);
  } catch (err) {
    console.error(err);

    if (err.statusCode === 400) {
      return res.status(400).json({
        errors: { [err.field]: err.message }
      });
    }

    return res.status(500).json({
      message: 'حدث خطأ أثناء إنشاء المنطقة الفرعية'
    });
  }
};

exports.showEditAreaForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company;

    const area = await areaService.getAreaById(companyId, id);

    if (!area) {
      return res.status(404).render('errors/404');
    }

    res.render('dashboard/companyAdmin/areas/edit-area', {
      title: 'تعديل المنطقة',
      area
    });
  } catch (err) {
    next(err);
  }
};

exports.updateArea = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company;
    const { name, description, isActive } = req.body;

    // ⚡ مرر companyId و id بشكل صحيح
    const updatedArea = await areaService.updateArea(companyId, id, {
      name,
      description,
      isActive
    });

    res.json({
      message: 'Area updated successfully',
      area: updatedArea
    });
  } catch (err) {
    next(err);
  }
};


exports.showCreateCollectorForm = (req, res) => {
  res.render("dashboard/companyAdmin/collectors/add-collector", {
    title: 'إضافة محصل'
  });
};
exports.createCollector = async (req, res) => {
  try {
    const { fullName, email, phone, password, isActive } = req.body;
    const companyId = req.user.company;

    // التحققات البسيطة (اختياري، ممكن تحطها في السيرفس بس)
    if (!fullName?.trim()) return res.status(400).json({ errors: { fullName: 'الاسم الكامل مطلوب' } });
    if (!phone?.trim())    return res.status(400).json({ errors: { phone: 'رقم الهاتف مطلوب' } });
    if (!password?.trim()) return res.status(400).json({ errors: { password: 'كلمة المرور مطلوبة' } });

    const collector = await collectorService.createCollector(
      { fullName, email, phone, password, isActive, companyId },
      req.user   // ← هنا بنمرر اليوزر كامل عشان ناخد company منه
    );

    return res.status(201).json({
      message: 'تم إنشاء المحصل بنجاح',
      collector
    });
  } catch (err) {
    console.error(err);

    if (err.statusCode === 400) {
      return res.status(400).json({
        errors: { [err.field]: err.message }
      });
    }

    return res.status(500).json({
      message: 'حدث خطأ أثناء إنشاء المحصل'
    });
  }
};

exports.listCollectors = async (req, res, next) => {
  try {
    // جلب المحصلين التابعين لشركة اليوزر الحالي
    const companyId = req.user.company;
    const collectors = await collectorService.getCollectorsByCompany(companyId);
    return res.render('dashboard/companyAdmin/collectors/collectors', {
      title: 'المحصلين',
      collectors
    });
  } catch (error) {
    next(error);
  }
};

/**
 * عرض صفحة ملف المحصل الكامل
 */
exports.showCollectorProfile = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const collectorId = req.params.id;

    const profileData = await collectorService.getCollectorProfile(companyId, collectorId);

    res.render('dashboard/companyAdmin/collectors/collector-details', {
      title: 'ملف المحصل',
      ...profileData
    });
  } catch (error) {
    next(error);
  }
};

exports.showEditCollectorForm = async (req, res, next) => {
  try {
    const collectorId = req.params.id;
    const collector = await collectorService.getCollectorById(collectorId);
    if (!collector) {
      return res.status(404).render('errors/404', {
        message: 'المحصل غير موجود'
      });
    }
    return res.render('dashboard/companyAdmin/collectors/edit-collector', {
      title: 'تعديل بيانات المحصل',
      collector
    });
  }
  catch (error) {
    next(error);
  }
};

exports.updateCollector = async (req, res, next) => {
  try {
    const collectorId = req.params.id;
    const { fullName, email, phone, password, isActive } = req.body;
    // هنا ممكن تضيف تحقق من البيانات لو حبيت

    const updatedCollector = await collectorService.updateCollector(collectorId, {
      fullName,
      email,
      phone,
      password,
      isActive
    });
    return res.json({
      message: 'تم تحديث بيانات المحصل بنجاح',
      collector: updatedCollector
    });
  } catch (error) {
    next(error);
  }
};

// عرض الفورم مع المناطق الرئيسية فقط
exports.showCreateSubscriberForm = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const collectors = await collectorService.getCollectorsByCompany(companyId);
    const areas = await areaService.getPrimaryAreasByCompany(companyId); // مناطق رئيسية فقط

    res.render("dashboard/companyAdmin/subscribers/add-subscriber", {
      title: 'إضافة مشترك جديد',
      collectors,
      areas
    });
  } catch (error) {
    next(error);
  }
};

// endpoint لجلب المناطق الفرعية عند اختيار منطقة رئيسية
// controllers/companyAdmin/areas.js
exports.getSubAreas = async (req, res) => {
  try {
    console.log({
  company: req.user.company,
  primaryArea: req.params.id
});
    const companyId = req.user.company;
    const { id: primaryAreaId } = req.params;

    const subAreas = await areaService.getSubAreasByPrimaryArea(
      companyId,
      primaryAreaId
    );

    res.json(subAreas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'حدث خطأ أثناء جلب المناطق الفرعية' });
  }
};

exports.createSubscriber = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const { subscriber, meter } = req.body;

    await subscriberService.createSubscriberWithMeterAndUser(
      companyId,
      subscriber,
      meter
    );

    res.status(201).json({ message: 'Subscriber created successfully' });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      message: err.message || 'Failed to create subscriber'
    });
  }
};

exports.showSubscribersPage = async (req, res, next) => {
  try {
    const companyId = req.user.company;

    // جلب المشتركين مع العلاقات
    const subscribers = await subscriberService.getSubscribersByCompany(companyId);

    // جلب المناطق الرئيسية (للفلاتر)
    const primaryAreas = await areaService.getPrimaryAreasByCompany(companyId);

    res.render('dashboard/companyAdmin/subscribers/subscribers', {
      title: 'إدارة المشتركين',
      subscribers,
      primaryAreas
    });
  } catch (err) {
    next(err);
  }
};

exports.listFunds = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const funds = await fundService.getFundsByCompany(companyId);

    return res.render('dashboard/companyAdmin/funds/funds', {
      title: 'إدارة الصناديق',
      funds
    });
  } catch (error) {
    next(error);
  }
};

exports.showCreateFundForm = (req, res) => {
  res.render("dashboard/companyAdmin/funds/add-fund", {
    title: 'إضافة صندوق'
  });
}

exports.createFund = async (req, res, next) => {
  try {
    const { name, type, currency, notes } = req.body; // ✅ type موجود الآن
    const companyId = req.user.company;

    // Validate اسم الصندوق فقط (type يتم التحقق منه بالسيرفس)
    if (!name || name.trim() === '') {
      return res.status(400).json({ errors: { name: 'اسم الصندوق مطلوب' } });
    }

    const fund = await fundService.createFund({
      companyId,
      name,
      type,
      currency,
      notes
    });

    return res.status(201).json(fund);
  } catch (err) {
    console.error(err);

    if (err.statusCode === 400) {
      return res.status(400).json({ errors: { [err.field]: err.message } });
    }

    next(err);
  }
};

exports.showFundDetails = async (req, res, next) => {
  try {
    const fundId = req.params.id;
    const companyId = req.user.company;

    // جلب تفاصيل الصندوق
    const fund = await fundService.getFundById(fundId);

    if (!fund) {
      return res.status(404).render('errors/404', {
        message: 'الصندوق غير موجود'
      });
    }

    // جلب الحركات الخاصة بالصندوق
    const transactions = await fundService.getFundTransactions(fundId);

    return res.render('dashboard/companyAdmin/funds/show-fund', {
      title: 'تفاصيل الصندوق',
      fund,
      transactions
    });
  } catch (error) {
    next(error);
  }
};

exports.showCreateTransactionForm = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const funds = await fundService.getFundsByCompany(companyId);
    return res.render('dashboard/companyAdmin/transactions/add-transaction', {
      title: 'إضافة حركة مالية',
      funds
    });
  } catch (error) {
    next(error);
  }
};

exports.createTransaction = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const performedBy = req.user._id;

    const { type, sourceFund, destinationFund, amount, description } = req.body;

    const transactions = await transactionService.createTransaction({
      companyId,
      type,
      sourceFund: sourceFund || null,
      destinationFund: destinationFund || null,
      amount,
      description,
      performedBy
    });

    return res.status(201).json({ transactions });
  } catch (err) {
    console.error(err);
    if (err.statusCode) {
      return res
        .status(err.statusCode)
        .json({ errors: { [err.field]: err.message } });
    }
    next(err);
  }
};


exports.listTransactions = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const transactions = await transactionService.getTransactionsByCompany(companyId);
    return res.render('dashboard/companyAdmin/transactions/transactions', {
      title: 'الحركات المالية',
      transactions
    });
  }
  catch (error) {
    next(error);
  }
};

/**
 * تقارير مخصصة للشركة
 */
/**
 * تقارير مخصصة للشركة
 */
exports.getReportsDashboard = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const { startDate, endDate } = req.query;
    const filters = { startDate, endDate };

    const [financial, consumption, collectors, areas] = await Promise.all([
      reportService.getFinancialSummary(companyId, filters),
      reportService.getConsumptionAnalytics(companyId, filters),
      reportService.getCollectorPerformance(companyId, filters),
      reportService.getAreaPerformance(companyId, filters)
    ]);

    res.render('dashboard/companyAdmin/reports/index', {
      title: 'التقارير والإحصائيات',
      financial,
      consumption,
      collectors,
      areas,
      filters
    });
  } catch (error) {
    next(error);
  }
};

/**
 * صفحة تقرير استهلاك المناطق التفصيلي
 */
exports.getAreaConsumptionReport = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const { startDate, endDate } = req.query;
    const filters = { startDate, endDate };

    const areasStats = await reportService.getAreaPerformance(companyId, filters);

    // Calculate totals for summary cards
    const totalConsumption = areasStats.reduce((sum, area) => sum + area.consumption, 0);
    const totalRevenue = areasStats.reduce((sum, area) => sum + area.revenue, 0);
    const maxConsumptionArea = areasStats.reduce((max, area) => area.consumption > (max?.consumption || 0) ? area : max, null);

    res.render('dashboard/companyAdmin/reports/area-consumption', {
      title: 'تقرير استهلاك المناطق',
      areas: areasStats,
      summary: {
        totalAreas: areasStats.length,
        totalConsumption,
        totalRevenue,
        maxConsumptionArea
      },
      filters
    });
  } catch (error) {
    next(error);
  }
};

/**
 * تصدير التقارير بصيغة Excel
 */
exports.exportReportsExcel = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const { startDate, endDate } = req.query;
    const filters = { startDate, endDate };

    const workbook = await reportService.exportToExcel(companyId, filters);
    
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Report-${new Date().toISOString().split('T')[0]}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

/**
 * تصدير التقارير بصيغة PDF
 */
exports.exportReportsPDF = async (req, res, next) => {
  try {
    const PDFDocument = require('pdfkit');
    const companyId = req.user.company;
    const { startDate, endDate } = req.query;
    const filters = { startDate, endDate };

    const [financial, consumption] = await Promise.all([
      reportService.getFinancialSummary(companyId, filters),
      reportService.getConsumptionAnalytics(companyId, filters)
    ]);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Report-${new Date().toISOString().split('T')[0]}.pdf`
    );

    doc.pipe(res);

    // PDF Content (Simple English/Arabic fallback)
    doc.fontSize(20).text('Gaza-E-Meter Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Date Range: ${startDate || 'All'} to ${endDate || 'Now'}`);
    doc.moveDown();
    
    doc.text(`Total Invoiced: ${financial.totalInvoiced} ILS`);
    doc.text(`Total Paid: ${financial.totalPaid} ILS`);
    doc.text(`Total Remaining: ${financial.totalRemaining} ILS`);
    doc.text(`Collection Rate: ${financial.collectionRate}%`);
    doc.moveDown();
    doc.text(`Total Consumption: ${consumption.totalConsumption} KW`);

    doc.end();
  } catch (error) {
    next(error);
  }
};

/**
 * عرض صفحة تفاصيل المشترك (الملف الشخصي)
 */
exports.showSubscriberDetails = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const subscriberId = req.params.id;

    const details = await subscriberService.getSubscriberDetails(companyId, subscriberId);

    res.render('dashboard/companyAdmin/subscribers/subscriber-details', {
      title: 'تفاصيل المشترك',
      ...details
    });
  } catch (error) {
    next(error);
  }
};

exports.showEditSubscriberForm = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const subscriberId = req.params.id;
    const details = await subscriberService.getSubscriberDetails(companyId, subscriberId);

    // جلب المحصلين والمناطق الرئيسية للخيارات
    const collectors = await collectorService.getCollectorsByCompany(companyId);
    const areas = await areaService.getPrimaryAreasByCompany(companyId);

 res.render('dashboard/companyAdmin/subscribers/edit-subsicriber', {
  title: 'تعديل بيانات المشترك',
  subscriber: details.subscriber,
  meter: details.subscriber.meterId, // 👈 الحل هنا
  collectors,
  areas
});
  } catch (error) {
    next(error);
  }
};

exports.updateSubscriber = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const subscriberId = req.params.id;

    const { subscriber: subscriberData, meter: meterData } = req.body;

    const updated = await subscriberService.updateSubscriberWithMeter(
      companyId,
      subscriberId,
      subscriberData,
      meterData
    );

    res.json({
      message: 'تم تحديث بيانات المشترك بنجاح',
      data: updated
    });

  } catch (error) {
    next(error);
  }
};


exports.deleteSubscriber = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const subscriberId = req.params.id;

    await subscriberService.deleteSubscriber(companyId, subscriberId);

  res.redirect('/company-admin/subscribers');
  } catch (error) {
    next(error);
  }
};

  