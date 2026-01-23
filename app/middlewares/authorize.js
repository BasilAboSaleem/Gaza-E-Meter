/**
 * يسمح بالدخول فقط إذا كانت الرول موجودة في الـ allowedRoles
 * مثال: authorize(['SUPER_ADMIN', 'COMPANY_ADMIN'])
 */
const authorize = (allowedRoles = []) => {
  // تحويل allowedRoles إلى مصفوفة لو كانت سترينغ
  if (typeof allowedRoles === 'string') {
    allowedRoles = [allowedRoles];
  }

  return (req, res, next) => {
    // إذا ما في مستخدم
    if (!req.user) {
      // لو كانت طلب API → 401
      if (req.xhr || req.headers.accept?.includes('json') || req.path.startsWith('/api')) {
        return res.status(401).json({ message: 'غير مصرح بالدخول' });
      }
      // لو واجهة HTML → إعادة توجيه لتسجيل الدخول
      return res.redirect('/auth/login');
    }

    // إذا الدور غير مسموح
    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      // لو كانت طلب API → 403
      if (req.xhr || req.headers.accept?.includes('json') || req.path.startsWith('/api')) {
        return res.status(403).json({ message: 'ليس لديك الصلاحية للدخول إلى هذا القسم' });
      }

      // واجهة HTML → عرض صفحة Forbidden
      return res.status(403).render('errors/403', {
        message: 'ليس لديك الصلاحية للوصول إلى هذه الصفحة',
        user: req.user,
      });
    }

    // السماح بالدخول
    next();
  };
};

module.exports = authorize;
