const express = require('express');
const router = express.Router();
const { addOrderItems, getOrders, getDashboardStats } = require('../controllers/orderController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, addOrderItems)
  .get(protect, admin, getOrders);

router.get('/stats', protect, admin, getDashboardStats);

module.exports = router;
