// repositories/areaRepository.js
const Area = require('../../models/Area');

exports.create = async (data) => {
  const area = new Area(data);
  return await area.save();
};

exports.findByName = async (name) => {
  return await Area.findOne({ name: name.trim() });
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

exports.findById = async (id) => {
  return await Area.findById(id);
};
