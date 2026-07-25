# Architecture & Design Decisions

This document walks through the four subsystems with the most moving parts —
**authentication with refresh-token rotation**, **product filtering**, **cart &
checkout**, and **admin analytics**. For each it covers the problem it solves, how
it's implemented, and the reasoning behind the approach.

---

## 1. Authentication & refresh-token rotation

**The problem.** Keep a user logged in securely, across page reloads, without storing a
password or a long-lived token somewhere JavaScript (and therefore an XSS attacker) can
read it.

**The two-token design.**

| Token | Lifetime | Stored where | Sent how | Readable by JS? |
|-------|----------|--------------|----------|-----------------|
| **Access token** | ~15 min | In memory (a JS variable) | `Authorization: Bearer <token>` header | Yes (but short-lived) |
| **Refresh token** | ~7 days | **httpOnly cookie** | Automatically by the browser | **No** (that's the point) |

- The **access token** is a signed JWT proving who you are. It's short-lived so a leak is
  only useful for minutes. It lives in memory (not `localStorage`), so it vanishes on tab
  close and isn't trivially readable by injected scripts.
- The **refresh token** is the long-lived credential used *only* to mint new access
  tokens. It sits in an **httpOnly** cookie, so client JS can't read it — which defends
  against XSS token theft.

**Rotation.** Every time the client refreshes
([`POST /auth/refresh-token`](server/controllers/authController.js)), the server:
1. verifies the incoming refresh token against a **hashed copy stored in the database**,
2. **deletes that stored record** (the old token is now dead), and
3. issues a **brand-new** refresh token + access token.

So each refresh token is effectively **one-time-use**. If one leaks and the attacker uses
it, it stops working the moment the real user refreshes (and vice-versa) — the window of
abuse is tiny. Storing only a **SHA-256 hash** of the token (see
[`generateTokens.js`](server/utils/generateTokens.js)) means even a database leak doesn't
hand out usable tokens — same idea as hashing passwords.

**Silent session restore.** On app load, [`AuthContext`](client/src/context/AuthContext.jsx)
calls the refresh endpoint once. The browser auto-attaches the httpOnly cookie; if it's
valid, the user is logged straight back in — no re-login after a refresh.

**Silent refresh on expiry (single-flight).** The axios response interceptor
([`axios.js`](client/src/api/axios.js)) catches a `401`, calls the refresh endpoint, gets a
new access token, and **replays the original request** — invisibly. If several requests
`401` at once, only the **first** triggers a refresh; the rest wait in a queue and replay
with the new token. This "single-flight" guard avoids a stampede of refresh calls.

**Cross-origin considerations.** Frontend (Vercel) and API (Render) are different origins,
so the cookie must be `SameSite=None; Secure` in production
([`generateTokens.js`](server/utils/generateTokens.js#L60)), the API must set `trust proxy`
(the cookie is `Secure` behind Render's load balancer), and CORS must send a **specific**
origin with `credentials: true` (a wildcard `*` is illegal with credentials).

> **Summary.** Short-lived JWT access tokens are held in memory; a rotating refresh token
> lives in an httpOnly cookie and is persisted only as a SHA-256 hash. Each refresh rotates
> (invalidates) the token, so an XSS attacker cannot read the cookie and a stolen refresh
> token stops working on the next legitimate refresh.

---

## 2. Product filtering — the `APIFeatures` builder

**The problem.** One `GET /products` endpoint has to support text search + a stack of
filters + sorting + pagination, without a tangle of `if` statements — and be reusable for
other collections.

**How it works.** [`APIFeatures`](server/utils/apiFeatures.js) wraps a Mongoose query and
exposes chainable methods, each of which narrows the query:

```js
const features = new APIFeatures(Product.find(), req.query)
  .search()    // regex OR across name / brand / description / tags
  .filter()    // category, brand, price range, rating, size, color, featured
  .sort()      // maps friendly keys (price-asc, top-rated…) to Mongoose sort
  .paginate(); // page + limit → skip/limit, with sane caps
const products = await features.execute();
```

- **Comma lists → `$in`.** `category=a,b,c` becomes `{ category: { $in: [...] } }`; same
  for brand/size/color. This is what powers multi-select filters.
- **Ranges → `$gte` / `$lte`.** Price min/max; rating is `ratings >= n`.
- It also accumulates the raw filter object so the controller can run a matching
  `countDocuments` for correct pagination totals.

**URL-synced on the frontend.** [`Shop.jsx`](client/src/pages/Shop.jsx) keeps **all** filter
state in the URL query string via `useSearchParams` — not React state. So:
- filters are **shareable and bookmarkable**, and survive a reload/back-button,
- the search box is **debounced (300 ms)** before being pushed to the URL, so typing
  doesn't fire a request per keystroke,
- changing any filter resets pagination to page 1.

> **Summary.** Filtering is a reusable query builder — search/filter/sort/paginate chained
> on a Mongoose query — and the React side keeps filter state in the URL, so results are
> shareable and debounced rather than firing a request per keystroke.

---

## 3. Cart & checkout

**Guest cart → DB cart (the sync).** Logged out, the cart lives in `localStorage`
([`CartContext.jsx`](client/src/context/CartContext.jsx)). The instant the user logs in, the
guest cart is `POST`ed to [`/cart/sync`](server/controllers/cartController.js): the server
**merges** matching lines (same product + size + color), **caps quantities at stock**, and
then the client clears `localStorage` so the DB cart becomes the single source of truth.
A `useRef` guard makes this run **once per login**, not on every re-render.

**Totals (computed on the server, never trusted from the client).** All money math lives in
one place — [`orderTotals.js`](server/utils/orderTotals.js) — so the checkout preview, the
payment endpoint, and order creation always agree:
1. `itemsTotal` = Σ (effective unit price × qty), where effective price = discountPrice if
   set, else price,
2. apply coupon → `discountedSubtotal`,
3. **free shipping ≥ $100**, else $9.99,
4. **tax = 10%** of the discounted subtotal,
5. `total = discountedSubtotal + shipping + tax`.

**Placing the order** ([`orderController.js`](server/controllers/orderController.js)) is
transactional-in-spirit: it re-validates stock, **re-computes totals from the DB cart**
(so a tampered client price is ignored), writes the order with **line-item snapshots**
(name/price/image frozen at purchase time, so history stays correct even if the product is
later edited or deleted), decrements stock + bumps `sold`, records coupon usage, clears the
cart, and emails a confirmation.

**Payment.** The catalog is priced in USD. The checkout renders whichever gateways are
configured for the environment ([`paymentController.js`](server/controllers/paymentController.js)),
and the charged amount is always computed server-side from the DB cart — never sent by the
client:
- **Stripe (card, USD)** — the browser confirms a PaymentIntent in-page
  ([`stripe.js`](server/utils/stripe.js),
  [`StripePaymentForm.jsx`](client/src/components/cart/StripePaymentForm.jsx)). The server
  then re-fetches the PaymentIntent and checks its `status`, `currency`, and exact `amount`
  before marking the order `paid`.
- **Razorpay (UPI/card, INR)** — the USD total is converted at a live, cached exchange rate
  ([`exchangeRate.js`](server/utils/exchangeRate.js)), the user pays in Razorpay's window,
  and the server verifies the **HMAC-SHA256 signature**
  ([`razorpay.js`](server/utils/razorpay.js)) before marking `paid`.
- **COD** → order saved as `pending`. **No gateway keys set** → a no-charge demo marks the
  order `paid` so the flow still completes end-to-end.

The rule throughout: never trust a client's "I paid" claim — re-verify with the gateway
server-side before changing order state.

> **Summary.** The cart follows the user (guest cart in localStorage merges into the DB cart
> on login). Totals and stock are recomputed server-side at checkout, order line items are
> snapshotted, and a payment is only marked paid after the gateway is verified server-side —
> Stripe by re-fetching the PaymentIntent, Razorpay by checking its HMAC signature.

---

## 4. Admin analytics (MongoDB aggregation)

**The problem.** Turn the raw `orders` collection into dashboard numbers and charts
efficiently — in the database, not by pulling every order into Node.

**How it works** ([`adminController.js`](server/controllers/adminController.js)). The
dashboard fires several **aggregation pipelines** in parallel (`Promise.all`):
- **Total revenue & order count** — `$match` orders *not* cancelled/returned, then
  `$group` with `$sum`.
- **Status distribution** (the doughnut) — `$group` by `$orderStatus`, count each.
- **Top products** (the bar chart) — sort products by `sold`, take 5.
- **Today's orders / new users** — `countDocuments` with a `createdAt >= startOfToday`.

**The 12-month revenue chart** is the piece worth explaining:
1. `$group` paid orders by `{ year, month }` and `$sum` their totals,
2. then the code **builds a continuous 12-month series in JS, filling missing months with
   0** — so the line chart always shows all 12 months, even ones with no sales, instead of
   skipping gaps.

This is why the [seed](server/utils/seedData.js) backdates orders across the last 12
months: so the chart renders a real trend rather than a single spike.

> **Summary.** The dashboard runs MongoDB aggregation pipelines (`$match`, `$group`,
> `$sum`/`$avg`) so summarisation happens in the database. Revenue is grouped by month, then
> empty months are filled with zero in code to produce a continuous 12-month trend.

---

## Quick file map

| System | Backend | Frontend |
|--------|---------|----------|
| Auth + rotation | `authController.js`, `generateTokens.js`, `authMiddleware.js` | `AuthContext.jsx`, `api/axios.js` |
| Product filtering | `apiFeatures.js`, `productController.js` | `Shop.jsx`, `components/products/ProductFilters.jsx` |
| Cart & checkout | `cartController.js`, `orderController.js`, `orderTotals.js`, `paymentController.js`, `stripe.js`, `razorpay.js`, `exchangeRate.js` | `CartContext.jsx`, `pages/Checkout.jsx`, `components/cart/StripePaymentForm.jsx` |
| Admin analytics | `adminController.js` | `pages/admin/Dashboard.jsx` |
