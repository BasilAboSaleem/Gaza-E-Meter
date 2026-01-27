const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const authorizMiddleware = require("../middlewares/authorize");
const companyAdminController = require("../controllers/companyAdmin");

router.get("/areas/create", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.showCreateAreaForm);
router.post("/areas/create", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.createArea);
router.get("/main-areas", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.listMainAreas);
router.get("/main-areas/:id", authMiddleware, authorizMiddleware("COMPANY_ADMIN"), companyAdminController.showMainAreaDetails);

module.exports = router;