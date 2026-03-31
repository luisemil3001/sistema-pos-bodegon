const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');
const { verifyToken } = require('../middlewares/auth');

router.get('/', verifyToken, proveedorController.getProveedores);
router.post('/', verifyToken, proveedorController.createProveedor);
router.put('/:id', verifyToken, proveedorController.updateProveedor);
router.delete('/:id', verifyToken, proveedorController.deleteProveedor);

module.exports = router;
