const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

router.get('/dashboard', verifyToken, reportController.getDashboardStats);
router.get('/audit/shifts', verifyToken, requireAdmin, reportController.getAuditShifts);
router.get('/audit/adjustments', verifyToken, requireAdmin, reportController.getAuditAdjustments);

module.exports = router;
