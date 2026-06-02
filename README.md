# LUXE — Modern Ecommerce Platform

A complete, production-ready **MERN** ecommerce application with a dark luxury
theme. Customers browse, search, filter, wishlist, compare, checkout and track
orders; admins manage products, orders, users, categories, coupons, reviews and
view analytics.

> Stack: **MongoDB · Express · React (Vite) · Node.js** — JWT auth with refresh
> rotation, Cloudinary uploads, Nodemailer emails, Recharts dashboards.

---

## ✨ Features

**Storefront**
- Hero, category carousel, featured & new-arrival sliders (Swiper)
- Shop with **URL-synced** filters (category, brand, price, rating, size, color),
  debounced search, sort, grid/list toggle, pagination, quick-view modal
- Product detail: image gallery, size/color pickers, quantity, tabs
  (Description / Specifications / Reviews), rating distribution, related products
- Cart (guest **localStorage** → synced to DB on login), slide-in cart drawer,
  coupons, live totals (free shipping > $100, 10% tax)
- Multi-step checkout (Shipping → Payment → Review) with saved addresses
- Wishlist, product compare (up to 4)
- Account: profile + avatar, orders with status timeline, cancel/reorder,
  address book, change password

**Admin**
- Dashboard: revenue line chart (12 mo), order-status doughnut, top-products bar,
  recent orders, stat cards
- Product CRUD with multi-image upload, dynamic sizes/colors, featured/active toggles
- Orders management with inline status updates + history + customer emails
- Users management (activate/deactivate, order history, total spent)
- Categories, Coupons, Reviews moderation

**Platform**
- JWT access (15 m) + refresh (7 d, httpOnly cookie) with **rotation** and silent
  session restore
- Role-based authorization (`customer` / `admin`)
- `express-validator`, `helmet`, `cors`, `express-rate-limit`, `express-mongo-sanitize`,
  `hpp`, `compression`
- Global error handler with Mongoose/JWT/duplicate-key normalization
- Reusable `APIFeatures` (search/filter/sort/paginate) and seed script

---

## 🧱 Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | React 18, Vite 5, React Router 6, Tailwind CSS 3, Axios, React Hook Form + Zod, Recharts, Swiper, react-hot-toast, lucide-react |
| Backend   | Node 18+, Express 4, Mongoose 8, JWT, bcryptjs, Multer + Cloudinary, Nodemailer, express-validator |
| Database  | MongoDB 6/7 |

---

## ✅ Prerequisites

- **Node.js 18+** and npm 9+
- **MongoDB** running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI
- *(Optional)* a **Cloudinary** account for real image uploads
- *(Optional)* SMTP credentials (e.g. a Gmail App Password) for real emails

> Cloudinary and SMTP are **optional in development**: without them, the app uses
> deterministic `picsum.photos` placeholder images and logs emails to the server
> console — every flow still works end-to-end.

---

## 🚀 Local Setup

```bash
# 1. Clone
git clone <your-repo-url> luxe-ecommerce
cd luxe-ecommerce

# 2. Backend
cd server
cp .env.example .env        # then edit values (defaults work for local dev)
npm install
npm run seed                # creates demo users, products, orders, coupons
npm run dev                 # http://localhost:5000

# 3. Frontend (new terminal)
cd ../client
cp .env.example .env        # VITE_API_URL=/api (uses the Vite proxy)
npm install
npm run dev                 # http://localhost:5173
```

Open **http://localhost:5173**.

### Environment variables

**`server/.env`**

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` or `production` |
| `PORT` | API port (default `5000`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Long random strings |
| `JWT_ACCESS_EXPIRE` / `JWT_REFRESH_EXPIRE` | e.g. `15m` / `7d` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Optional — image uploads |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASS` / `EMAIL_FROM` | Optional — Nodemailer SMTP |
| `FRONTEND_URL` | Frontend origin for CORS + email links (`http://localhost:5173`) |

**`client/.env`**

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API base. `/api` in dev (Vite proxy); full URL in prod (`https://api.example.com/api`) |

---

## 🔑 Default Credentials (after `npm run seed`)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@luxe.com` | `Admin@123` |
| Customer | `customer1@luxe.com` | `Customer@123` |
| Customer | `customer2@luxe.com` | `Customer@123` |
| Customer | `customer3@luxe.com` | `Customer@123` |

Demo coupons: **WELCOME10** (10% off), **SAVE20** (20% off, min $150), **FLAT50** ($50 off min $200).

---

## 🗂 Project Structure

