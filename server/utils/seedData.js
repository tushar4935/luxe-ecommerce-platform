/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const RefreshToken = require('../models/RefreshToken');

// Build a 600×600 product image from an Unsplash photo id.
const img = (id) => ({
  url: `https://images.unsplash.com/photo-${id}?w=600&h=600&fit=crop&q=80`,
  public_id: `seed_${id}`,
});

// Curated, category-appropriate Unsplash photo ids. Every id below was verified
// twice: (a) it returns HTTP 200, and (b) it actually depicts the right product
// (checked visually via per-category contact sheets — caps, bags, cars, beaches
// and other off-topic shots were removed). Each product pulls only from its own
// category pool so images always match the item.
const categoryImageIds = {
  'T-Shirts': ['1521572163474-6864f9cf17ab', '1576566588028-4147f3842f27', '1583743814966-8936f5b7be1a', '1503341504253-dff4815485f1', '1622445275576-721325763afe', '1618354691373-d851c5c3a990', '1620799140408-edc6dcb6d633', '1583744946564-b52ac1c389c8'],
  Bags: ['1548036328-c9fa89d128fa', '1584917865442-de89df76afd3', '1590874103328-eac38a683ce7', '1566150905458-1bf1fc113f0d', '1591561954557-26941169b49e', '1559563458-527698bf5295', '1553062407-98eeb64c6a62', '1614179689702-355944cd0918', '1612902456551-333ac5afa26e', '1581605405669-fcdf81165afa', '1547949003-9792a18a2601'],
  Shoes: ['1542291026-7eec264c27ff', '1549298916-b41d501d3772', '1525966222134-fcfa99b8ae77', '1543163521-1bf539c55dd2', '1535043934128-cf0b28d52f95', '1600185365926-3a2ce3cdb9eb', '1595950653106-6c9ebd614d3a', '1606107557195-0e29a4b5b4aa', '1514989940723-e8e51635b782', '1491553895911-0055eca6402d', '1608231387042-66d1773070a5'],
  Accessories: ['1601924994987-69e26d50dc26', '1611085583191-a3b181a88401', '1556306535-0f09a537f0a3', '1611652022419-a9419f74343d', '1524805444758-089113d48a6d', '1508296695146-257a814070b4', '1572635196237-14b3f281503f', '1517254797898-04edd251bfb3', '1620625515032-6ed0c1790c75', '1606760227091-3dd870d97f1d'],
  Dresses: ['1595777457583-95e059d581b8', '1572804013309-59a88b7e92f1', '1583496661160-fb5886a0aaaa', '1566174053879-31528523f8ae', '1539008835657-9e8e9680c956', '1515372039744-b8f02a3ae446', '1502716119720-b23a93e5fe1b'],
  Jackets: ['1551028719-00167b16eac5', '1520975954732-35dd22299614', '1591047139829-d91aecb6caea', '1544022613-e87ca75a784a', '1578587018452-892bacefd3f2', '1539533018447-63fcce2678e3', '1605908502724-9093a79a1b39', '1521223890158-f9f7c3d5d504', '1539109136881-3be0616acf4b', '1483985988355-763728e1935b', '1507114845806-0347f6150324'],
  Pants: ['1473966968600-fa801b869a1a', '1624378439575-d8705ad7ae80', '1594633312681-425c7b97ccd1', '1542272604-787c3835535d', '1551854838-212c50b4c184', '1604176354204-9268737828e4', '1565084888279-aca607ecce0c', '1517445312882-bc9910d016b7', '1584865288642-42078afe6942'],
  Sportswear: ['1517836357463-d25dfeac3438', '1556817411-31ae72fa3ea0', '1483721310020-03333e577078', '1571019613454-1cb2f99b2d8b', '1538805060514-97d9cc17730c', '1518611012118-696072aa579a', '1552674605-db6ffd4facb5', '1606902965551-dce093cda6e7', '1581009146145-b5ef050c2e1e', '1593079831268-3381b0db4a77'],
};

