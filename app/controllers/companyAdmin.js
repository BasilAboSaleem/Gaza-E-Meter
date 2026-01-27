const areaService = require('../services/companyAdmin/areas');

exports.showCreateAreaForm = (req, res) => {
  res.render("dashboard/companyAdmin/areas/add-area", {
  });
}



exports.createArea = async (req, res) => {
  try {
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
    const area = await areaService.getPrimaryAreaById(areaId);

    if (!area) {
      return res.status(404).send('المنطقة غير موجودة');
    }

    // جلب المناطق الفرعية
    const subAreas = await areaService.getSubAreas(areaId);

    return res.render('dashboard/companyAdmin/areas/show-main-area', {
      title: 'تفاصيل المنطقة الرئيسية',
      area,
      subAreas
    });
  } catch (error) {
    next(error);
  }
};

  