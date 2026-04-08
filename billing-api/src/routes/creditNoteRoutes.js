const express = require('express');
const router = express.Router();
const creditNoteController = require('../controllers/creditNoteController');
const { verifyToken } = require('../middlewares/auth');

router.get('/', verifyToken, creditNoteController.getCreditNotes);
router.get('/:id', verifyToken, creditNoteController.getCreditNoteById);
router.post('/', verifyToken, creditNoteController.createCreditNote);

module.exports = router;
