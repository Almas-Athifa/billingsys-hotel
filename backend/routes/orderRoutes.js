const express = require('express');
const router = express.Router();
const { addOrderItems, getOrders, getMyOrders, updateOrder, getDashboardStats } = require('../controllers/orderController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, addOrderItems)
  .get(protect, admin, getOrders);

router.get('/stats', protect, admin, getDashboardStats);
router.get('/my', protect, getMyOrders);
router.put('/:id', protect, admin, updateOrder);

module.exports = router;
