const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compraController');
const { verifyToken } = require('../middlewares/auth');

router.get('/', verifyToken, compraController.getCompras);
router.post('/', verifyToken, compraController.createCompra);
router.get('/:id', verifyToken, compraController.getCompraById);

module.exports = router;
