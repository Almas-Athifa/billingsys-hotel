const express = require('express');
const router  = express.Router();
const { getCustomerByPhone } = require('../controllers/customerController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/:phone', protect, getCustomerByPhone);

module.exports = router;
