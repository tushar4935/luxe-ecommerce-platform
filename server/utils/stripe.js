const Stripe = require('stripe');

/**
 * Stripe is "enabled" only when both the secret and publishable keys are set.
 * Without them the app falls back to demo checkout, so the project still runs
 * end-to-end before any keys are added (same pattern as razorpay.js).
 */
const isStripeEnabled = () =>
  Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY);

let instance = null;
const getStripe = () => {
  if (!isStripeEnabled()) return null;
  if (!instance) instance = new Stripe(process.env.STRIPE_SECRET_KEY);
  return instance;
};

/**
 * Confirm a PaymentIntent actually succeeded — and for the exact amount/currency
 * we expected — before marking an order paid. Stripe holds the source of truth,
 * so we re-fetch it server-side rather than trusting the browser's claim.
 *
 * @param {string} paymentIntentId  the `pi_...` id returned to the client
 * @param {number} expectedUsdAmount the order total in USD (dollars, not cents)
 */
const verifyStripePayment = async (paymentIntentId, expectedUsdAmount) => {
  if (!paymentIntentId) return false;
  const stripe = getStripe();
  if (!stripe) return false;

  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  const expectedCents = Math.round(expectedUsdAmount * 100);
  return pi.status === 'succeeded' && pi.currency === 'usd' && pi.amount === expectedCents;
};

module.exports = { isStripeEnabled, getStripe, verifyStripePayment };
