const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const { buildItemsAndTotals } = require('../utils/orderTotals');
const { isRazorpayEnabled, getRazorpay, getCurrency } = require('../utils/razorpay');

/**
 * GET /api/payments/config — public.
 * Tells the frontend whether online payment is available and, if so, the
 * publishable key + currency to open the Razorpay checkout with.
 */
const getConfig = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    razorpay: {
      enabled: isRazorpayEnabled(),
      keyId: process.env.RAZORPAY_KEY_ID || null,
      currency: getCurrency(),
    },
  });
});

/**
 * POST /api/payments/razorpay/order — protected.
 * Creates a Razorpay order for the signed-in user's current cart total, so the
 * amount is computed server-side (never trusted from the client).
 */
const createRazorpayOrder = asyncHandler(async (req, res) => {
  if (!isRazorpayEnabled()) throw new ApiError(503, 'Online payment is not configured');

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) throw new ApiError(400, 'Your cart is empty');

  let coupon = null;
  if (req.body.couponCode) {
    coupon = await Coupon.findOne({ code: req.body.couponCode.toUpperCase() });
    if (!coupon) throw new ApiError(404, 'Invalid coupon code');
  }

  const { totalAmount } = buildItemsAndTotals(cart, coupon, req.user._id);
  const currency = getCurrency();

  const rzpOrder = await getRazorpay().orders.create({
    amount: Math.round(totalAmount * 100), // smallest currency unit (e.g. paise)
    currency,
    receipt: `rcpt_${req.user._id}_${Date.now()}`,
    notes: { userId: String(req.user._id) },
  });

  res.json({
    success: true,
    orderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

module.exports = { getConfig, createRazorpayOrder };
