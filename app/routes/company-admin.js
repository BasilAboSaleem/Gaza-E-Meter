const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const authorizMiddleware = require("../middlewares/authorize");
const companyAdminController = require("../controllers/companyAdmin");

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
router.get("/collectors/:id/edit", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.showEditCollectorForm);
router.put("/collectors/:id", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.updateCollector);
router.get('/areas/:id/sub-areas',authMiddleware, authorizMiddleware("COMPANY_ADMIN"),companyAdminController.getSubAreas);
router.get("/subscribers/create", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.showCreateSubscriberForm);

module.exports = router; 