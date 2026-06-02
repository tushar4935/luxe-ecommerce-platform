import api from './axios';

export const paymentApi = {
  // Whether online payment is available + the publishable key to open checkout.
  getConfig: () => api.get('/payments/config'),
  // Create a Razorpay order for the current cart (amount computed server-side).
  createRazorpayOrder: (payload) => api.post('/payments/razorpay/order', payload),
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
