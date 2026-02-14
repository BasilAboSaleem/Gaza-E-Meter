const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");

const dashboardService = require("../services/companyAdmin/dashboard");
const loadUser = require("../middlewares/loadUser");

// Test route - Home page
router.get("/", loadUser, async (req, res) => {
  // If user is logged in, redirect or show dashboard
  if (req.user) {
    // Role-based redirection
    switch (req.user.role) {
      case 'SUPER_ADMIN':
        return res.redirect("/super-admin/companies");
      
      case 'COLLECTOR':
        return res.redirect("/collector/my-subscribers");
      
      case 'COMPANY_ADMIN':
        // Stay here and show stats dash
        let stats = null;
        try {
          stats = await dashboardService.getCompanyAdminStats(req.user.company);
        } catch (err) {
          console.error('Error fetching dashboard stats:', err);
        }
        return res.render("dashboard/index", {
          title: "لوحة التحكم",
          stats
        });

      case 'ACCOUNTANT':
        return res.redirect("/company-admin/invoices");

      case 'SUBSCRIBER':
        return res.redirect("/profile");

      default:
        return res.render("dashboard/index", {
          title: "لوحة التحكم",
          stats: null
        });
    }
  }

  // If not logged in, show landing page
  res.render("landing", {
    title: "إشراق - معاً لإعادة النور لغزة",
    layout: false
  });
});

module.exports = router;
