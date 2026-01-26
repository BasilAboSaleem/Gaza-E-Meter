// services/areaService.js
const areaRepository = require('../../repositories/companyAdmin/areas');

exports.createPrimaryArea = async ({ name, description, isActive = true }) => {
  // تحقق من التكرار
  const existing = await areaRepository.findByName(name);
  if (existing) {
    const error = new Error('اسم المنطقة موجود مسبقاً');
    error.statusCode = 400;
    error.field = 'name';
    throw error;
  }

  // إنشاء المنطقة
  const areaData = {
    name: name.trim(),
    description: description ? description.trim() : '',
    isActive,
    parentArea: null // منطقة رئيسية
  };

  const area = await areaRepository.create(areaData);
  return area;
};
