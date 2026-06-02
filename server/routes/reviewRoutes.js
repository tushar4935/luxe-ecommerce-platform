const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validateMiddleware');
const { protect, adminOnly, optionalAuth } = require('../middleware/authMiddleware');
const {
  getProductReviews,
  getAllReviews,
  createReview,
  updateReview,
  deleteReview,
  toggleHelpful,
} = require('../controllers/reviewController');

const router = express.Router();

// Admin: list all reviews
router.get('/', protect, adminOnly, getAllReviews);

// Public list (optionalAuth lets the client know if the user already voted)
router.get('/product/:productId', optionalAuth, getProductReviews);

router.post(
  '/product/:productId',
  protect,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1–5'),
    body('comment').trim().notEmpty().withMessage('Comment is required'),
  ],
  validate,
  createReview
);

router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/helpful', protect, toggleHelpful);

module.exports = router;
