const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const profileController = require("../controllers/profile");

// Universal Profile Routes (accessible by all roles)
router.get("/", authMiddleware, profileController.showProfile);
router.get("/settings", authMiddleware, profileController.showSettings);
router.post("/update", authMiddleware, profileController.updateProfile);
router.post("/password", authMiddleware, profileController.updatePassword);

module.exports = router;
