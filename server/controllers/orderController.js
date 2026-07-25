const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendEmail = require('../utils/sendEmail');
const { buildItemsAndTotals } = require('../utils/orderTotals');
const { isRazorpayEnabled, verifyPaymentSignature } = require('../utils/razorpay');
const { isStripeEnabled, verifyStripePayment } = require('../utils/stripe');

/**
 * POST /api/orders — place an order from the user's cart.
 */
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, gateway, couponCode, notes, razorpay, stripePaymentIntentId } =
    req.body;

  if (!shippingAddress) throw new ApiError(400, 'Shipping address is required');
  if (!['card', 'paypal', 'cod'].includes(paymentMethod))
    throw new ApiError(400, 'Invalid payment method');

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) throw new ApiError(400, 'Your cart is empty');

  // Look up coupon (if any) before computing totals.
  let appliedCoupon = null;
  if (couponCode) {
    appliedCoupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!appliedCoupon) throw new ApiError(404, 'Invalid coupon code');
  }

  // Validate stock + compute line items and totals (same logic the payment
  // endpoint used, so the charged amount always matches the saved order).
  const { items, itemsTotal, couponDiscount, shippingCost, tax, totalAmount } =
    buildItemsAndTotals(cart, appliedCoupon, req.user._id);

  // ── Payment ────────────────────────────────────────────────────────
  // A 'card' order can be paid via Stripe (USD) or Razorpay (INR). Whichever
  // gateway the client used is re-verified server-side before the order is
  // marked paid — we never trust the browser's "paid" claim. Without keys,
  // card/paypal fall back to a demo "paid" so the flow still works end-to-end.
  let paymentStatus = 'pending';
  const paymentMeta = {};
  if (paymentMethod === 'card') {
    if (gateway === 'stripe' && isStripeEnabled()) {
      // Re-fetch the PaymentIntent from Stripe; must be 'succeeded' for the
      // exact USD total we're about to save.
      const ok = await verifyStripePayment(stripePaymentIntentId, totalAmount);
      if (!ok) throw new ApiError(400, 'Payment verification failed');
      paymentStatus = 'paid';
      paymentMeta.paymentProvider = 'stripe';
      paymentMeta.stripePaymentIntentId = stripePaymentIntentId;
      paymentMeta.transactionId = stripePaymentIntentId;
    } else if (gateway === 'razorpay' && isRazorpayEnabled()) {
      // Verify the HMAC signature Razorpay returned to the browser.
      if (!verifyPaymentSignature(razorpay || {})) {
        throw new ApiError(400, 'Payment verification failed');
      }
      paymentStatus = 'paid';
      paymentMeta.paymentProvider = 'razorpay';
      paymentMeta.razorpayOrderId = razorpay.razorpayOrderId;
      paymentMeta.razorpayPaymentId = razorpay.razorpayPaymentId;
      paymentMeta.transactionId = razorpay.razorpayPaymentId;
    } else {
      paymentStatus = 'paid'; // demo (no gateway configured)
    }
  } else if (paymentMethod === 'paypal') {
    paymentStatus = 'paid'; // demo
  }
  // 'cod' stays 'pending'.

  const order = await Order.create({
    user: req.user._id,
    items,
    shippingAddress,
    paymentMethod,
    paymentStatus,
    ...paymentMeta,
    couponCode: appliedCoupon ? appliedCoupon.code : undefined,
    couponDiscount,
    itemsTotal,
    shippingCost,
    tax,
    totalAmount,
    notes,
  });

  // Decrement stock + bump sold
  for (const ci of cart.items) {
    // eslint-disable-next-line no-await-in-loop
    await Product.findByIdAndUpdate(ci.product._id, {
      $inc: { stock: -ci.quantity, sold: ci.quantity },
    });
  }

  // Record coupon usage
  if (appliedCoupon) {
    appliedCoupon.usedCount += 1;
    appliedCoupon.usedBy.push(req.user._id);
    await appliedCoupon.save();
  }

  // Clear cart
  cart.items = [];
  await cart.save();

  // Confirmation email (non-blocking)
  try {
    await sendEmail(req.user.email, 'orderConfirmation', { name: req.user.name, order });
  } catch (err) {
    console.error('Order email failed:', err.message);
  }

  res.status(201).json({ success: true, message: 'Order placed', order });
});

/**
 * GET /api/orders — current user's orders (paginated).
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);

  const filter = { user: req.user._id };
  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    orders,
  });
});

/**
 * GET /api/orders/:id — detail (own orders only, unless admin).
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items.product', 'slug images');
  if (!order) throw new ApiError(404, 'Order not found');

  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to view this order');
  }

  res.json({ success: true, order });
});

/**
 * POST /api/orders/:id/cancel — cancel if still processing/confirmed.
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.user.toString() !== req.user._id.toString())
    throw new ApiError(403, 'Not authorized');

  if (!['processing', 'confirmed'].includes(order.orderStatus)) {
    throw new ApiError(400, `Cannot cancel an order that is ${order.orderStatus}`);
  }

  order.orderStatus = 'cancelled';
  order.statusHistory.push({
    status: 'cancelled',
    note: req.body.reason || 'Cancelled by customer',
    timestamp: new Date(),
  });

  // Restock items
  for (const item of order.items) {
    // eslint-disable-next-line no-await-in-loop
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity, sold: -item.quantity },
    });
  }

  await order.save();
  res.json({ success: true, message: 'Order cancelled', order });
});

module.exports = { createOrder, getMyOrders, getOrderById, cancelOrder };
