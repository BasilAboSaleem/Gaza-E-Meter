const planRepository = require('../../repositories/super-admin/plan');

class PlanService {
  async createPlan(data) {

    if (!data.name) {
      throw new Error('اسم الباقة مطلوب');
    }

    const existingPlan = await planRepository.findByName(data.name);
    if (existingPlan) {
      throw new Error('اسم الباقة موجود مسبقًا');
    }

    if (data.maxSubscribers === 0 || data.maxSubscribers < -1) {
      throw new Error('عدد المشتركين غير صحيح');
    }

    if (data.priceMonthly < 0) {
      throw new Error('السعر الشهري غير صحيح');
    }

    return planRepository.create({
      name: data.name.trim(),
      maxSubscribers: Number(data.maxSubscribers),
      priceMonthly: Number(data.priceMonthly),
      features: data.features || [],
      isActive: data.isActive ?? true
    });
  }
    async getAllPlans() {
    
    return planRepository.findAll();
  }

  async getPlanById(id) {
    return planRepository.findById(id);
  }

   async getActivePlans() {
    return planRepository.findActive();
  }


  async updatePlan(id, data) {
    const plan = await planRepository.findById(id);
    if (!plan) throw new Error('الباقة غير موجودة');

    // تحقق من الحقول قبل التحديث
    if (data.name) {
      const existingPlan = await planRepository.findByName(data.name);
      if (existingPlan && existingPlan._id.toString() !== id) {
        throw new Error('اسم الباقة موجود مسبقًا');
      }
    }

    if (data.maxSubscribers !== undefined && (data.maxSubscribers === 0 || data.maxSubscribers < -1)) {
      throw new Error('عدد المشتركين غير صحيح');
    }

    if (data.priceMonthly !== undefined && data.priceMonthly < 0) {
      throw new Error('السعر الشهري غير صحيح');
    }

    // تحديث البيانات الموجودة فقط
    const updatedPlan = await planRepository.updateById(id, data);
    return updatedPlan;
  }
}


module.exports = new PlanService();
