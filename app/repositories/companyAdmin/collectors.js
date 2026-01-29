const User = require('../../models/User');

exports.create = async (data) => {
  const user = new User(data);
  return await user.save();
};

exports.findByEmail = async (email) => {
  return await User.findOne({role: "COLLECTOR", email: email.trim().toLowerCase() });
};

exports.findByPhone = async (phone) => {
  return await User.findOne({role: "COLLECTOR", phone: phone.trim() });
};

exports.findById = async (id) => {
    return await User.findById(id);
};