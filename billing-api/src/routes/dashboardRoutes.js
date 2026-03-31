const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middlewares/auth');

router.get('/stats', verifyToken, dashboardController.getStats);
router.get('/charts', verifyToken, dashboardController.getCharts);
router.get('/top-products', verifyToken, dashboardController.getTopProducts);

module.exports = router;
