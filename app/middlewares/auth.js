const jwt = require("jsonwebtoken");
const User = require("../models/User"); // لاحظ: استخدم User وليس {User}

module.exports = async function auth(req, res, next) {
  try {
    let token = null;

    // 1. جلب التوكن من الكوكيز أو الهيدر
    if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      // لا يوجد توكن → إعادة توجيه لتسجيل الدخول
      return res.redirect("/auth/login");
    }

    // 2. التحقق من التوكن
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. جلب المستخدم من قاعدة البيانات
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.redirect("/auth/login");
    }

    // 4. تعريف المستخدم في request و locals لتسهيل الوصول له في EJS
    req.user = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email || null,
      role: user.role,
      company: user.company || null,
      subscriber: user.subscriber || null,
    };

    res.locals.user = req.user; // مهم لتكون متاحة في كل View

    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    return res.redirect("/auth/login");
  }
};
