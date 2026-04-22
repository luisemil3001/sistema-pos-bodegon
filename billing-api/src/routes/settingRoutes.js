const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { verifyToken } = require('../middlewares/auth');

router.get('/', verifyToken, settingController.getSettings);
router.put('/', verifyToken, settingController.updateSettings);
router.post('/sync-bcv', verifyToken, settingController.syncBcvRate);

module.exports = router;
