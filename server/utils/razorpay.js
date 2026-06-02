const crypto = require('crypto');
const Razorpay = require('razorpay');

/**
 * Razorpay is "enabled" only when both test/live keys are present in the env.
 * When it's not configured the app gracefully falls back to demo checkout,
 * so the project still runs end-to-end before any keys are added.
 */
const isRazorpayEnabled = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

let instance = null;
const getRazorpay = () => {
  if (!isRazorpayEnabled()) return null;
  if (!instance) {
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return instance;
};

/**
 * Verify the signature Razorpay returns to the browser after a successful
 * payment. This is what proves the payment is real and untampered — never
 * trust the client's "paid" claim without it.
 */
const verifyPaymentSignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) return false;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  // Constant-time compare to avoid timing leaks.
  const a = Buffer.from(expected);
  const b = Buffer.from(String(razorpaySignature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const getCurrency = () => process.env.RAZORPAY_CURRENCY || 'INR';

module.exports = { isRazorpayEnabled, getRazorpay, verifyPaymentSignature, getCurrency };
