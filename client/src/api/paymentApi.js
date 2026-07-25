import { loadStripe } from '@stripe/stripe-js';
import api from './axios';

export const paymentApi = {
  // Which gateways are enabled (+ publishable keys) and the current USD→INR rate.
  getConfig: () => api.get('/payments/config'),
  // Create a Stripe PaymentIntent for the current cart (amount in USD, server-side).
  createStripePaymentIntent: (payload) => api.post('/payments/stripe/payment-intent', payload),
  // Create a Razorpay order for the current cart (amount converted to INR, server-side).
  createRazorpayOrder: (payload) => api.post('/payments/razorpay/order', payload),
};

// Load + memoize the Stripe.js instance for a given publishable key.
let stripePromise = null;
let loadedKey = null;
export const getStripePromise = (publishableKey) => {
  if (!publishableKey) return null;
  if (!stripePromise || loadedKey !== publishableKey) {
    loadedKey = publishableKey;
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

// Inject the Razorpay checkout script once; resolves true when ready.
export const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.getElementById('razorpay-checkout-js');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return undefined;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
    return undefined;
  });
