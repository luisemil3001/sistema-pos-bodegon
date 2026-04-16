const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

router.get('/dashboard', verifyToken, reportController.getDashboardStats);
router.get('/audit/shifts', verifyToken, requireAdmin, reportController.getAuditShifts);
router.get('/audit/adjustments', verifyToken, requireAdmin, reportController.getAuditAdjustments);
router.get('/sales-by-product', verifyToken, reportController.getSalesByProduct);
router.get('/top-customers', verifyToken, reportController.getTopCustomers);
router.get('/inventory', verifyToken, reportController.getInventoryReport);
router.get('/cash-movements', verifyToken, reportController.getCashMovements);

module.exports = router;
