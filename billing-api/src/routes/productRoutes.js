const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

router.get('/', verifyToken, productController.getProducts);
router.get('/:id', verifyToken, productController.getProductById);
router.post('/', verifyToken, requireAdmin, productController.createProduct);
router.put('/:id', verifyToken, requireAdmin, productController.updateProduct);
router.delete('/:id', verifyToken, requireAdmin, productController.deleteProduct);

module.exports = router;
