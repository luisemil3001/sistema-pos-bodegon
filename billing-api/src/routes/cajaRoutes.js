const express = require('express');
const router = express.Router();
const cajaController = require('../controllers/cajaController');
const { verifyToken } = require('../middlewares/auth');

router.get('/estado', verifyToken, cajaController.getEstadoCaja);
router.post('/abrir', verifyToken, cajaController.abrirCaja);
router.post('/cerrar', verifyToken, cajaController.cerrarCaja);

module.exports = router;
