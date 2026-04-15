const express = require('express');
const router = express.Router();
const contingenciaController = require('../controllers/contingenciaController');
const { verifyToken } = require('../middlewares/auth');

// Verificar estado de conexión y pendientes
router.get('/status', verifyToken, contingenciaController.checkStatus);

// Sincronizar ventas offline
router.post('/sync', verifyToken, contingenciaController.syncSales);

module.exports = router;
