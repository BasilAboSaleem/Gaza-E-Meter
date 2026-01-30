// services/areaService.js
const areaRepository = require('../../repositories/companyAdmin/areas');
const Area = require('../../models/Area');
const e = require('connect-flash');

exports.createPrimaryArea = async ({ companyId, name, description, isActive = true }) => {
  // تحقق من التكرار
  const existing = await areaRepository.findByName(companyId, name);
  if (existing) {
    const error = new Error('اسم المنطقة موجود مسبقاً');
    error.statusCode = 400;
    error.field = 'name';
    throw error;
  }

  // إنشاء المنطقة
  const areaData = {
    company: companyId,
    name: name.trim(),
    description: description ? description.trim() : '',
    isActive,
    parentArea: null // منطقة رئيسية
  };

  const area = await areaRepository.create(areaData);
  return area;
};

exports.getPrimaryAreas = async (companyId) => {
  const areas = await Area.aggregate([
    {
      $match: {
        company: companyId,
        parentArea: null
      }
    },
    {
      $lookup: {
        from: 'areas',
        let: { parentId: '$_id', companyId: '$company' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$parentArea', '$$parentId'] },
                  { $eq: ['$company', '$$companyId'] },
                  
                ]
              }
            }
          }
        ],
        as: 'subAreas'
      }
    },
    {
      $addFields: {
        subAreasCount: { $size: '$subAreas' }
      }
    },
    {
      $sort: { createdAt: -1 }
    }
  ]);

  return areas;
};


exports.getPrimaryAreaWithSubAreas = async (areaId) => {
  // جلب المنطقة الرئيسية فقط
  const area = await areaRepository.findPrimaryAreaById(areaId);
  if (!area) return null;

  // جلب المناطق الفرعية التابعة
  const subAreas = await areaRepository.findSubAreas(areaId);

  return { area, subAreas };
};

exports.getPrimaryArea = async (areaId) => {
  const area = await areaRepository.findPrimaryAreaById(areaId);
  return area;
};
  


exports.getSubAreas = async (parentAreaId) => {
  const subAreas = await Area.find({ parentArea: parentAreaId }).sort({ createdAt: -1 });
  return subAreas;
};

exports.createSubArea = async ({ companyId, parentAreaId, name, description, isActive = true }) => {
  const existing = await areaRepository.findByName(companyId, name);

  if (existing) {
    const error = new Error('اسم المنطقة موجود مسبقاً');
    error.statusCode = 400;
    error.field = 'name';
    throw error;
  }

  const areaData = {
    company: companyId,
    name: name.trim(),
    description: description ? description.trim() : '',
    isActive,
    parentArea: parentAreaId 
  };

  return await areaRepository.create(areaData);
};

exports.getAreaById = async (companyId, id) => {
  return await areaRepository.findById(companyId, id);
};


exports.updateArea = async (companyId, id, data) => {
  const area = await areaRepository.findById(companyId, id);

  if (!area) {
    const error = new Error('المنطقة غير موجودة');
    error.statusCode = 404;
    throw error;
  }

  // تحقق من الاسم (بدون تكرار)
  if (data.name && data.name.trim() !== area.name) {
    const exists = await areaRepository.findByName(companyId, data.name.trim());
    if (exists) {
      const error = new Error('اسم المنطقة موجود مسبقاً');
      error.statusCode = 400;
      error.field = 'name';
      throw error;
    }
  }

  area.name = data.name.trim();
  area.description = data.description || '';
  area.isActive = data.isActive;

  await area.save();
  return area;
};

exports.getPrimaryAreasByCompany = async (companyId) => {
  return await areaRepository.findPrimaryAreasByCompany(companyId);
};

exports.getSubAreasByPrimaryArea = async (companyId, primaryAreaId) => {
  return await areaRepository.findSubAreasByParent(
    companyId,
    primaryAreaId
  );
};

 