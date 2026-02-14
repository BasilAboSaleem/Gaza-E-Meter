const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");

// Test route - Home page
router.get("/login", authController.showLoginForm);
router.post("/login", authController.loginUser);
router.get("/logout", authController.logoutUser);

module.exports = router;
