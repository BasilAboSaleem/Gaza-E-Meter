// repositories/areaRepository.js
const Area = require('../../models/Area');

exports.create = async (data) => {
  const area = new Area(data);
  return await area.save();
};

exports.findByName = async (companyId, name) => {
  return await Area.findOne({ company: companyId, name: name.trim() });
};

// منطقة رئيسية
exports.findPrimaryAreaById = async (id) => {
  return await Area.findOne({ _id: id, parentArea: null });
};

// مناطق فرعية لمنطقة رئيسية
exports.findSubAreas = async (parentId) => {
  return await Area.find({ parentArea: parentId });
};

exports.findAllPrimary = async () => {
  return await Area.find({ parentArea: null }).sort({ name: 1 });
};

exports.findById = async (companyId, id) => {
  return await Area.findOne({ _id: id, company: companyId });
};

exports.findByCompany = async (companyId) => {
  return await Area.find({ company: companyId });
};

// جلب كل المناطق الرئيسية لشركة معينة
exports.findPrimaryAreasByCompany = async (companyId) => {
  return await Area.find({
    company: companyId,
    parentArea: null,
    isActive: true
  }).sort({ name: 1 });
};

// جلب المناطق الفرعية التابعة لمنطقة رئيسية معينة
exports.findSubAreasByParent = async (companyId, parentAreaId) => {
  return await Area.find({
    company: companyId,
    parentArea: parentAreaId,
    isActive: true
  }).sort({ name: 1 });
};
