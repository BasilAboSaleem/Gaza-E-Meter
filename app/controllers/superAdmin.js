const planService = require('../services/super-admin/plan');
const CompanyService = require('../services/super-admin/company');

exports.renderCreatePlanPage = (req, res) => {
  res.render('dashboard/superAdmin/plans/add-plan', {
    title: 'إضافة باقة جديدة',
    errors: {},
    old: {}
  });
};

exports.createPlan = async (req, res) => {
  try {
    const plan = await planService.createPlan(req.body);

    return res.status(201).json({
      message: 'تم إنشاء الباقة بنجاح',
      data: plan
    });

  } catch (error) {

    return res.status(422).json({
      message: 'فشل التحقق من البيانات',
      errors: {
        name: error.message.includes('اسم') ? error.message : '',
        maxSubscribers: error.message.includes('عدد') ? error.message : '',
        priceMonthly: error.message.includes('السعر') ? error.message : '',
        features: error.message.includes('ميزة') ? error.message : ''
      }
    });
  }
};

exports.renderPlansPage = async (req, res) => {
  try {
    const plans = await planService.getAllPlans();

    res.render('dashboard/superAdmin/plans/plans', {
      title: 'قائمة الباقات',
      plans
    });

  } catch (error) {
    console.error(error);
    // لو صار خطأ في السيرفر
    res.status(500).render('errors/500', { message: 'حدث خطأ أثناء جلب الباقات' });
  }
};

exports.renderEditPlanPage = async (req, res) => {
  try {
    console.log('Editing plan ID:', req.params.id);
    const plan = await planService.getPlanById(req.params.id);
    if (!plan) {
      return res.status(404).render('errors/404', { title: 'الباقة غير موجودة' });
    }

    res.render('dashboard/superAdmin/plans/edit-plan', {
      title: 'تعديل الباقة',
      plan
    });

  } catch (err) {
    console.error(err);
    res.status(500).render('errors/500', { title: 'حدث خطأ' });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const planId = req.params.id;

    const updatedData = {};
    if (req.body.name) updatedData.name = req.body.name.trim();
    if (req.body.maxSubscribers !== undefined) updatedData.maxSubscribers = Number(req.body.maxSubscribers);
    if (req.body.priceMonthly !== undefined) updatedData.priceMonthly = Number(req.body.priceMonthly);
    if (req.body.features) updatedData.features = req.body.features;
    if (req.body.isActive !== undefined) updatedData.isActive = req.body.isActive;

    const plan = await planService.updatePlan(planId, updatedData);

    return res.status(200).json({
      message: 'تم تعديل الباقة بنجاح',
      data: plan
    });

  } catch (error) {
    return res.status(422).json({
      message: 'فشل تعديل البيانات',
      errors: {
        name: error.message.includes('اسم') ? error.message : '',
        maxSubscribers: error.message.includes('عدد') ? error.message : '',
        priceMonthly: error.message.includes('السعر') ? error.message : '',
        features: error.message.includes('ميزة') ? error.message : ''
      }
    });
  }
};

exports.renderCompaniesPage = async (req, res) => {
  try {
    const companies = await CompanyService.findAllCompanies();
    res.render('dashboard/superAdmin/companys/companies', {
      title: 'قائمة الشركات',
      companies
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('errors/500', { message: 'حدث خطأ أثناء جلب الشركات' });
  }
};
exports.renderCreateCompanyPage = async (req, res) => {
  try {
    const plans = await planService.getActivePlans();

    return res.render('dashboard/superAdmin/companys/add-company', {
      title: 'إضافة شركة جديدة',
      plans
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('خطأ في تحميل صفحة إضافة الشركة');
  }
};

exports.createCompany = async (req, res) => {
  try {
    const { company, admin } = req.body;

    if (!company || !admin) {
      return res.status(400).json({
        message: 'بيانات غير مكتملة'
      });
    }

    const createdBy = req.user._id;

    const result = await CompanyService.createCompanyWithAdmin({
      company,
      admin,
      createdBy
    });

    return res.status(201).json({
      message: 'تم إنشاء الشركة ومديرها بنجاح',
      data: result
    });

  } catch (error) {
  console.error('Create Company Error:', error);

  // معالجة أخطاء Mongoose validation
  if (error.name === 'ValidationError') {
    const errors = {};
    Object.keys(error.errors).forEach(key => {
      errors[key] = error.errors[key].message;
    });
    return res.status(422).json({
      message: 'فشل التحقق من البيانات',
      errors
    });
  }

  // معالجة أخطاء التكرار (Duplicate key)
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    let message = 'هذه القيمة مستخدمة مسبقًا';
    
    if (field === 'email') message = 'البريد الإلكتروني مستخدم مسبقًا';
    if (field === 'phone') message = 'رقم الهاتف مستخدم مسبقًا';
    if (field === 'name') message = 'اسم الشركة مستخدم مسبقًا';

    return res.status(422).json({
      message: 'فشل التحقق من البيانات',
      errors: { [field]: message }
    });
  }

  // معالجة الأخطاء المخصصة من الـ Service
  if (error.message.includes('البريد الإلكتروني')) {
    return res.status(422).json({
      message: 'فشل التحقق من البيانات',
      errors: { adminEmail: error.message }
    });
  }

  if (error.message.includes('اسم الشركة')) {
    return res.status(422).json({
      message: 'فشل التحقق من البيانات',
      errors: { companyName: error.message }
    });
  }

  if (error.message.includes('رقم الهاتف')) {
    return res.status(422).json({
      message: 'فشل التحقق من البيانات',
      errors: { adminPhone: error.message }
    });
  }

  // خطأ عام
  return res.status(500).json({
    message: 'حدث خطأ غير متوقع أثناء إنشاء الشركة',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}

};

exports.renderEditCompanyPage = async (req, res) => {
  try {
    const { id } = req.params;

    const companyData = await CompanyService.findCompanyWithAdmin(id);
    const plans = await planService.getActivePlans();

    return res.render('dashboard/superAdmin/companys/edit-company', {
      title: 'تعديل شركة',
      company: companyData.company,
      admin: companyData.admin,
      plans
    });

  } catch (error) {
    console.error(error);
    return res.status(500).send('خطأ في تحميل صفحة تعديل الشركة');
  }
};

/**
 * PUT | update company
 */
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;

    await CompanyService.updateCompanyWithAdmin(id, req.body);

    return res.json({ success: true });

  } catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      message: error.message || 'فشل تعديل الشركة'
    });
  }
};
exports.renderCompanyDetailsPage = async (req, res) => {
  try {
    const { id } = req.params;
    const companyData = await CompanyService.findCompanyWithAdmin(id);

    if (!companyData) {
      return res.status(404).render('errors/404', { title: 'الشركة غير موجودة' });
    }
    return res.render('dashboard/superAdmin/companys/show-company', {
      title: 'تفاصيل الشركة',
      company: companyData.company,
      admin: companyData.admin
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('خطأ في تحميل صفحة تفاصيل الشركة');
  }
};

/**
 * DELETE | حذف شركة
 */
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    await CompanyService.deleteCompany(id);

    return res.status(200).json({
      success: true,
      message: 'تم حذف الشركة بنجاح'
    });

  } catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      message: error.message || 'فشل حذف الشركة'
    });
  }
};