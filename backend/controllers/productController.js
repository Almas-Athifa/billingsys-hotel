const Product = require('../models/Product');
const path    = require('path');
const fs      = require('fs');
const cloudinary = require('../config/cloudinary');

const UPLOADS_DIR  = path.join(__dirname, '../uploads');
const DEFAULT_IMG  = '/uploads/default.jpg';
const CLOUDINARY_PRODUCT_FOLDER = 'billingsystem/products';

/* ─────────────────────────────────────────────────
   Helper: normalize product name → filename
   "Chicken Biriyani " → "chicken-biriyani"
───────────────────────────────────────────────── */
const toFileName = (name) =>
  name.trim().toLowerCase().replace(/\s+/g, '-');

/* ─────────────────────────────────────────────────
   Helper: find first matching extension
   Checks .jpg .jpeg .png .webp in order
───────────────────────────────────────────────── */
const findLocalImage = (baseName) => {
  const exts = ['.jpg', '.jpeg', '.png', '.webp'];
  for (const ext of exts) {
    const filePath = path.join(UPLOADS_DIR, `${baseName}${ext}`);
    if (fs.existsSync(filePath)) {
      return `/uploads/${baseName}${ext}`;
    }
  }
  return null;
};

const findCloudinaryImage = async (baseName) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return null;
  }

  const folderExpression = `(folder=${CLOUDINARY_PRODUCT_FOLDER} OR asset_folder=${CLOUDINARY_PRODUCT_FOLDER})`;
  const nameExpression = [
    `public_id:${CLOUDINARY_PRODUCT_FOLDER}/${baseName}*`,
    `public_id:${baseName}*`,
    `filename:${baseName}*`,
    `display_name:${baseName}*`,
    `tags:${baseName}`,
  ].join(' OR ');

  const result = await cloudinary.search
    .expression(`resource_type:image AND ${folderExpression} AND (${nameExpression})`)
    .sort_by('created_at', 'desc')
    .max_results(1)
    .execute();

  return result.resources?.[0]?.secure_url || null;
};

const findSuggestedImage = async (name) => {
  const baseName = toFileName(name);
  const cloudinaryPath = await findCloudinaryImage(baseName);
  if (cloudinaryPath) {
    return { source: 'cloudinary', imagePath: cloudinaryPath };
  }

  const localPath = findLocalImage(baseName);
  if (localPath) {
    return { source: 'local', imagePath: localPath };
  }

  return null;
};

const uploadToCloudinary = (file, productName) => {
  if (!file?.buffer) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const publicId = `${toFileName(productName)}-${Date.now()}`;
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_PRODUCT_FOLDER,
        public_id: publicId,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    stream.end(file.buffer);
  });
};

/* ──────────────────────────────────────────────────────
   GET /api/products  (list / keyword search)
──────────────────────────────────────────────────────── */
const getProducts = async (req, res) => {
  const keyword = req.query.keyword
    ? { name: { $regex: req.query.keyword, $options: 'i' } }
    : {};
  const products = await Product.find({ ...keyword }).populate('category', 'name');
  res.json(products);
};

/* ──────────────────────────────────────────────────────
   GET /api/products/check-image?name=<productName>
   Checks Cloudinary/local uploads for a matching image.
   Returns: { found: true/false, imagePath: '...' }
──────────────────────────────────────────────────────── */
const checkImageExists = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name || name.trim().length < 2) {
      return res.json({ found: false, imagePath: DEFAULT_IMG });
    }

    const suggestedImage = await findSuggestedImage(name);

    if (suggestedImage) {
      return res.json({ found: true, ...suggestedImage });
    }

    res.json({ found: false, imagePath: DEFAULT_IMG });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ──────────────────────────────────────────────────────
   GET /api/products/search?name=<query>
   DB partial-match search (existing product lookup)
──────────────────────────────────────────────────────── */
const searchProductByName = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name || name.length < 2) return res.json(null);

    const product = await Product.findOne({
      name: { $regex: name.trim(), $options: 'i' }
    }).populate('category', 'name');

    res.json(product || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ──────────────────────────────────────────────────────
   POST /api/products
   Image priority:
     1. Local folder match  (auto)
     2. Multer file upload  (fallback)
     3. default.jpg         (last resort)
──────────────────────────────────────────────────────── */
const createProduct = async (req, res) => {
  try {
    const { name, price, category, quantity, unit } = req.body;

    const suggestedImage = await findSuggestedImage(name);

    let image;
    if (suggestedImage) {
      image = suggestedImage.imagePath;
    } else if (req.file) {
      image = await uploadToCloudinary(req.file, name); // manual upload
    } else {
      image = DEFAULT_IMG;                            // default fallback
    }

    const product = new Product({ name, price, category, quantity: parseFloat(quantity), unit: unit || 'piece', image });
    const created = await product.save();
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ──────────────────────────────────────────────────────
   PUT /api/products/:id
──────────────────────────────────────────────────────── */
const updateProduct = async (req, res) => {
  try {
    const { name, price, category, quantity, unit } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.name     = name     || product.name;
    product.price    = price    || product.price;
    product.category = category || product.category;
    product.quantity = quantity !== undefined ? parseFloat(quantity) : product.quantity;
    if (unit) product.unit = unit;

    if (req.file) {
      product.image = await uploadToCloudinary(req.file, product.name);
    } else if (name) {
      const suggestedImage = await findSuggestedImage(name);
      if (suggestedImage) product.image = suggestedImage.imagePath;
    }

    const updated = await product.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ──────────────────────────────────────────────────────
   DELETE /api/products/:id
──────────────────────────────────────────────────────── */
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await Product.deleteOne({ _id: req.params.id });
    res.json({ message: 'Product removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getProducts,
  checkImageExists,
  searchProductByName,
  createProduct,
  updateProduct,
  deleteProduct
};
