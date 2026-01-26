const areaService = require('../services/companyAdmin/areas');

exports.showCreateAreaForm = (req, res) => {
  res.render("dashboard/companyAdmin/areas/add-main-area", {
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
