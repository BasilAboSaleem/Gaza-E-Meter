const express = require('express');
const router = express.Router();
const subscriberController = require('../controllers/subscriber');
const authMiddleware = require('../middlewares/auth');
const authorizMiddleware = require('../middlewares/authorize');

// Middleware to ensure user is a SUBSCRIBER
router.use(authMiddleware);
router.use(authorizMiddleware('SUBSCRIBER'));

// Dashboard
router.get('/', subscriberController.getDashboard);

// Readings History
router.get('/readings', subscriberController.getReadings);

// Invoices
router.get('/invoices', subscriberController.getInvoices);

// Payments (Payment History)
router.get('/payment-history', subscriberController.getPayments);

// Profile is handled by the global /profile route

module.exports = router;