// Four distinct gallery images for a product, rotated within its category pool
// so different products in the same category lead with a different photo.
const galleryFor = (categoryName, index) => {
  const ids = categoryImageIds[categoryName] || categoryImageIds.Accessories;
  return Array.from({ length: 4 }, (_, i) => img(ids[(index + i) % ids.length]));
};

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLORS = [
  { name: 'Black', hex: '#0a0a0a' },
  { name: 'Ivory', hex: '#f5f5f5' },
  { name: 'Gold', hex: '#c9a84c' },
  { name: 'Charcoal', hex: '#2a2a2a' },
  { name: 'Camel', hex: '#a8893c' },
  { name: 'Burgundy', hex: '#5a1a2a' },
  { name: 'Navy', hex: '#1b2a4a' },
  { name: 'Forest', hex: '#1f3b2c' },
  { name: 'Slate', hex: '#5a6470' },
  { name: 'Blush', hex: '#e8c9c0' },
  { name: 'Sand', hex: '#d8c4a0' },
  { name: 'Cobalt', hex: '#2747a8' },
];
const BRANDS = ['Aurelia', 'Noir & Co', 'Lumen', 'Maison Vega', 'Atelier 9', 'Velour', 'Solène', 'Marchetti', 'Hauten'];

const pick = (arr, n) => {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i += 1) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
};
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// 8 categories with descriptions
const categoryData = [
  { name: 'T-Shirts', description: 'Premium cotton and modal tees designed for everyday luxury.' },
  { name: 'Bags', description: 'Hand-finished leather bags and structured totes.' },
  { name: 'Shoes', description: 'Sculpted footwear, from minimalist sneakers to evening heels.' },
  { name: 'Accessories', description: 'Refined finishing touches — scarves, belts, and more.' },
  { name: 'Dresses', description: 'Occasion and everyday dresses with a tailored silhouette.' },
  { name: 'Jackets', description: 'Outerwear engineered for warmth and timeless shape.' },
  { name: 'Pants', description: 'Tailored trousers and relaxed lounge fits.' },
  { name: 'Sportswear', description: 'Performance pieces with an elevated, monochrome edge.' },
];

// Realistic product name pools per category (14 each → enough variety that no
// two products in the same category share a base name in a 100-item catalog).
const namePools = {
  'T-Shirts': ['Pima Crew Tee', 'Modal Pocket Tee', 'Oversized Box Tee', 'Ribbed Henley', 'Essential V-Neck', 'Heavyweight Crewneck', 'Slub Cotton Tee', 'Longline Curved-Hem Tee', 'Garment-Dyed Tee', 'Boxy Logo Tee', 'Supima Relaxed Tee', 'Striped Breton Tee', 'Waffle-Knit Long Sleeve', 'Fitted Scoop Tee'],
  Bags: ['Structured Leather Tote', 'Quilted Crossbody', 'Minimalist Bucket Bag', 'Top-Handle Satchel', 'Soft Hobo Shoulder Bag', 'Compact Card Wallet', 'Saddle Crossbody', 'Woven Raffia Tote', 'Convertible Belt Bag', 'Drawstring Pouch Bag', 'Boxy Camera Bag', 'Leather Backpack', 'Slim Evening Clutch', 'East-West Shoulder Bag'],
  Shoes: ['Suede Low Sneaker', 'Leather Chelsea Boot', 'Pointed Court Heel', 'Woven Loafer', 'Runner Knit Trainer', 'Strappy Block Sandal', 'Lug-Sole Derby', 'Almond-Toe Mule', 'Platform Sneaker', 'Ankle-Strap Pump', 'Espadrille Wedge', 'Slip-On Trainer', 'Leather Riding Boot', 'Minimal Ballet Flat'],
  Accessories: ['Cashmere Scarf', 'Braided Leather Belt', 'Silk Twill Square', 'Felt Wide-Brim Hat', 'Gold-Tone Cuff', 'Leather Card Holder', 'Tortoise Sunglasses', 'Pearl Drop Earrings', 'Ribbed Wool Beanie', 'Slim Leather Belt', 'Chain-Link Necklace', 'Suede Gloves', 'Minimalist Watch', 'Knit Beret'],
  Dresses: ['Bias-Cut Slip Dress', 'Pleated Midi Dress', 'Wrap Knit Dress', 'Tailored Shirt Dress', 'Satin Column Gown', 'Linen Day Dress', 'Smocked Poplin Dress', 'Ruched Bodycon Dress', 'Tiered Maxi Dress', 'Halter Cocktail Dress', 'Belted Shift Dress', 'Off-Shoulder Midi Dress', 'Cami Slip Dress', 'A-Line Sundress'],
  Jackets: ['Wool Overcoat', 'Cropped Moto Jacket', 'Quilted Liner Jacket', 'Double-Breasted Blazer', 'Shearling Aviator', 'Belted Trench', 'Denim Trucker Jacket', 'Padded Puffer', 'Suede Bomber', 'Hooded Parka', 'Utility Field Jacket', 'Tailored Tweed Blazer', 'Faux-Leather Biker', 'Collarless Wool Coat'],
  Pants: ['Pleated Wide Trouser', 'Tapered Wool Pant', 'Relaxed Linen Pant', 'High-Rise Cigarette Pant', 'Drawstring Lounge Pant', 'Straight Leg Denim', 'Cropped Chino', 'Belted Paperbag Pant', 'Slim Stretch Trouser', 'Wide-Leg Jean', 'Pull-On Ponte Pant', 'Pintuck Trouser', 'Corduroy Pant', 'Tailored Jogger'],
  Sportswear: ['Compression Run Tight', 'Tech Fleece Hoodie', 'Seamless Training Top', 'Performance Track Jacket', 'Studio Bike Short', 'Featherweight Windbreaker', 'Ribbed Sports Bra', 'Quick-Dry Running Tee', 'Tapered Track Pant', 'Cropped Training Tank', 'Thermal Base Layer', 'Mesh-Panel Legging', 'Half-Zip Pullover', 'Woven Training Short'],
};

