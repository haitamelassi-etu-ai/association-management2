const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllTransports,
  getTransport,
  createTransport,
  updateTransport,
  deleteTransport,
  addMaintenance,
  deleteMaintenance,
  getStats,
  getMaintenanceHistory
} = require('../controllers/transportController');

router.use(protect);

router.get('/stats', getStats);
router.get('/maintenance/history', getMaintenanceHistory);

router.route('/')
  .get(getAllTransports)
  .post(createTransport);

router.route('/:id')
  .get(getTransport)
  .put(updateTransport)
  .delete(deleteTransport);

router.post('/:id/entretien', addMaintenance);
router.delete('/:id/entretien/:entretienId', deleteMaintenance);

module.exports = router;
