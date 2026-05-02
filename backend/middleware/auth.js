const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes — permissive when no token (login-free mode)
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user || !req.user.isActive) req.user = null;
    next();
  } catch {
    req.user = null;
    next();
  }
};

// Authorize roles (no-op when no user)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (req.user && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} n'est pas autorisé à accéder à cette route`
      });
    }
    next();
  };
};
