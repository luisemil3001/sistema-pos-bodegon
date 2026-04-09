const express = require('express');
const router = express.Router();
const adjustmentController = require('../controllers/adjustmentController');
const { verifyToken } = require('../middlewares/auth');

router.post('/', verifyToken, adjustmentController.createAdjustment);
router.get('/', verifyToken, adjustmentController.getAdjustments);

module.exports = router;
