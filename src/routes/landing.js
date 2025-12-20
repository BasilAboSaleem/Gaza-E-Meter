const express = require("express");
const router = express.Router();

// Test route - Home page
router.get("/", (req, res) => {
  res.render("dashboard/index", {
    title: "Dashboard Home",
  });
});

module.exports = router;
