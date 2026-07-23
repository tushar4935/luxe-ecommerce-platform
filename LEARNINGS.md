# LEARNINGS — How LUXE Works (in plain English)

A study guide for the four systems most worth understanding — and explaining in an
interview: **auth + refresh rotation**, **product filtering**, **cart & checkout**, and
**admin analytics**. Each section says *what problem it solves*, *how it works*, *why it's
built that way*, and gives a short **"say this in an interview"** soundbite.

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

**Rotation (the interesting part).** Every time the client refreshes
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

**Cross-origin note (why it works on the live site).** Frontend (Vercel) and API (Render)
are different origins, so the cookie must be `SameSite=None; Secure` in production
([`generateTokens.js`](server/utils/generateTokens.js#L60)), the API must set `trust proxy`
(cookie is `Secure` behind Render's load balancer), and CORS must send a **specific**
origin with `credentials: true` (a wildcard `*` is illegal with credentials).

> **Say this in an interview:** *"I use short-lived JWT access tokens in memory plus a
> rotating refresh token in an httpOnly cookie. Refresh tokens are hashed in the DB and
> single-use — each refresh rotates them — so XSS can't read the cookie and a stolen
> refresh token dies on next use."*

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

> **Say this in an interview:** *"Filtering is a reusable query builder — search/filter/
> sort/paginate chained on a Mongoose query — and the React side keeps filter state in the
> URL, so results are shareable and debounced instead of hammering the API."*

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

**Payment** ([`razorpay.js`](server/utils/razorpay.js)):
- **COD** → order saved as `pending`.
- **Card + Razorpay keys present** → the browser pays in Razorpay's window; the server
  **verifies the HMAC-SHA256 signature** before marking the order `paid`. Never trust the
  client's "I paid" claim — verify the signature.
- **Card/PayPal without keys** → a no-charge demo marks it `paid` so the flow completes.

> **Say this in an interview:** *"The cart follows the user — guest cart in localStorage
> merges into the DB cart on login. All totals and stock checks are recomputed server-side
> at checkout, order items are snapshotted, and Razorpay payments are only marked paid
> after verifying the gateway's HMAC signature."*

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

This is exactly why the [seed](server/utils/seedData.js) backdates orders across the last
12 months: so this chart renders a real trend rather than a single spike.

> **Say this in an interview:** *"The dashboard runs MongoDB aggregation pipelines —
> `$match`, `$group`, `$sum`/`$avg` — so summarisation happens in the database. Revenue is
> grouped by month, then I fill empty months with zero in code so the chart is a continuous
> 12-month trend."*

---

## Quick file map

| System | Backend | Frontend |
|--------|---------|----------|
| Auth + rotation | `authController.js`, `generateTokens.js`, `authMiddleware.js` | `AuthContext.jsx`, `api/axios.js` |
| Product filtering | `apiFeatures.js`, `productController.js` | `Shop.jsx`, `components/products/ProductFilters.jsx` |
| Cart & checkout | `cartController.js`, `orderController.js`, `orderTotals.js`, `razorpay.js` | `CartContext.jsx`, `pages/Checkout.jsx` |
| Admin analytics | `adminController.js` | `pages/admin/Dashboard.jsx` |
