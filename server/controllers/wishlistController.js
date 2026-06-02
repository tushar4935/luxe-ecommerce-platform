const Wishlist = require('../models/Wishlist');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const getOrCreate = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) wishlist = await Wishlist.create({ user: userId, products: [] });
  return wishlist;
};

/** GET /api/wishlist */
const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreate(req.user._id);
  await wishlist.populate({
    path: 'products',
    select: 'name slug price discountPrice discountPercent images ratings numReviews brand category stock',
    populate: { path: 'category', select: 'name slug' },
  });
  // Filter out any products that were removed
  wishlist.products = wishlist.products.filter(Boolean);
  res.json({ success: true, wishlist });
});

/** POST /api/wishlist/:productId */
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const wishlist = await getOrCreate(req.user._id);
  if (wishlist.products.some((p) => p.toString() === productId)) {
    return res.json({ success: true, message: 'Already in wishlist', wishlist });
  }

  wishlist.products.push(productId);
  await wishlist.save();
  res.status(201).json({ success: true, message: 'Added to wishlist', wishlist });
});

/** DELETE /api/wishlist/:productId */
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const wishlist = await getOrCreate(req.user._id);
  wishlist.products = wishlist.products.filter((p) => p.toString() !== productId);
  await wishlist.save();
  res.json({ success: true, message: 'Removed from wishlist', wishlist });
});

/** POST /api/wishlist/move-to-cart/:productId */
const moveToCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { size = '', color = '', quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, 'Product not found');
  if (product.stock < 1) throw new ApiError(400, 'Product is out of stock');

  // Add to cart
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

  const existing = cart.items.find(
    (i) => i.product.toString() === productId && i.size === size && i.color === color
  );
  const desired = (existing ? existing.quantity : 0) + Number(quantity);
  const capped = Math.min(desired, product.stock);
  if (existing) existing.quantity = capped;
  else cart.items.push({ product: productId, quantity: capped, size, color });
  await cart.save();

  // Remove from wishlist
  const wishlist = await getOrCreate(req.user._id);
  wishlist.products = wishlist.products.filter((p) => p.toString() !== productId);
  await wishlist.save();

  res.json({ success: true, message: 'Moved to cart', wishlist });
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist, moveToCart };
