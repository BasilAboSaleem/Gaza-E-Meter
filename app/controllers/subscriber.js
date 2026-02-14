const subscriberService = require('../services/subscriber/subscriberService');

/**
 * Subscriber Dashboard
 */
exports.getDashboard = async (req, res, next) => {
    try {
        const stats = await subscriberService.getDashboardStats(req.user.subscriber);
        res.render('dashboard/subscriber/index', {
            title: 'لوحة التحكم - مشترك',
            ...stats
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Readings History
 */
exports.getReadings = async (req, res, next) => {
    try {
        const readings = await subscriberService.getReadingsHistory(req.user.subscriber);
        res.render('dashboard/subscriber/readings', {
            title: 'سجل القراءات',
            readings
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Invoices List
 */
exports.getInvoices = async (req, res, next) => {
    try {
        const invoices = await subscriberService.getInvoices(req.user.subscriber);
        res.render('dashboard/subscriber/invoices', {
            title: 'فواتيري',
            invoices
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Payments History
 */
exports.getPayments = async (req, res, next) => {
    try {
        const payments = await subscriberService.getPayments(req.user.subscriber);
        res.render('dashboard/subscriber/payments', {
            title: 'سجل الدفعات',
            payments
        });
    } catch (error) {
        next(error);
    }
};
