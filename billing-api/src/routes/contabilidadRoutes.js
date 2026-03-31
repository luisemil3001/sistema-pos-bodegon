const express = require('express');
const router = express.Router();
const contabilidadController = require('../controllers/contabilidadController');
const { verifyToken } = require('../middlewares/auth');

router.get('/ventas', verifyToken, contabilidadController.getLibroVentas);
router.get('/compras', verifyToken, contabilidadController.getLibroCompras);
router.get('/iva-resumen', verifyToken, contabilidadController.getResumenIva);

module.exports = router;
