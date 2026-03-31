const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

router.get('/dashboard', verifyToken, reportController.getDashboardStats);

module.exports = router;
