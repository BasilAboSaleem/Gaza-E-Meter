// ===========================
// app.js - Main Application
// ===========================

// --------- Core Imports ----------
const express = require("express");
const path = require("path");

// --------- Middlewares ----------
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const morgan = require("morgan");

// --------- Session & Flash ----------
const session = require("express-session");
const flash = require("connect-flash");

// --------- Database ----------
//const connectDB = require("./config/db");

// --------- Custom Middlewares ----------
//const authMiddleware = require("./app/middlewares/authMiddleware");

// --------- Routes ----------
const landingRouter = require("./src/routes/landing");
/*const authRoutes = require("./app/routes/authRoutes");
const dashboardRoutes = require("./app/routes/dashboardRoutes");
const superAdminRoutes = require("./app/routes/superAdminRoutes");*/

// --------- App Init ----------
const app = express();

// --------- View Engine ----------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// --------- Database Init ----------
//connectDB();

// --------- Global Middlewares ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Logger (dev only)
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// --------- Session ----------
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Flash
app.use(flash());

// Flash variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});

// --------- Public Routes ----------
app.use("/", landingRouter);
//app.use("/auth", authRoutes);

// --------- Auth Middleware ----------
//app.use(authMiddleware);

// --------- Global User ---------- 
//const ROLES = require("./app/constants/roles");

/*app.use((req, res, next) => {
  res.locals.user = req.user
    ? {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        companyId: req.user.companyId || null,
        companyRole: req.user.companyRole || null,
      }
    : null;

  res.locals.ROLES = ROLES;
  next();
});*/

// --------- Protected Routes ----------
/*app.use("/dashboard", dashboardRoutes);
app.use("/", superAdminRoutes);*/

// --------- 404 ----------
app.use((req, res) => {
  res.status(404).render("errors/404");
});

// --------- Error Handler ----------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).render("errors/500");
});

// --------- Export ----------
module.exports = app;
