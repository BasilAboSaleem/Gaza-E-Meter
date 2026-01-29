const areaService = require('../services/companyAdmin/areas');
const collectorService = require('../services/companyAdmin/collectors');

exports.showCreateAreaForm = (req, res) => {
  res.render("dashboard/companyAdmin/areas/add-area", {
  });
}



exports.createArea = async (req, res) => {
  try {
    console.log(req.body);
    const { name, description, isActive } = req.body;

    // Validate
    if (!name || name.trim() === '') {
      return res.status(400).json({ errors: { name: 'اسم المنطقة مطلوب' } });
    }

    const area = await areaService.createPrimaryArea({ name, description, isActive });
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
    const areas = await areaService.getPrimaryAreas();

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
    const { name, description, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        errors: { name: 'اسم المنطقة مطلوب' }
      });
    }

    const area = await areaService.createSubArea({
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

    const area = await areaService.getAreaById(id);

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
    const { name, description, isActive } = req.body;

    const updatedArea = await areaService.updateArea(id, {
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

    // التحققات البسيطة (اختياري، ممكن تحطها في السيرفس بس)
    if (!fullName?.trim()) return res.status(400).json({ errors: { fullName: 'الاسم الكامل مطلوب' } });
    if (!phone?.trim())    return res.status(400).json({ errors: { phone: 'رقم الهاتف مطلوب' } });
    if (!password?.trim()) return res.status(400).json({ errors: { password: 'كلمة المرور مطلوبة' } });

    const collector = await collectorService.createCollector(
      { fullName, email, phone, password, isActive },
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