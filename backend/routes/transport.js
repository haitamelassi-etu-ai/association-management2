const express = require('express');
const router = express.Router();
const transportController = require('../controllers/transportController');
const { protect, authorize } = require('../middleware/auth');
const { requireModule } = require('../middleware/moduleAccess');

router.use(protect, requireModule('transport'));

// Vehicles
router.get('/vehicles', authorize('admin', 'responsable', 'staff'), transportController.getVehicles);
router.post('/vehicles', authorize('admin', 'responsable'), transportController.createVehicle);
router.put('/vehicles/:id', authorize('admin', 'responsable'), transportController.updateVehicle);
router.delete('/vehicles/:id', authorize('admin'), transportController.deleteVehicle);

// Maintenance
router.get('/maintenance', authorize('admin', 'responsable', 'staff'), transportController.getMaintenance);
router.post('/maintenance', authorize('admin', 'responsable', 'staff'), transportController.createMaintenance);
router.put('/maintenance/:id', authorize('admin', 'responsable'), transportController.updateMaintenance);
router.delete('/maintenance/:id', authorize('admin'), transportController.deleteMaintenance);

// Incidents
router.get('/incidents', authorize('admin', 'responsable', 'staff'), transportController.getIncidents);
router.post('/incidents', authorize('admin', 'responsable', 'staff'), transportController.createIncident);
router.put('/incidents/:id', authorize('admin', 'responsable'), transportController.updateIncident);
router.patch('/incidents/:id/resolve', authorize('admin', 'responsable', 'staff'), transportController.resolveIncident);
router.delete('/incidents/:id', authorize('admin'), transportController.deleteIncident);

module.exports = router;
