const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validateMiddleware');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  getProducts,
  getFeaturedProducts,
  getRelatedProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImages,
  deleteProductImage,
} = require('../controllers/productController');

const router = express.Router();

// Public
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/related/:id', getRelatedProducts);
router.get('/id/:id', protect, adminOnly, getProductById);

// Admin
router.post(
  '/',
  protect,
  adminOnly,
  upload.array('images', 6),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('category').notEmpty().withMessage('Category is required'),
  ],
  validate,
  createProduct
);

router.put('/:id', protect, adminOnly, upload.array('images', 6), updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);
router.post('/:id/images', protect, adminOnly, upload.array('images', 6), addProductImages);
router.delete('/:id/images/:imageId', protect, adminOnly, deleteProductImage);

// Keep the slug route last so it doesn't shadow /featured, /related, etc.
router.get('/:slug', getProductBySlug);

module.exports = router;
