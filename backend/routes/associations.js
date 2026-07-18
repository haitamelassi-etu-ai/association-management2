const express = require('express');
const router = express.Router();
const Association = require('../models/Association');
const { protect, authorize } = require('../middleware/auth');

// Current user's association
router.get('/me', protect, (req, res) => {
  if (!req.user?.association) {
    return res.status(404).json({
      success: false,
      message: 'Association non trouvee'
    });
  }

  res.json({
    success: true,
    data: req.user.association
  });
});

// Admin-only routes
router.use(protect, authorize('admin'));

router.get('/', async (req, res) => {
  try {
    const associations = await Association.find().sort({ name: 1 });
    res.json({
      success: true,
      data: associations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, logoUrl, address, hasStock, hasTransport, isActive } = req.body;
    const association = await Association.create({
      name,
      logoUrl,
      address,
      hasStock: typeof hasStock === 'boolean' ? hasStock : true,
      hasTransport: typeof hasTransport === 'boolean' ? hasTransport : false,
      isActive: typeof isActive === 'boolean' ? isActive : true,
      isDefault: false
    });

    res.status(201).json({
      success: true,
      data: association
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const association = await Association.findById(req.params.id);
    if (!association) {
      return res.status(404).json({
        success: false,
        message: 'Association non trouvee'
      });
    }

    res.json({
      success: true,
      data: association
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, logoUrl, address, hasStock, hasTransport, isActive } = req.body;
    const association = await Association.findById(req.params.id);

    if (!association) {
      return res.status(404).json({
        success: false,
        message: 'Association non trouvee'
      });
    }

    if (name) association.name = name;
    if (logoUrl !== undefined) association.logoUrl = logoUrl;
    if (address !== undefined) association.address = address;
    if (typeof hasStock === 'boolean') association.hasStock = hasStock;
    if (typeof hasTransport === 'boolean') association.hasTransport = hasTransport;
    if (typeof isActive === 'boolean') association.isActive = isActive;

    await association.save();

    res.json({
      success: true,
      data: association
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
