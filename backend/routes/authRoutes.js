const express = require('express');
const router = express.Router();
const { login, getStaff, addStaff, deleteStaff } = require('../controllers/authController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.post('/login', login);
router.route('/staff').get(protect, admin, getStaff).post(protect, admin, addStaff);
router.route('/staff/:id').delete(protect, admin, deleteStaff);

module.exports = router;