// Category-specific copy so descriptions read like a real catalog, not filler.
const materialByCat = {
  'T-Shirts': 'spun from long-staple Pima cotton with a hint of stretch for a clean, lived-in drape',
  Bags: 'cut from full-grain leather and finished with polished, tarnish-resistant hardware',
  Shoes: 'built on a cushioned footbed with a hand-burnished upper and a hard-wearing sole',
  Accessories: 'finished by hand from premium materials with a refined, understated sheen',
  Dresses: 'cut from a fluid, breathable fabric that skims the body and moves with you',
  Jackets: 'tailored from a structured, weather-ready shell over a smooth, comfortable lining',
  Pants: 'tailored from a mid-weight weave with a comfort waistband that holds its shape all day',
  Sportswear: 'engineered from moisture-wicking, four-way-stretch fabric that breathes through every rep',
};

// Believable price bands per category — keeps a tee from costing as much as a coat.
const priceRangeByCat = {
  'T-Shirts': [35, 95],
  Bags: [120, 680],
  Shoes: [90, 420],
  Accessories: [40, 260],
  Dresses: [90, 480],
  Jackets: [160, 720],
  Pants: [70, 320],
  Sportswear: [45, 190],
};

const descFor = (name, brand, catName) =>
  `The ${name} by ${brand} is ${materialByCat[catName] || 'crafted from premium materials with meticulous attention to detail'}. ` +
  `Designed for an effortless, modern silhouette, it layers easily and carries from day into evening without missing a beat. ` +
  `A considered, wear-anywhere addition to a thoughtfully built wardrobe.`;

const destroyAll = async () => {
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Review.deleteMany({}),
    Coupon.deleteMany({}),
    Order.deleteMany({}),
    Cart.deleteMany({}),
    Wishlist.deleteMany({}),
    RefreshToken.deleteMany({}),
  ]);
  console.log('🗑  Cleared all collections');
};

