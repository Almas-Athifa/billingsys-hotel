const express    = require('express');
const router     = express.Router();
const path       = require('path');
const fs         = require('fs');
const {
  getProducts,
  searchProductByName,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const UPLOADS_DIR = path.join(__dirname, '../uploads');
const DEFAULT_IMG = '/uploads/default.jpg';

// Helper: normalize name to filename (e.g. "Chicken Biriyani" → "chicken-biriyani")
const toFileName = (name) => name.trim().toLowerCase().replace(/\s+/g, '-');

/* ─────────────────────────────────────────────────────────────────────
   GET /api/products/check-image?name=<productName>
   Checks local /uploads folder for a matching image using fs.existsSync
   Returns: { found: boolean, imagePath: string }
   NOTE: Must be defined BEFORE /:id route to avoid Express path conflict
───────────────────────────────────────────────────────────────────── */
const checkImageHandler = (req, res) => {
  const { name } = req.query;

  if (!name || name.trim().length < 2) {
    return res.json({ found: false, imagePath: DEFAULT_IMG });
  }

  const baseName = toFileName(name);
  const exts     = ['.jpg', '.jpeg', '.png', '.webp'];

  for (const ext of exts) {
    const fullPath = path.join(UPLOADS_DIR, `${baseName}${ext}`);
    if (fs.existsSync(fullPath)) {
      return res.json({ found: true, imagePath: `/uploads/${baseName}${ext}` });
    }
  }

  res.json({ found: false, imagePath: DEFAULT_IMG });
};

// ── Special named routes BEFORE /:id ──
router.get('/search',      protect, searchProductByName);
router.get('/check-image', protect, checkImageHandler);

// ── CRUD ──
router.route('/')
  .get(protect, getProducts)
  .post(protect, admin, upload.single('image'), createProduct);

router.route('/:id')
  .put(protect, admin, upload.single('image'), updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;
