const Plan = require('../../models/Plan');

class PlanRepository {
  async findByName(name) {
    return Plan.findOne({ name });
  }

  async create(planData) {
    return Plan.create(planData);
  }

  async findAll() {
    return Plan.find().sort({ createdAt: -1 });
  }

  async findById(id) {
    return Plan.findById(id);
  }

   async findActive() {
    return Plan.find({ isActive: true }).sort({ priceMonthly: 1 });
  }

  async updateById(id, data) {
    return Plan.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteById(id) {
    return Plan.findByIdAndDelete(id);
  }
}

module.exports = new PlanRepository();
