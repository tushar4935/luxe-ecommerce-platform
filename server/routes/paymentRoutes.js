const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getConfig,
  createStripePaymentIntent,
  createRazorpayOrder,
} = require('../controllers/paymentController');

const router = express.Router();

// Public: lets the storefront know which gateways are available + the FX rate.
router.get('/config', getConfig);

// Protected: create a Stripe PaymentIntent (USD) for the current cart.
router.post('/stripe/payment-intent', protect, createStripePaymentIntent);

// Protected: create a Razorpay order (INR, converted from USD) for the cart.
router.post('/razorpay/order', protect, createRazorpayOrder);

module.exports = router;
