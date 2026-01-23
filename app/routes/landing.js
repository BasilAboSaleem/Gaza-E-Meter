const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");

// Test route - Home page
router.get("/", authMiddleware, (req, res) => {
  res.render("dashboard/index", {
    title: "Dashboard Home",
  });
});

module.exports = router;
