const Company = require('../models/Company');
const Subscriber = require('../models/Subscriber');

const checkSubscriberLimit = async (req, res, next) => {
  try {
    /**
     * companyId ممكن يجي:
     * - من body (إنشاء مشترك)
     * - أو من user (لو كل اليوزرز مربوطين بشركة)
     */
    const companyId =
      req.body.company || req.user.company;

    if (!companyId) {
      return res.status(400).json({
        message: 'الشركة مطلوبة للتحقق من حد المشتركين'
      });
    }

    // جلب الشركة مع الباقة
    const company = await Company.findById(companyId)
      .populate('plan');

    if (!company) {
      return res.status(404).json({
        message: 'الشركة غير موجودة'
      });
    }

    if (company.status !== 'ACTIVE') {
      return res.status(403).json({
        message: 'اشتراك الشركة غير نشط'
      });
    }

    const { maxSubscribers } = company.plan;

    // لا محدود
    if (maxSubscribers === -1) {
      return next();
    }

    // عدد المشتركين الحاليين
    const currentCount = await Subscriber.countDocuments({
      company: companyId,
      isActive: true
    });

    if (currentCount >= maxSubscribers) {
      return res.status(403).json({
        message: 'تم الوصول إلى الحد الأقصى للمشتركين حسب الباقة'
      });
    }

    next();
  } catch (error) {
    console.error('checkSubscriberLimit error:', error);
    return res.status(500).json({
      message: 'خطأ في الخادم الداخلي'
    });
  }
};

module.exports = checkSubscriberLimit;
