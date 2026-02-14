const Invoice = require('../../models/Invoice');
const MeterReading = require('../../models/meterReading');
const electricityRateService = require('./electricityRate');
const invoiceRepository = require('../../repositories/companyAdmin/invoices');
const Subscriber = require('../../models/Subscriber');
const mongoose = require('mongoose');
const notificationService = require('./notifications');

exports.generateInvoiceFromReading = async (readingId) => {
  const reading = await MeterReading.findById(readingId).populate('subscriber');
  if (!reading) throw new Error('Reading not found');
  if (reading.status === 'INVOICED') throw new Error('Invoice already generated for this reading');

  const companyId = reading.company;
  const subscriberId = reading.subscriber._id;

  // 1. Get current rate
  const currentRate = await electricityRateService.getCurrentRate(companyId);
  if (!currentRate) throw new Error('No active electricity rate found for the company');

  // 2. Calculate arrears (Sum of UNPAID/PARTIAL invoices)
  const unpaidInvoices = await invoiceRepository.findUnpaidBySubscriber(subscriberId);

  const arrears = unpaidInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);

  // 3. Generate unique invoice number
  const year = new Date().getFullYear();
  const count = await Invoice.countDocuments({ company: companyId }) + 1;
  const invoiceNumber = `INV-${year}-${count.toString().padStart(6, '0')}`;

  // 4. Create invoice
  const consumption = reading.consumption || (reading.readingValue - reading.previousReading);
  
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 15); // 15 days from now

  const invoiceData = {
    subscriberId: subscriberId,
    readingId: readingId,
    company: companyId,
    invoiceNumber: invoiceNumber,
    dueDate: dueDate,
    consumption: consumption,
    unitPrice: currentRate.rate,
    arrears: arrears,
    fixedFees: 0, 
    taxes: 0      
  };

  const invoice = new Invoice(invoiceData);
  await invoice.save();

  // 5. Update reading status
  reading.status = 'INVOICED';
  await reading.save();

  // 6. Send notification (Async/Simulated)
  notificationService.notifyNewInvoice(invoice, reading.subscriber).catch(console.error);

  return invoice;
};

exports.getInvoicesForAdmin = async (companyId, filters = {}) => {
  return await invoiceRepository.findInvoices(companyId, filters);
};

exports.processPayment = async (invoiceId, paymentData, performedBy) => {
  // Deep populate reading and its collector to get name for fallback search
  const invoice = await Invoice.findById(invoiceId).populate({
    path: 'readingId',
    populate: { path: 'collector' }
  });
  
  if (!invoice) throw new Error('Invoice not found');

  const { amount, method, proof } = paymentData;
  const paymentAmount = Number(amount);

  if (isNaN(paymentAmount) || paymentAmount <= 0) {
    throw new Error('Invalid payment amount');
  }

  // Identify collector
  const collector = invoice.readingId ? invoice.readingId.collector : null;
  if (!collector) {
    throw new Error('Could not identify collector for this invoice/reading');
  }

  const collectorId = collector._id || collector;
  const collectorName = collector.fullName;

  const fundRepo = require('../../repositories/companyAdmin/fund');
  const transactionService = require('./transaction');

  // Strategy 1: Find by owner and type (Ideal case)
  let collectorFund = await fundRepo.findOne({
    owner: collectorId,
    type: 'COLLECTOR'
  });

  // Strategy 2: Fallback to owner search only
  if (!collectorFund) {
    collectorFund = await fundRepo.findOne({ owner: collectorId });
  }

  // Strategy 3: Fallback to Name search (Common for manual funds)
  if (!collectorFund && collectorName) {
    collectorFund = await fundRepo.findOne({
      company: invoice.company,
      name: `صندوق المحصل ${collectorName.trim()}`
    });
  }

  // Strategy 4: Fallback to Name search with partial match or exact collector name
  if (!collectorFund && collectorName) {
    collectorFund = await fundRepo.findOne({
      company: invoice.company,
      name: collectorName.trim()
    });
  }

  if (!collectorFund) {
    console.error(`Fund not found for collector ${collectorId} (${collectorName}) and company ${invoice.company}`);
    throw new Error(`لم يتم العثور على صندوق للمحصل (${collectorName}). يرجى التأكد من وجود صندوق نشط للمحصل.`);
  }

  // Update invoice
  invoice.paidAmount += paymentAmount;
  
  if (invoice.paidAmount >= invoice.totalAmount) {
    invoice.status = 'PAID';
  } else if (invoice.paidAmount > 0) {
    invoice.status = 'PARTIAL';
  }

  invoice.paymentMethod = method || 'CASH';
  if (proof) invoice.paymentProof = proof;

  await invoice.save();

  // Record Transaction
  await transactionService.createTransaction({
    companyId: invoice.company,
    type: 'COLLECTION',
    destinationFund: collectorFund._id,
    amount: paymentAmount,
    description: `تسديد فاتورة رقم ${invoice.invoiceNumber} للمشترك`,
    performedBy: performedBy,
    referenceId: invoice._id,
    metadata: {
      subscriberId: invoice.subscriberId,
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber
    }
  });

  // Send notification (Async/Simulated)
  // Need subscriber info
  const subscriber = await Subscriber.findById(invoice.subscriberId);
  if (subscriber) {
    notificationService.notifyPaymentReceived(invoice, subscriber, paymentAmount).catch(console.error);
  }

  return invoice;
};

exports.getPaymentsForAdmin = async (companyId, filters = {}) => {
  const transactionRepo = require('../../repositories/companyAdmin/transaction');
  const query = { 
    company: companyId,
    type: 'COLLECTION'
  };

  // Add more date/subscriber filters if repo supports it or handle here
  const transactions = await transactionRepo.findByCompany(companyId);
  // Filter for COLLECTION and apply date range if needed
  return transactions.filter(t => t.type === 'COLLECTION');
};
