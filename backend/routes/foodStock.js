const express = require('express');
const router = express.Router();
const foodStockController = require('../controllers/foodStockController');
const { protect, authorize } = require('../middleware/auth');
const { requireModule } = require('../middleware/moduleAccess');

router.use(protect, requireModule('stock'));

// Routes principales
router.get('/', foodStockController.getAllStock);
router.post('/', authorize('admin', 'responsable', 'staff'), foodStockController.createStockItem);

// Barcode lookup
router.get('/by-barcode/:barcode', authorize('admin', 'responsable'), foodStockController.getByBarcode);

// Routes des alertes et statistiques
router.get('/alerts/all', foodStockController.getAlerts);
router.get('/stats/overview', foodStockController.getStatistics);
router.get('/stats/charts', foodStockController.getChartData);
router.get('/stats/expiration-calendar', foodStockController.getExpirationCalendar);
router.get('/stats/value-dashboard', foodStockController.getValueDashboard);
router.get('/history/global', foodStockController.getGlobalHistory);
router.get('/reorder/suggestions', foodStockController.getReorderSuggestions);
router.get('/suppliers/list', foodStockController.getSuppliers);
router.get('/meals/suggestions', foodStockController.getMealSuggestions);

// Batch operations
router.post('/batch/consume', authorize('admin', 'responsable', 'staff'), foodStockController.batchConsume);
router.post('/batch/sortie', authorize('admin', 'responsable', 'staff'), foodStockController.batchSortie);
router.post('/batch/delete', authorize('admin', 'responsable'), foodStockController.batchDelete);
router.post('/batch/import', authorize('admin', 'responsable'), foodStockController.bulkImport);
router.get('/batch/imports', foodStockController.getImportBatches);
router.delete('/batch/import/:batchId', authorize('admin', 'responsable'), foodStockController.rollbackImport);
router.post('/inventory/count', authorize('admin', 'responsable'), foodStockController.performInventoryCount);

// Routes pour un article spécifique
router.get('/:id', foodStockController.getStockItem);
router.put('/:id', authorize('admin', 'responsable'), foodStockController.updateStockItem);
router.delete('/:id', authorize('admin', 'responsable'), foodStockController.deleteStockItem);
router.post('/:id/consommer', authorize('admin', 'responsable', 'staff'), foodStockController.consommerStock);
router.post('/:id/sortie', authorize('admin', 'responsable', 'staff'), foodStockController.sortieStock);
router.post('/:id/adjust', authorize('admin', 'responsable'), foodStockController.adjustStock);
router.get('/:id/plan', foodStockController.getPlanConsommation);
router.get('/:id/history', foodStockController.getItemHistory);

module.exports = router;
