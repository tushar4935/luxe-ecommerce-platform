const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  syncCart,
} = require('../controllers/cartController');

const router = express.Router();

router.use(protect);

router.route('/').get(getCart).post(addToCart).delete(clearCart);
router.post('/sync', syncCart);
router.route('/:itemId').put(updateCartItem).delete(removeCartItem);

module.exports = router;
