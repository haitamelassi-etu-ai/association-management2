const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getOrCreateDefaultAssociation } = require('../utils/associationHelper');

const normalizeRole = (role) => (role === 'manager' ? 'responsable' : role);

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Non autorise - Token manquant'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = await User.findById(decoded.id)
      .select('-password')
      .populate('association');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouve ou inactif'
      });
    }

    if (!user.association) {
      const defaultAssociation = await getOrCreateDefaultAssociation();
      await User.findByIdAndUpdate(user._id, { association: defaultAssociation._id });
      user = await User.findById(user._id)
        .select('-password')
        .populate('association');
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Non autorise - Token invalide'
    });
  }
};

// Authorize roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    const allowedRoles = roles.map(normalizeRole);
    const userRole = normalizeRole(req.user.role);

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} non autorise pour cette action`
      });
    }
    next();
  };
};
