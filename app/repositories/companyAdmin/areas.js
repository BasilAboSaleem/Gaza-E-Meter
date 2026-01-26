// repositories/areaRepository.js
const Area = require('../../models/Area');

exports.create = async (data) => {
  const area = new Area(data);
  return await area.save();
};

exports.findByName = async (name) => {
  return await Area.findOne({ name: name.trim() });
};

exports.findById = async (id) => {
  return await Area.findById(id);
};

exports.findAllPrimary = async () => {
  return await Area.find({ parentArea: null }).sort({ name: 1 });
};