const seed = async () => {
  await destroyAll();

  // ── Users ──────────────────────────────────────────────────────────
  const admin = await User.create({
    name: 'LUXE Admin',
    email: 'admin@luxe.com',
    password: 'Admin@123',
    role: 'admin',
    isVerified: true,
    phone: '+1 555 0100',
  });

  const customers = await User.create([
    { name: 'Ava Bennett', email: 'customer1@luxe.com', password: 'Customer@123', isVerified: true, phone: '+1 555 0201' },
    { name: 'Liam Carter', email: 'customer2@luxe.com', password: 'Customer@123', isVerified: true, phone: '+1 555 0202' },
    { name: 'Sofia Reyes', email: 'customer3@luxe.com', password: 'Customer@123', isVerified: true, phone: '+1 555 0203' },
    { name: 'Noah Whitfield', email: 'customer4@luxe.com', password: 'Customer@123', isVerified: true, phone: '+1 555 0204' },
    { name: 'Isabella Moreau', email: 'customer5@luxe.com', password: 'Customer@123', isVerified: true, phone: '+1 555 0205' },
    { name: 'Ethan Park', email: 'customer6@luxe.com', password: 'Customer@123', isVerified: true, phone: '+1 555 0206' },
  ]);

  // Give first customer a default address
  customers[0].addresses.push({
    label: 'Home',
    fullName: 'Ava Bennett',
    phone: '+1 555 0201',
    street: '128 Madison Avenue, Apt 4B',
    city: 'New York',
    state: 'NY',
    country: 'United States',
    zip: '10016',
    isDefault: true,
  });
  await customers[0].save();

  console.log(`👤 Created ${1 + customers.length} users`);

  // ── Categories ─────────────────────────────────────────────────────
  const categories = [];
  for (const c of categoryData) {
    // eslint-disable-next-line no-await-in-loop
    const cat = await Category.create({
      name: c.name,
      description: c.description,
      image: img(categoryImageIds[c.name][0]),
    });
    categories.push(cat);
  }
  console.log(`🏷  Created ${categories.length} categories`);

  // ── Products ───────────────────────────────────────────────────────
  const products = [];
  let counter = 0;
  // 100 products spread evenly across the 8 categories (~12-13 each).
  while (products.length < 100) {
    for (const cat of categories) {
      if (products.length >= 100) break;
      const pool = namePools[cat.name];
      // Per-category index (0,1,2…): the Nth product added to THIS category.
      const catIndex = Math.floor(counter / categories.length);
      // Distinct base name per product within a category (pools hold 14 names).
      const baseName = pool[catIndex % pool.length];
      const brand = BRANDS[rand(0, BRANDS.length - 1)];
      const name = `${brand} ${baseName}`;
      const [priceMin, priceMax] = priceRangeByCat[cat.name] || [45, 480];
      const price = rand(priceMin, priceMax);
      const hasDiscount = Math.random() > 0.45;
      const discountPrice = hasDiscount ? Math.round(price * (rand(60, 88) / 100)) : 0;

      // eslint-disable-next-line no-await-in-loop
      const product = await Product.create({
        name,
        description: descFor(baseName, brand, cat.name),
        shortDescription: `${baseName} in premium materials by ${brand}.`,
        price,
        discountPrice,
        category: cat._id,
        brand,
        images: galleryFor(cat.name, catIndex),
        stock: rand(0, 60),
        sold: rand(0, 220),
        sizes: ['Shoes'].includes(cat.name) ? ['38', '39', '40', '41', '42', '43'] : pick(SIZES, rand(3, 6)),
        colors: pick(COLORS, rand(2, 4)),
        tags: [cat.name.toLowerCase(), brand.toLowerCase(), 'luxe'],
        isFeatured: Math.random() > 0.7,
        isActive: true,
      });
      products.push(product);
      counter += 1;
    }
  }
  console.log(`🛍  Created ${products.length} products`);

  // ── Reviews ────────────────────────────────────────────────────────
  // Give (almost) every product several reviews from DISTINCT customers. The
  // unique (user, product) index means a product holds at most one review per
  // customer, so we sample distinct reviewers per product (max = # of customers).
  const reviewTitles = [
    'Exceptional quality', 'Worth every penny', 'Beautifully made', 'My new favorite',
    'Elegant and comfortable', 'Exceeded expectations', 'Instant wardrobe staple',
    'Looks even better in person', 'Great fit and finish', 'Would buy again',
    'Understated luxury', 'Impressed with the details',
  ];
  const reviewComments = [
    'The craftsmanship is outstanding and it fits perfectly. Highly recommend.',
    'Even better in person — the material feels luxurious and the finish is flawless.',
    'Shipping was fast and the product matches the photos exactly. Very happy.',
    'Elegant, versatile, and comfortable. I have already ordered another color.',
    'Great attention to detail. This has become a staple in my wardrobe.',
    'Premium feel without being flashy. Exactly the understated luxury I wanted.',
    'Runs true to size and the quality justifies the price. No complaints.',
    'Beautiful piece, though delivery took a little longer than I expected.',
    'Soft, well-made, and holds its shape after washing. Really pleased.',
    'I get compliments every time I wear it. Worth the investment.',
    'Good value for the quality — would happily recommend to a friend.',
    'Nice materials and a clean, modern cut. Exactly as described.',
  ];

  // Ratings skew positive (like a real catalog) but include the occasional low
  // score so the star-distribution bars on the product page look natural.
  const weightedRating = () => {
    const r = Math.random();
    if (r < 0.55) return 5;
    if (r < 0.82) return 4;
    if (r < 0.93) return 3;
    if (r < 0.98) return 2;
    return 1;
  };

  const reviewDocs = [];
  for (const product of products) {
    // ~88% of products get 2–6 reviews; the rest get 0–1 (e.g. new arrivals).
    const k = Math.random() < 0.12 ? rand(0, 1) : rand(2, 6);
    const reviewers = pick(customers, Math.min(k, customers.length)); // distinct users
    for (const user of reviewers) {
      reviewDocs.push({
        user: user._id,
        product: product._id,
        rating: weightedRating(),
        title: reviewTitles[rand(0, reviewTitles.length - 1)],
        comment: reviewComments[rand(0, reviewComments.length - 1)],
        isVerifiedPurchase: Math.random() > 0.35,
      });
    }
  }
  // insertMany skips per-document save hooks, so we recompute each product's
  // rating/numReviews ourselves afterwards — awaited, so it's guaranteed done
  // before the script exits (the model's post-save hook is fire-and-forget).
  await Review.insertMany(reviewDocs);
  const reviewedProductIds = [...new Set(reviewDocs.map((r) => String(r.product)))];
  for (const pid of reviewedProductIds) {
    // eslint-disable-next-line no-await-in-loop
    await Review.recalcProductRating(pid);
  }
  console.log(`⭐ Created ${reviewDocs.length} reviews across ${reviewedProductIds.length} products`);

  // ── Coupons ────────────────────────────────────────────────────────
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  await Coupon.create([
    { code: 'WELCOME10', type: 'percentage', value: 10, minOrderAmount: 0, maxDiscount: 100, usageLimit: 0, expiresAt: nextYear, isActive: true },
    { code: 'SAVE20', type: 'percentage', value: 20, minOrderAmount: 150, maxDiscount: 150, usageLimit: 0, expiresAt: nextYear, isActive: true },
    { code: 'FLAT50', type: 'fixed', value: 50, minOrderAmount: 200, usageLimit: 0, expiresAt: nextYear, isActive: true },
    { code: 'SPRING15', type: 'percentage', value: 15, minOrderAmount: 100, maxDiscount: 120, usageLimit: 0, expiresAt: nextYear, isActive: true },
    { code: 'VIP100', type: 'fixed', value: 100, minOrderAmount: 500, usageLimit: 0, expiresAt: nextYear, isActive: true },
  ]);
  console.log('🎟  Created 5 coupons');

  // ── Sample Orders ──────────────────────────────────────────────────
  // Orders are spread across the last 12 months and every lifecycle stage so
  // the admin dashboard (revenue trend, status doughnut, recent orders) and the
  // customer order-timeline all have realistic data to render.
  const cities = [
    { street: '128 Madison Avenue, Apt 4B', city: 'New York', state: 'NY', zip: '10016' },
    { street: '742 Valencia Street', city: 'San Francisco', state: 'CA', zip: '94110' },
    { street: '55 Newbury Street, Unit 9', city: 'Boston', state: 'MA', zip: '02116' },
    { street: '300 W Erie Street, Apt 12', city: 'Chicago', state: 'IL', zip: '60654' },
    { street: '1820 Brickell Avenue', city: 'Miami', state: 'FL', zip: '33129' },
    { street: '410 NW 12th Avenue', city: 'Portland', state: 'OR', zip: '97209' },
  ];

  // Explicit plan → guarantees every lifecycle stage appears (not left to chance),
  // in roughly realistic proportions (most orders complete, a few reversed).
  const statusPlan = [
    ...Array(13).fill('delivered'),
    ...Array(3).fill('returned'),
    ...Array(4).fill('cancelled'),
    ...Array(6).fill('shipped'),
    ...Array(5).fill('confirmed'),
    ...Array(5).fill('processing'),
  ];
  // Fisher–Yates shuffle so created-at order isn't grouped by status.
  for (let j = statusPlan.length - 1; j > 0; j -= 1) {
    const r = Math.floor(Math.random() * (j + 1));
    [statusPlan[j], statusPlan[r]] = [statusPlan[r], statusPlan[j]];
  }
  // How far back (in months) each stage tends to sit: completed orders are
  // older, open orders recent — while still spreading across the 12-month chart.
  const ageBucket = {
    delivered: [2, 11], returned: [4, 11], cancelled: [3, 11],
    shipped: [1, 3], confirmed: [0, 2], processing: [0, 1],
  };

  // Build a believable status timeline for each stage, timestamps stepping forward.
  const noteFor = {
    processing: 'Order placed',
    confirmed: 'Payment confirmed',
    shipped: 'Shipped via courier',
    delivered: 'Delivered to customer',
    cancelled: 'Cancelled by customer',
    returned: 'Return processed',
  };
  const chainFor = (status, start) => {
    const steps = {
      processing: ['processing'],
      confirmed: ['processing', 'confirmed'],
      shipped: ['processing', 'confirmed', 'shipped'],
      delivered: ['processing', 'confirmed', 'shipped', 'delivered'],
      cancelled: ['processing', 'cancelled'],
      returned: ['processing', 'confirmed', 'shipped', 'delivered', 'returned'],
    }[status];
    let t = start.getTime();
    return steps.map((s) => {
      const entry = { status: s, note: noteFor[s], timestamp: new Date(t) };
      t += rand(12, 48) * 3600 * 1000; // 0.5–2 days between steps
      return entry;
    });
  };

  const ORDER_COUNT = statusPlan.length;
  const orderStatusTally = {};
  for (let i = 0; i < ORDER_COUNT; i += 1) {
    const user = customers[rand(0, customers.length - 1)];
    const loc = cities[rand(0, cities.length - 1)];
    const sampleAddress = {
      fullName: user.name,
      phone: user.phone || '+1 555 0200',
      country: 'United States',
      ...loc,
    };

    const lineItems = pick(products, rand(1, 3)).map((p) => {
      const qty = rand(1, 3);
      const unit = p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price;
      return {
        product: p._id,
        name: p.name,
        image: p.images[0].url,
        price: p.price,
        discountPrice: p.discountPrice,
        size: p.sizes[0] || '',
        color: p.colors[0]?.name || '',
        quantity: qty,
        subtotal: Math.round(unit * qty * 100) / 100,
      };
    });
    const itemsTotal = Math.round(lineItems.reduce((s, it) => s + it.subtotal, 0) * 100) / 100;
    const shippingCost = itemsTotal >= 100 ? 0 : 9.99;
    const tax = Math.round(itemsTotal * 0.1 * 100) / 100;
    const totalAmount = Math.round((itemsTotal + shippingCost + tax) * 100) / 100;

    // Age each order by its lifecycle stage (completed = older, open = recent),
    // spread across the last 12 months so the revenue chart shows a full trend.
    const status = statusPlan[i];
    const [loMonth, hiMonth] = ageBucket[status];
    const monthsAgo = rand(loMonth, hiMonth);
    const orderDate = new Date();
    orderDate.setMonth(orderDate.getMonth() - monthsAgo);
    orderDate.setDate(rand(1, 27));
    orderDate.setHours(rand(8, 20), rand(0, 59), 0, 0);

    const method = ['card', 'paypal', 'cod'][rand(0, 2)];
    // Payment state follows the lifecycle: paid once fulfilled, refunded when
    // reversed, pending while a COD/processing order is still open.
    let paymentStatus;
    if (status === 'delivered' || status === 'shipped') paymentStatus = 'paid';
    else if (status === 'returned') paymentStatus = 'refunded';
    else if (status === 'cancelled') paymentStatus = method === 'cod' ? 'pending' : 'refunded';
    else if (status === 'confirmed') paymentStatus = method === 'cod' ? 'pending' : 'paid';
    else paymentStatus = 'pending'; // processing
    orderStatusTally[status] = (orderStatusTally[status] || 0) + 1;

    // eslint-disable-next-line no-await-in-loop
    const order = await Order.create({
      user: user._id,
      items: lineItems,
      shippingAddress: sampleAddress,
      paymentMethod: method,
      paymentStatus,
      orderStatus: status,
      statusHistory: chainFor(status, orderDate),
      itemsTotal,
      shippingCost,
      tax,
      totalAmount,
    });
    // Backdate createdAt. Mongoose makes `createdAt` immutable when timestamps
    // are enabled (and ignores one passed to create()), so we write it through
    // the native driver, which bypasses that immutability and all middleware.
    // eslint-disable-next-line no-await-in-loop
    await Order.collection.updateOne(
      { _id: order._id },
      { $set: { createdAt: orderDate } }
    );
  }
  console.log(`📦 Created ${ORDER_COUNT} orders →`, JSON.stringify(orderStatusTally));

  console.log('\n✅ Seed complete!');
  console.log('   Admin    → admin@luxe.com / Admin@123');
  console.log('   Customer → customer1@luxe.com / Customer@123');
};

const run = async () => {
  try {
    await connectDB();
    if (process.argv.includes('--destroy')) {
      await destroyAll();
    } else {
      await seed();
    }
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

run();
