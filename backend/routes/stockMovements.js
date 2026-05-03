const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/stockMovementController');

router.use(protect);

router.get('/',      c.getAll);
router.get('/stats', c.getStats);

module.exports = router;
