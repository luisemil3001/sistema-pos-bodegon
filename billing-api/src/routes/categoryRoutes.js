const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken } = require('../middlewares/auth');

router.get('/', verifyToken, categoryController.getCategories);

module.exports = router;
