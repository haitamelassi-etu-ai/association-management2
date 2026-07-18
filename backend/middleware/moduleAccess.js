const MODULE_FLAGS = {
  stock: 'hasStock',
  transport: 'hasTransport'
};

const requireModule = (moduleKey) => {
  return (req, res, next) => {
    const association = req.user?.association;
    const flag = MODULE_FLAGS[moduleKey];

    if (!flag) {
      return res.status(500).json({
        success: false,
        message: 'Configuration du module invalide'
      });
    }

    if (!association) {
      return res.status(403).json({
        success: false,
        message: 'Association non configuree'
      });
    }

    if (!association[flag]) {
      return res.status(403).json({
        success: false,
        message: 'Module non active pour cette association'
      });
    }

    next();
  };
};

module.exports = { requireModule };
