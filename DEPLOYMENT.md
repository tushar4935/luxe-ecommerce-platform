# 🚀 Deploying LUXE Live (Free)

This guide takes LUXE from `localhost` to a public URL anyone can open. It's all
free tiers and takes about **30–45 minutes** the first time.

## The big picture

Your app has 3 parts, so it goes to 3 places:

```
  React frontend  ──►  Vercel        https://luxe-shop.vercel.app   (what visitors open)
  Express backend ──►  Render        https://luxe-api.onrender.com  (the API)
  MongoDB data    ──►  MongoDB Atlas (cloud database)
```

They talk to each other over the internet, so the **order matters**: database
first, then backend, then frontend, then connect them.

> Everything you paste below (URLs, keys) is filled in as you go. Keep this file
> open and jot your real values next to each placeholder.

---

## Prerequisite: put the code on GitHub

Render and Vercel deploy *from a GitHub repo*, and this project isn't on git yet.

1. Create a free account at <https://github.com> if you don't have one.
2. On GitHub, click **New repository** → name it `luxe-ecommerce` → **Private** is
   fine → **Create** (don't add a README/gitignore, we already have them).
3. In a terminal, from the project root (`Ecommerce Website/`):

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/luxe-ecommerce.git
   git push -u origin main
   ```

✅ **Safety check:** our `.gitignore` already excludes `.env` and `node_modules`,
so your secrets and 100k+ dependency files will **not** be uploaded. After
pushing, confirm on GitHub that there is **no `.env` file** in `server/`.

---

## Step 1 — Database: MongoDB Atlas

1. Sign up at <https://www.mongodb.com/cloud/atlas/register>.
2. **Create a cluster** → choose the **free M0** tier → any cloud/region near you → **Create**.
3. **Database Access** (left menu) → **Add New Database User**:
   - Username: `luxe` · Password: click **Autogenerate** and **copy it somewhere**.
   - Built-in role: **Read and write to any database** → **Add User**.
4. **Network Access** → **Add IP Address** → **Allow access from anywhere**
   (`0.0.0.0/0`). Render's free servers don't have a fixed IP, so this is needed.
5. **Database** → **Connect** → **Drivers** → copy the connection string. It looks like:

   ```
   mongodb+srv://luxe:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

   - Replace `<password>` with the password from step 3.
   - Add a database name before the `?` → use `luxe-ecommerce`:

   ```
   mongodb+srv://luxe:YOURPASS@cluster0.xxxxx.mongodb.net/luxe-ecommerce?retryWrites=true&w=majority
   ```

   📌 **Save this as your `MONGO_URI`.**

6. **Seed the cloud database** (loads the 100 products, admin user, etc.). From
   the `server/` folder, run it once with your Atlas URI:

   ```bash
   cd server
   MONGO_URI="mongodb+srv://luxe:YOURPASS@cluster0.xxxxx.mongodb.net/luxe-ecommerce?retryWrites=true&w=majority" npm run seed
   ```

   You should see `✅ Seed complete!`.

---

## Step 2 — Backend: Render

1. Sign up at <https://render.com> with your GitHub account.
2. **New +** → **Web Service** → connect and pick your `luxe-ecommerce` repo.
3. Configure:
   | Setting | Value |
   |---|---|
   | Root Directory | `server` |
   | Runtime | Node |
   | Build Command | `npm install` |
   | Start Command | `node server.js` |
   | Instance Type | **Free** |

   *(Or use the included `render.yaml` via **New + → Blueprint** to pre-fill this.)*

4. Scroll to **Environment Variables** → add these:
   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | *your Atlas string from Step 1* |
   | `JWT_ACCESS_SECRET` | *click "Generate" or paste a long random string* |
   | `JWT_REFRESH_SECRET` | *a different long random string* |
   | `JWT_ACCESS_EXPIRE` | `15m` |
   | `JWT_REFRESH_EXPIRE` | `7d` |
   | `FRONTEND_URL` | *leave blank for now — we set it in Step 4* |
   | `RAZORPAY_KEY_ID` | *blank (demo) or your test key* |
   | `RAZORPAY_KEY_SECRET` | *blank or your test secret* |
   | `RAZORPAY_CURRENCY` | `INR` |

5. **Create Web Service**. Wait for the build to finish (a few minutes). When it's
   live, copy the URL at the top, e.g. `https://luxe-api.onrender.com`.

   ✅ Test it: open `https://luxe-api.onrender.com/api/health` — you should see
   `{"success":true,"message":"LUXE API is running"...}`.

   📌 **Save this as your backend URL.**

> ⏱ **Free-tier note:** Render puts free services to sleep after ~15 min of no
> traffic. The *first* request after that takes ~50 seconds to wake up, then it's
> fast again. Normal for free hosting.

---

## Step 3 — Frontend: Vercel

1. Sign up at <https://vercel.com> with your GitHub account.
2. **Add New… → Project** → import your `luxe-ecommerce` repo.
3. Configure:
   | Setting | Value |
   |---|---|
   | Root Directory | `client` |
   | Framework Preset | Vite *(auto-detected)* |
   | Build Command | `npm run build` *(default)* |
   | Output Directory | `dist` *(default)* |

4. Expand **Environment Variables** and add **one**:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://luxe-api.onrender.com/api` |

   ⚠️ Use **your** Render URL from Step 2, and **keep the `/api` on the end**.

5. **Deploy**. When done, you get a URL like `https://luxe-shop.vercel.app`.

   📌 **Save this as your frontend URL.**

---

## Step 4 — Connect the two (the step everyone forgets)

The backend only accepts requests from the frontend origin it's told about, and
login cookies only work between known sites. So:

1. Go back to **Render → your service → Environment**.
2. Set **`FRONTEND_URL`** to your exact Vercel URL **without a trailing slash**:
   ```
   FRONTEND_URL = https://luxe-shop.vercel.app
   ```
3. Save → Render redeploys automatically (~1 min).

---

## ✅ Test your live site

1. Open your **Vercel URL** → the shop should load with all 100 products.
2. **Register** a new account and **log in** → you should stay logged in on refresh.
3. **Admin:** log in with `admin@luxe.com` / `Admin@123` → visit `/admin`.
4. Add something to the cart → checkout → place an order.

If login or data fails, jump to Troubleshooting below.

---

## 🛠 Troubleshooting (the usual suspects)

| Symptom | Cause & fix |
|---|---|
| Shop is empty / "Network Error" | `VITE_API_URL` on Vercel is wrong or missing `/api`. Fix it → **Redeploy** (Vercel doesn't rebuild on env change automatically). |
| First load is very slow, then fine | Render free tier waking up (~50s). Normal. |
| Login "works" but logs out on refresh | `FRONTEND_URL` on Render doesn't *exactly* match your Vercel URL (trailing slash, `http` vs `https`, or `www`). Must match exactly. |
| CORS error in browser console | Same as above — `FRONTEND_URL` mismatch. |
| Refreshing `/shop` shows 404 | The `client/vercel.json` SPA rewrite wasn't picked up — confirm the file exists and Root Directory is `client`. |
| Can't connect to database | Atlas **Network Access** must allow `0.0.0.0/0`, and the password in `MONGO_URI` must be URL-safe (no unescaped `@`, `:` etc.). |

---

## 🔁 Updating the live site later

Both platforms auto-deploy on every push to `main`:

```bash
git add .
git commit -m "your change"
git push
```

Render rebuilds the API and Vercel rebuilds the site automatically.

---

## 💳 Razorpay in production (optional)

- Leaving `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` blank on Render = demo checkout
  (orders work, no real gateway). Perfectly fine for a portfolio.
- To take **real test payments live**, paste your `rzp_test_...` keys into Render's
  env vars (same as local). For **real money**, you'd complete Razorpay KYC and use
  live keys — only do that for an actual business.
