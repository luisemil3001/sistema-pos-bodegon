const express = require('express');
const router = express.Router();
const ncfController = require('../controllers/ncfController');
const { verifyToken } = require('../middlewares/auth');

router.get('/', verifyToken, ncfController.getSequences);
router.post('/', verifyToken, ncfController.saveSequence);

module.exports = router;
