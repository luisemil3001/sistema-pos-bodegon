const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { verifyToken } = require('../middlewares/auth');

router.get('/', verifyToken, invoiceController.getInvoices);
router.get('/:id', verifyToken, invoiceController.getInvoiceById);
router.put('/:id/void', verifyToken, invoiceController.voidInvoice);
router.post('/', verifyToken, invoiceController.createInvoice);

module.exports = router;
