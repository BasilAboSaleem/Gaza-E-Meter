const SMSLog = require('../../models/smsLog');

/**
 * محاكاة إرسال إشعار للمشترك وتوثيقه في النظام
 */
const logNotification = async (subscriberId, invoiceId, phone, message) => {
  try {
    // هنا يمكن ربط API خاص بـ SMS أو WhatsApp مستقبلاً
    console.log(`[Notification Simulation] To: ${phone}, Message: ${message}`);
    
    const log = new SMSLog({
      subscriber: subscriberId,
      invoice: invoiceId,
      phone: phone,
      message: message,
      status: 'SENT', // نفترض النجاح في المحاكاة
      sentAt: new Date()
    });
    
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to log notification:', error);
  }
};

/**
 * إشعار بصدور فاتورة جديدة
 */
exports.notifyNewInvoice = async (invoice, subscriber) => {
  const message = `عزيزي المشترك ${subscriber.fullName}، تم إصدار فاتورة الكهرباء رقم ${invoice.invoiceNumber} بقيمة ${invoice.totalAmount} شيكل. يرجى المسدد قبل تاريخ ${new Date(invoice.dueDate).toLocaleDateString('ar-EG')}.`;
  return await logNotification(subscriber._id, invoice._id, subscriber.phone, message);
};

/**
 * إشعار بتأكيد الدفع
 */
exports.notifyPaymentReceived = async (invoice, subscriber, amount) => {
  const message = `عزيزي ${subscriber.fullName}، تم استلام مبلغ ${amount} شيكل كدفعة للفاتورة رقم ${invoice.invoiceNumber}. الرصيد المتبقي: ${invoice.remainingAmount} شيكل. شكراً لكم.`;
  return await logNotification(subscriber._id, invoice._id, subscriber.phone, message);
};