```
luxe-ecommerce/
├── server/
│   ├── config/         # db, cloudinary, nodemailer
│   ├── controllers/    # auth, user, product, category, cart, order, review, wishlist, coupon, admin
│   ├── middleware/     # auth, admin, error, validate, upload
│   ├── models/         # User, Product, Category, Order, Cart, Review, Wishlist, Coupon, RefreshToken
│   ├── routes/         # one router per resource
│   ├── utils/          # generateTokens, apiFeatures, sendEmail, seedData, asyncHandler, ApiError
│   └── server.js
└── client/
    └── src/
        ├── api/         # axios instance + per-resource API modules
        ├── components/  # layout, ui, products, cart, admin
        ├── context/     # AuthContext, CartContext, WishlistContext
        ├── hooks/       # useAuth, useCart, useWishlist, useDebounce, useLocalStorage
        ├── pages/       # store, auth, account/, admin/
        ├── routes/      # AppRoutes, PrivateRoute, AdminRoute
        └── utils/       # formatCurrency, formatDate, calculateDiscount, validators (zod)
```

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`. All responses are JSON with a
`{ success, ... }` envelope. Protected routes require
`Authorization: Bearer <accessToken>`.

### Auth — `/auth`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register; returns `accessToken` + sets refresh cookie |
| POST | `/login` | Login |
| POST | `/logout` | Revoke refresh token |
| POST | `/refresh-token` | Rotate refresh token, return new access token |
| GET | `/verify-email/:token` | Verify email |
| POST | `/forgot-password` | Send reset email |
| POST | `/reset-password/:token` | Set new password |

### Users — `/users` *(protected)*
`GET /me` · `PUT /me` *(multipart `avatar`)* · `PUT /me/password` ·
`GET/POST /me/addresses` · `PUT/DELETE /me/addresses/:id`

### Products — `/products`
`GET /` *(search, category, brand, minPrice, maxPrice, rating, size, color, sort, page, limit)* ·
`GET /featured` · `GET /related/:id` · `GET /:slug` ·
`GET /id/:id` *(admin)* · `POST /` *(admin, multipart)* · `PUT /:id` *(admin)* ·
`DELETE /:id` *(admin, soft delete)* · `POST /:id/images` · `DELETE /:id/images/:imageId`

### Categories — `/categories`
`GET /` *(with product counts)* · `GET /:slug` · `POST/PUT/DELETE` *(admin)*

### Cart — `/cart` *(protected)*
`GET /` · `POST /` · `PUT /:itemId` · `DELETE /:itemId` · `DELETE /` · `POST /sync`

### Orders — `/orders` *(protected)*
`GET /` · `GET /:id` · `POST /` *(place order)* · `POST /:id/cancel`

### Reviews — `/reviews`
`GET /` *(admin, all)* · `GET /product/:productId` · `POST /product/:productId` ·
`PUT /:id` · `DELETE /:id` · `POST /:id/helpful`

### Wishlist — `/wishlist` *(protected)*
`GET /` · `POST /:productId` · `DELETE /:productId` · `POST /move-to-cart/:productId`

### Coupons — `/coupons`
`POST /validate` *(protected)* · `GET/POST /` *(admin)* · `PUT/DELETE /:id` *(admin)*

### Admin — `/admin` *(admin only)*
`GET /dashboard` · `GET /users` · `GET /users/:id` · `PUT /users/:id/status` ·
`GET /orders` · `PUT /orders/:id/status` · `GET /analytics/revenue?period=` ·
`GET /analytics/products`

**Example — login**

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "admin@luxe.com", "password": "Admin@123" }
```
```json
{ "success": true, "accessToken": "eyJ...", "user": { "_id": "...", "role": "admin" } }
```

---

## 📜 Scripts

**server**

| Script | Action |
|--------|--------|
| `npm run dev` | Start with nodemon |
| `npm start` | Start with node |
| `npm run seed` | Seed demo data |
| `npm run seed:destroy` | Wipe all collections |

**client**

| Script | Action |
|--------|--------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the build |

---

## ☁️ Deployment Guide

### MongoDB Atlas
1. Create a free **M0** cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Add a database user and allow your server IP (or `0.0.0.0/0` for testing).
3. Copy the connection string into `MONGO_URI`.

### Backend → Render / Railway
1. New **Web Service** from your repo, root directory `server`.
2. Build: `npm install` · Start: `node server.js`.
3. Add all `server/.env` variables. Set `NODE_ENV=production` and
   `FRONTEND_URL` to your deployed frontend origin.
4. Run the seed once (Render Shell / Railway: `npm run seed`).

### Frontend → Vercel
1. Import the repo, root directory `client`, framework **Vite**.
2. Build: `npm run build` · Output: `dist`.
3. Env: `VITE_API_URL=https://<your-backend>/api`.
4. Deploy. Ensure the backend `FRONTEND_URL` matches the Vercel URL so CORS +
   the refresh cookie (`SameSite=None; Secure`) work.

### Cloudinary (free tier)
Create an account, copy Cloud name / API key / API secret into the backend env.
Uploaded product/category/avatar images are then stored on Cloudinary; otherwise
the app falls back to placeholder images.

---

## ⚠️ Known Limitations & Future Improvements
- Payment is **UI-only** (Stripe/PayPal flows are simulated; COD is fully functional).
- No real-time order tracking (would add WebSockets/SSE).
- Email verification is optional and non-blocking by default.
- Single-currency (USD); i18n/multi-currency could be added.
- Frontend bundle could be code-split (lazy routes) to shrink initial load.
- Add automated tests (Jest + React Testing Library + Supertest).

---

## 📄 License
MIT — built as a full-stack reference implementation.
