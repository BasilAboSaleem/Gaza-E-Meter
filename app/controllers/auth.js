const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Company = require('../models/Company');

exports.showLoginForm = (req, res) => {
  res.render("auth/login", {
    title: "تسجيل الدخول",
  });
};
exports.loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.render("auth/login", { error: "الرجاء إدخال البريد/الهاتف وكلمة المرور" });
    }

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { phone: identifier }]
    }).select('+password');

    if (!user) return res.render("auth/login", { error: "بيانات الدخول غير صحيحة" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.render("auth/login", { error: "كلمة المرور غير صحيحة" });
    if (!user.isActive) return res.render("auth/login", { error: "الحساب غير مفعل" });

    user.lastLoginAt = new Date();
    await user.save();

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, company: user.company },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // إعادة توجيه للداشبورد العام
    res.redirect("/");

  } catch (err) {
    console.error("Login Error:", err);
    res.render("auth/login", { error: "حدث خطأ في الخادم" });
  }
};

exports.logoutUser = (req, res) => {
  res.clearCookie("token");
  res.redirect("/auth/login");
};


