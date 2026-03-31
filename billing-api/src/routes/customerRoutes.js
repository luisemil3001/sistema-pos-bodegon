const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

router.get('/', verifyToken, customerController.getCustomers);
router.post('/', verifyToken, customerController.createCustomer);
router.put('/:id', verifyToken, customerController.updateCustomer);
router.delete('/:id', verifyToken, requireAdmin, customerController.deleteCustomer);

module.exports = router;
