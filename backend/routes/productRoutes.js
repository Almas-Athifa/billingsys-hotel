const express    = require('express');
const router     = express.Router();
const {
  getProducts,
  checkImageExists,
  searchProductByName,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// ── Special named routes BEFORE /:id ──
router.get('/search',      protect, searchProductByName);
router.get('/check-image', protect, checkImageExists);

// ── CRUD ──
router.route('/')
  .get(protect, getProducts)
  .post(protect, admin, upload.single('image'), createProduct);

router.route('/:id')
  .put(protect, admin, upload.single('image'), updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;
