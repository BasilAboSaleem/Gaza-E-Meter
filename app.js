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
const connectDB = require("./app/config/db");

// --------- Custom Middlewares ----------
const authMiddleware = require("./app/middlewares/auth");
require('./cron/companyExpire'); // استيراد ملف الكرون


// --------- Routes ----------
const landingRouter = require("./app/routes/landing");
const authRoutes = require("./app/routes/auth");
const superAdminRoutes = require("./app/routes/super-admin");

/*const dashboardRoutes = require("./app/routes/dashboardRoutes");
const superAdminRoutes = require("./app/routes/superAdminRoutes");
const companyAdminRoutes = require("./app/routes/companyAdminRoutes");
const accountantRoutes = require("./app/routes/accountantRoutes");
const collectorRoutes = require("./app/routes/collectorRoutes");
const subscriberRoutes = require("./app/routes/subscriberRoutes");*/

// --------- App Init ----------
const app = express();

// --------- View Engine ----------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// --------- Database Init ----------
connectDB();

// --------- Global Middlewares ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// هذا المسار لو موجود فعلياً
app.use('/super-admin/assets', (req, res, next) => {
  const filePath = path.join(__dirname, 'public', 'assets', req.path.replace('/super-admin/assets', ''));
  express.static(path.join(__dirname, 'public/assets'))(req, res, next);
});
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

// --------- Flash variables ----------
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});

// --------- Global User & Roles ----------
const { USER_ROLES } = require("./app/models/User");

app.use((req, res, next) => {
  res.locals.user = req.user
    ? {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email || null,
        phone: req.user.phone || null,
        role: req.user.role,
        company: req.user.company || null,
        subscriber: req.user.subscriber || null,
        isSuperAdmin: req.user.role === 'SUPER_ADMIN',
      }
    : null;

  res.locals.USER_ROLES = USER_ROLES;
  next();
});

// --------- Public Routes ----------

app.use("/auth", authRoutes);

// --------- Auth Middleware ----------
app.use(authMiddleware); // كل ما بعده محمي

app.use("/", landingRouter);
// --------- Protected Routes ----------

app.use("/super-admin", superAdminRoutes);
/*app.use("/company-admin", companyAdminRoutes);
app.use("/accountant", accountantRoutes);
app.use("/collector", collectorRoutes);
app.use("/subscriber", subscriberRoutes);*/

// --------- 404 ----------
app.use((req, res) => {
  res.status(404).render("errors/404");
});

// --------- Error Handler ----------
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;

  // لو API
  if (req.xhr || req.headers.accept?.includes("json") || req.path.startsWith("/api")) {
    return res.status(status).json({ error: err.message || "Internal Server Error" });
  }

  res.status(status).render("errors/500", {
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// --------- Export ----------
module.exports = app;
