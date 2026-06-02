const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getConfig, createRazorpayOrder } = require('../controllers/paymentController');

const router = express.Router();

// Public: lets the storefront know if online payment is available.
router.get('/config', getConfig);

// Protected: create a Razorpay order for the current cart.
router.post('/razorpay/order', protect, createRazorpayOrder);

module.exports = router;
