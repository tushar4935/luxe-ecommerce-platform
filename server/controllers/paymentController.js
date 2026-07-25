const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const { buildItemsAndTotals } = require('../utils/orderTotals');
const { isRazorpayEnabled, getRazorpay } = require('../utils/razorpay');
const { isStripeEnabled, getStripe } = require('../utils/stripe');
const { getUsdToInrRate } = require('../utils/exchangeRate');

// Resolve the signed-in user's current cart + coupon into a validated USD total.
// Shared by both gateways so the charged amount is always computed server-side.
const cartUsdTotal = async (req) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) throw new ApiError(400, 'Your cart is empty');

  let coupon = null;
  if (req.body.couponCode) {
    coupon = await Coupon.findOne({ code: req.body.couponCode.toUpperCase() });
    if (!coupon) throw new ApiError(404, 'Invalid coupon code');
  }
  const { totalAmount } = buildItemsAndTotals(cart, coupon, req.user._id);
  return totalAmount; // USD
};

/**
 * GET /api/payments/config — public.
 * Tells the storefront which gateways are available (+ their publishable keys)
 * and the current USD→INR rate, so the checkout can render the right options
 * and preview the converted ₹ amount for Razorpay.
 */
const getConfig = asyncHandler(async (req, res) => {
  const usdToInr = isRazorpayEnabled() ? await getUsdToInrRate() : null;
  res.json({
    success: true,
    stripe: {
      enabled: isStripeEnabled(),
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
    },
    razorpay: {
      enabled: isRazorpayEnabled(),
      keyId: process.env.RAZORPAY_KEY_ID || null,
      currency: 'INR',
    },
    usdToInr,
  });
});

/**
 * POST /api/payments/stripe/payment-intent — protected.
 * Creates a Stripe PaymentIntent for the cart total in USD (the catalog's native
 * currency). Returns the client secret the browser uses to confirm the card.
 */
const createStripePaymentIntent = asyncHandler(async (req, res) => {
  if (!isStripeEnabled()) throw new ApiError(503, 'Stripe payment is not configured');

  const totalAmount = await cartUsdTotal(req);
  const intent = await getStripe().paymentIntents.create({
    amount: Math.round(totalAmount * 100), // smallest USD unit (cents)
    currency: 'usd',
    // Card-only keeps confirmation fully in-page (no redirect back to the app).
    payment_method_types: ['card'],
    metadata: { userId: String(req.user._id) },
  });

  res.json({
    success: true,
    clientSecret: intent.client_secret,
    amount: intent.amount,
    currency: 'usd',
  });
});

/**
 * POST /api/payments/razorpay/order — protected.
 * The catalog is priced in USD but Razorpay test mode charges in INR, so we
 * convert the USD total at the current (cached, keyless) FX rate before creating
 * the Razorpay order. The amount is always computed server-side.
 */
const createRazorpayOrder = asyncHandler(async (req, res) => {
  if (!isRazorpayEnabled()) throw new ApiError(503, 'Online payment is not configured');

  const totalAmount = await cartUsdTotal(req); // USD
  const rate = await getUsdToInrRate();
  const inrAmount = Math.round(totalAmount * rate * 100); // paise

  const rzpOrder = await getRazorpay().orders.create({
    amount: inrAmount,
    currency: 'INR',
    receipt: `rcpt_${req.user._id}_${Date.now()}`,
    notes: { userId: String(req.user._id), usdAmount: String(totalAmount) },
  });

  res.json({
    success: true,
    orderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: 'INR',
    keyId: process.env.RAZORPAY_KEY_ID,
    usdAmount: totalAmount,
    inrRate: rate,
  });
});

module.exports = { getConfig, createStripePaymentIntent, createRazorpayOrder };
