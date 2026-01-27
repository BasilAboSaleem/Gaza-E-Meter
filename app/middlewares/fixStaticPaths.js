// middleware/fixStaticPaths.js
module.exports = (req, res, next) => {
  // إذا المسار يحتوي "/company-admin/main-areas/assets/"
  if (req.url.startsWith('/company-admin/main-areas/assets/')) {
    // نعيد توجيهه إلى /assets/ مباشرة
    req.url = req.url.replace('/company-admin/main-areas', '');
  }
  next();
};
