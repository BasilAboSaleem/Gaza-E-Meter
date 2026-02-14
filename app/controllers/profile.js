const User = require('../models/User');

/**
 * عرض الصفحة الشخصية
 */
exports.showProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        res.render('dashboard/profile/profile', {
            title: 'الملف الشخصي',
            user
        });
    } catch (error) {
        next(error);
    }
};

/**
 * عرض صفحة الإعدادات
 */
exports.showSettings = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        res.render('dashboard/profile/settings', {
            title: 'إعدادات الحساب',
            user
        });
    } catch (error) {
        next(error);
    }
};

/**
 * تحديث البيانات الشخصية
 */
exports.updateProfile = async (req, res, next) => {
    try {
        if (req.user.role === 'SUBSCRIBER') {
            req.flash('error_msg', 'غير مسموح للمشتركين بتحديث البيانات الشخصية');
            return res.redirect('/profile/settings');
        }
        const { fullName, email, phone } = req.body;
        const user = await User.findById(req.user._id);

        if (fullName) user.fullName = fullName;
        if (email) user.email = email.toLowerCase();
        if (phone) user.phone = phone;

        await user.save();
        
        req.flash('success_msg', 'تم تحديث البيانات الشخصية بنجاح');
        res.redirect('/profile');
    } catch (error) {
        if (error.code === 11000) {
            req.flash('error_msg', 'البريد الإلكتروني أو الهاتف مستخدم بالفعل');
            return res.redirect('/profile/settings');
        }
        next(error);
    }
};

/**
 * تحديث كلمة المرور
 */
exports.updatePassword = async (req, res, next) => {
    try {
        const { password, confirmPassword } = req.body;

        if (!password || password.length < 8) {
            req.flash('error_msg', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل');
            return res.redirect('/profile/settings');
        }

        if (password !== confirmPassword) {
            req.flash('error_msg', 'كلمات المرور غير متطابقة');
            return res.redirect('/profile/settings');
        }

        const user = await User.findById(req.user._id);
        user.password = password; // سيتم التشفير تلقائياً في الـ pre-save hook
        await user.save();

        req.flash('success_msg', 'تم تغيير كلمة المرور بنجاح');
        res.redirect('/company-admin/profile');
    } catch (error) {
        next(error);
    }
};
