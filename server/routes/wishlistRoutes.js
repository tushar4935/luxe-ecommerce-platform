const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart,
} = require('../controllers/wishlistController');

const router = express.Router();

router.use(protect);

router.get('/', getWishlist);
router.post('/move-to-cart/:productId', moveToCart);
router.post('/:productId', addToWishlist);
router.delete('/:productId', removeFromWishlist);

module.exports = router;
