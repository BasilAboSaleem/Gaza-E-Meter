const Subscriber = require('../../models/Subscriber');
const MeterReading = require('../../models/meterReading');
const Invoice = require('../../models/Invoice');
const mongoose = require('mongoose');

/**
 * Get Subscriber Dashboard Stats
 * @param {string} subscriberId 
 */
exports.getDashboardStats = async (subscriberId) => {
    const subscriber = await Subscriber.findById(subscriberId)
        .populate('primaryArea')
        .populate('meterId');

    if (!subscriber) throw new Error('المشترك غير موجود');

    // Get last reading
    const lastReading = await MeterReading.findOne({ subscriber: subscriberId })
        .sort({ readingDate: -1 });

    // Calculate total dues (unpaid invoices)
    const unpaidInvoices = await Invoice.aggregate([
        { $match: { subscriberId: new mongoose.Types.ObjectId(subscriberId), status: { $ne: 'PAID' } } },
        { $group: { _id: null, total: { $sum: '$remainingAmount' } } }
    ]);
    const totalDues = unpaidInvoices.length > 0 ? unpaidInvoices[0].total : 0;

    // Get recent activity (last 3 invoices)
    const recentInvoices = await Invoice.find({ subscriberId: subscriberId })
        .sort({ issueDate: -1 })
        .limit(3);

    return {
        subscriber,
        lastReading,
        totalDues,
        recentInvoices
    };
};

/**
 * Get Subscriber Readings History
 */
exports.getReadingsHistory = async (subscriberId, limit = 20) => {
    return await MeterReading.find({ subscriber: subscriberId })
        .sort({ readingDate: -1 })
        .limit(limit);
};

/**
 * Get Subscriber Invoices
 */
exports.getInvoices = async (subscriberId, limit = 20) => {
    return await Invoice.find({ subscriberId: subscriberId })
        .sort({ issueDate: -1 })
        .limit(limit);
};

/**
 * Get Subscriber Payments (Derived from Paid/Partially Paid Invoices)
 */
exports.getPayments = async (subscriberId, limit = 20) => {
    // In this system, payments are recorded on the invoice itself.
    // We fetch invoices that have a paidAmount > 0.
    const paidInvoices = await Invoice.find({ 
        subscriberId: subscriberId,
        paidAmount: { $gt: 0 }
    })
    .sort({ updatedAt: -1 }) // Using updatedAt as proxy for payment time
    .limit(limit);

    // Map to a payment-like structure for the view
    return paidInvoices.map(inv => ({
        receiptNumber: inv.invoiceNumber,
        paymentDate: inv.updatedAt, // Approximate
        amount: inv.paidAmount,
        invoice: inv,
        paymentMethod: inv.paymentMethod
    }));
};
