const express = require('express');
const router = express.Router();
const cotizacionController = require('../controllers/cotizacionController');
const { verifyToken } = require('../middlewares/auth');

router.post('/', verifyToken, cotizacionController.createCotizacion);
router.get('/', verifyToken, cotizacionController.getCotizaciones);
router.get('/:id', verifyToken, cotizacionController.getCotizacionById);
router.delete('/:id', verifyToken, cotizacionController.voidCotizacion);

module.exports = router;
