const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const authorizMiddleware = require("../middlewares/authorize");
const companyAdminController = require("../controllers/companyAdmin");
const profileController = require("../controllers/profile");

router.get("/areas/create", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.showCreateAreaForm);
router.post("/areas/create", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.createArea);
router.get("/main-areas", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.listMainAreas);
router.get("/main-areas/:id", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.showMainAreaDetails);
router.get("/main-areas/:id/sub-area/new", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.showCreateSubAreaForm);
router.post("/main-areas/:id/sub-area/new", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.createSubArea);
router.get(
  '/areas/:id/edit',
  authMiddleware,
  authorizMiddleware('COMPANY_ADMIN'),
  companyAdminController.showEditAreaForm
);

router.put(
  '/areas/:id',
  authMiddleware,
  authorizMiddleware('COMPANY_ADMIN'),
  companyAdminController.updateArea
);

router.get("/collectors/create", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.showCreateCollectorForm);
router.post("/collectors/create", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.createCollector);
router.get("/collectors", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.listCollectors);
router.get("/collectors/:id", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.showCollectorProfile);
router.get("/collectors/:id/edit", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.showEditCollectorForm);
router.put("/collectors/:id", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.updateCollector);

// Profile & Settings - Moved to global /profile routes

router.get('/areas/:id/sub-areas',authMiddleware, authorizMiddleware("COMPANY_ADMIN"),companyAdminController.getSubAreas);
router.get("/subscribers/create", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.showCreateSubscriberForm);
router.post(
  '/subscribers/create',
  authMiddleware,
  authorizMiddleware('COMPANY_ADMIN'),
  companyAdminController.createSubscriber
);
// عرض صفحة المشتركين
router.get(
  '/subscribers',
  authMiddleware,
  authorizMiddleware('COMPANY_ADMIN'),
  companyAdminController.showSubscribersPage
);

router.get(
  '/subscribers/:id',
  authMiddleware,
  authorizMiddleware('COMPANY_ADMIN'),
  companyAdminController.showSubscriberDetails
);

router.get("/funds", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.listFunds);
router.get("/funds/create", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.showCreateFundForm);
router.post("/funds/create", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.createFund);
router.get("/funds/:id", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.showFundDetails);
router.get("/transactions/create", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.showCreateTransactionForm);
router.post("/transactions/create", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.createTransaction);
router.get("/transactions", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.listTransactions);

// Settings & Electricity Rate
router.get("/settings", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.showSettingsPage);
router.get("/settings/electricity-rate", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.showElectricityRateSettings);
router.post("/settings/electricity-rate", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.updateElectricityRate);

// Readings Management
router.get("/readings", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.listReadings);
router.post("/readings/:id/approve", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.approveReading);
router.post("/readings/:id/reject", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.rejectReading);

// Invoice Management
router.get("/invoices", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.listInvoices);
router.post("/invoices/:id/pay", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.updateInvoicePayment);

// Payment Management
router.get("/payments", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.listPayments);

// Reports
router.get("/reports", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.getReportsDashboard);
router.get("/reports/area-consumption", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.getAreaConsumptionReport);
router.get("/reports/export/excel", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.exportReportsExcel);
router.get("/reports/export/pdf", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.exportReportsPDF);

module.exports = router;