const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validateMiddleware');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

const router = express.Router();

router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);

router.post(
  '/',
  protect,
  adminOnly,
  upload.single('image'),
  [body('name').notEmpty().withMessage('Category name is required')],
  validate,
  createCategory
);
router.put('/:id', protect, adminOnly, upload.single('image'), updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;
