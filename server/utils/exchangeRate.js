/**
 * Live USD→INR exchange rate, used to charge the Razorpay (INR) gateway the
 * correct amount for a USD-priced catalog.
 *
 * Design notes:
 * - Source is a keyless public endpoint (open.er-api.com) — no account/API key.
 * - The rate is cached in-memory so we hit the API at most twice a day, not on
 *   every checkout.
 * - On any network/API failure we fall back to the last good rate, then to a
 *   configurable fixed rate (USD_TO_INR_RATE) — checkout must never break just
 *   because an external FX API is down.
 */
const FALLBACK_RATE = Number(process.env.USD_TO_INR_RATE) || 88;
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h

let cached = { rate: null, at: 0 };

const getUsdToInrRate = async () => {
  // Serve a fresh-enough cached rate to avoid an API call per checkout.
  if (cached.rate && Date.now() - cached.at < CACHE_TTL_MS) return cached.rate;

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(4000),
    });
    const data = await res.json();
    const rate = data?.rates?.INR;
    if (data?.result === 'success' && rate > 0) {
      cached = { rate, at: Date.now() };
      return rate;
    }
  } catch (err) {
    console.error('FX rate fetch failed, using fallback:', err.message);
  }

  // Prefer the last good rate if we ever had one; else the configured fallback.
  return cached.rate || FALLBACK_RATE;
};

module.exports = { getUsdToInrRate, FALLBACK_RATE };
