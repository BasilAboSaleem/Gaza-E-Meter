const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function loadUser(req, res, next) {
  try {
    let token = null;

    if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (user && user.isActive) {
          req.user = {
            _id: user._id,
            fullName: user.fullName,
            email: user.email || null,
            role: user.role,
            company: user.company || null,
            subscriber: user.subscriber || null,
          };
          res.locals.user = req.user;
        }
      } catch (jwtErr) {
        // Invalid token, just proceed as guest
      }
    }

    next();
  } catch (err) {
    console.error("LoadUser Middleware Error:", err);
    next(); // Always proceed
  }
};
