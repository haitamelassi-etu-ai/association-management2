const Association = require('../models/Association');

const DEFAULT_ASSOCIATION_NAME = process.env.DEFAULT_ASSOCIATION_NAME || 'Association Principale';

const getOrCreateDefaultAssociation = async () => {
  let association = await Association.findOne({ isDefault: true });

  if (!association) {
    association = await Association.findOne({ name: DEFAULT_ASSOCIATION_NAME });
  }

  if (!association) {
    association = await Association.create({
      name: DEFAULT_ASSOCIATION_NAME,
      hasStock: true,
      hasTransport: false,
      isDefault: true,
      isActive: true
    });
  }

  return association;
};

module.exports = { getOrCreateDefaultAssociation };
