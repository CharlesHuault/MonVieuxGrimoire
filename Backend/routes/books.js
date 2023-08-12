const express = require('express');
const router = express.Router();

const Book = require('../models/book')
const bookCtrl = require('../controllers/book')


router.get('/', bookCtrl.getAllBooks);
router.get('/:id', bookCtrl.getOneBook);
router.post('/', bookCtrl.createBook);
router.put('/:id', bookCtrl.modifyBook);
router.delete('/:id', bookCtrl.deleteBook);

module.exports = router;