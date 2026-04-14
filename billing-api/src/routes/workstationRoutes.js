const express = require('express');
const router = express.Router();
const workstationController = require('../controllers/workstationController');
const { verifyToken } = require('../middlewares/auth');

router.get('/', verifyToken, workstationController.getWorkstations);
router.post('/', verifyToken, workstationController.createWorkstation);
router.put('/:id', verifyToken, workstationController.updateWorkstation);
router.delete('/:id', verifyToken, workstationController.deleteWorkstation);

module.exports = router;
