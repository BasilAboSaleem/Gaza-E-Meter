const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const authorizMiddleware = require("../middlewares/authorize");
const superAdminController = require("../controllers/superAdmin");

// Super Admin Dashboard route
router.get("/plans", authMiddleware, authorizMiddleware(['SUPER_ADMIN']), superAdminController.renderPlansPage);
router.get("/plans/create", authMiddleware, authorizMiddleware(['SUPER_ADMIN']), superAdminController.renderCreatePlanPage); 
router.post("/plans/create", authMiddleware, authorizMiddleware(['SUPER_ADMIN']), superAdminController.createPlan);
router.get("/plans/:id/edit", authMiddleware, authorizMiddleware(['SUPER_ADMIN']), superAdminController.renderEditPlanPage);
router.put("/plans/:id", authMiddleware, authorizMiddleware(['SUPER_ADMIN']), superAdminController.updatePlan);

router.get("/companies", authMiddleware, authorizMiddleware(['SUPER_ADMIN']), superAdminController.renderCompaniesPage);
router.get("/companies/create", authMiddleware, authorizMiddleware(['SUPER_ADMIN']), superAdminController.renderCreateCompanyPage);
router.post("/companies/create", authMiddleware, authorizMiddleware(['SUPER_ADMIN']), superAdminController.createCompany);
router.get('/companies/:id/edit', authMiddleware, authorizMiddleware(['SUPER_ADMIN']), superAdminController.renderEditCompanyPage);
router.put("/companies/:id/update", authMiddleware, authorizMiddleware(['SUPER_ADMIN']), superAdminController.updateCompany);
router.get("/companies/:id/view", authMiddleware, authorizMiddleware(['SUPER_ADMIN']), superAdminController.renderCompanyDetailsPage);

module.exports = router;