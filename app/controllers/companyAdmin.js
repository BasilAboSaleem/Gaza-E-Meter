const e = require('connect-flash');
const areaService = require('../services/companyAdmin/areas');
const collectorService = require('../services/companyAdmin/collectors');
const subscriberService = require('../services/companyAdmin/subscribers');
const fundService = require('../services/companyAdmin/funds');
const transactionService = require('../services/companyAdmin/transaction');
exports.showCreateAreaForm = (req, res) => {
  res.render("dashboard/companyAdmin/areas/add-area", {
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
    companyId = req.user.company;
    const collectors = await collectorService.getCollectorsByCompany(companyId);
    return res.render('dashboard/companyAdmin/collectors/collectors', {
      title: 'المحصلين',
      collectors
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
      funds
    });
  } catch (error) {
    next(error);
  }
};

exports.showCreateFundForm = (req, res) => {
  res.render("dashboard/companyAdmin/funds/add-fund", {
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
    const fund = await fundService.getFundById(fundId);
    let transactions = [];

    if (!fund) {
      return res.status(404).render('errors/404', {
        message: 'الصندوق غير موجود'
      });
    }
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

    const { type, direction, sourceFund, destinationFund, amount, description } = req.body;

    const transaction = await transactionService.createTransaction({
      companyId,
      type,
      direction,
      sourceFund: sourceFund || null,
      destinationFund: destinationFund || null,
      amount,
      description,
      performedBy
    });

    return res.status(201).json(transaction);
  } catch (err) {
    console.error(err);
    if (err.statusCode) {
      return res.status(err.statusCode).json({ errors: { [err.field]: err.message } });
    }
    next(err);
  }
};