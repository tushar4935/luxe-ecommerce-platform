const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

/** Ensure the user has a cart document, returning it (unpopulated). */
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

/** Populate + compute totals for the response shape. */
const populateCart = async (cartId) => {
  const cart = await Cart.findById(cartId).populate(
    'items.product',
    'name slug price discountPrice images stock sizes colors brand'
  );

  // Drop items whose product was deleted
  cart.items = cart.items.filter((i) => i.product);

  let subtotal = 0;
  cart.items.forEach((i) => {
    const price =
      i.product.discountPrice && i.product.discountPrice > 0
        ? i.product.discountPrice
        : i.product.price;
    subtotal += price * i.quantity;
  });

  return { cart, subtotal: Math.round(subtotal * 100) / 100 };
};

/** GET /api/cart */
const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const { cart: populated, subtotal } = await populateCart(cart._id);
  res.json({ success: true, cart: populated, subtotal });
});

/** POST /api/cart — add item */
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, size = '', color = '' } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, 'Product not found');
  if (product.stock < 1) throw new ApiError(400, 'Product is out of stock');

  const cart = await getOrCreateCart(req.user._id);

  // Merge with an existing identical line (same product/size/color)
  const existing = cart.items.find(
    (i) => i.product.toString() === productId && i.size === size && i.color === color
  );

  const desiredQty = (existing ? existing.quantity : 0) + Number(quantity);
  if (desiredQty > product.stock)
    throw new ApiError(400, `Only ${product.stock} item(s) in stock`);

  if (existing) {
    existing.quantity = desiredQty;
  } else {
    cart.items.push({ product: productId, quantity: Number(quantity), size, color });
  }

  await cart.save();
  const { cart: populated, subtotal } = await populateCart(cart._id);
  res.status(201).json({ success: true, message: 'Added to cart', cart: populated, subtotal });
});

/** PUT /api/cart/:itemId — update quantity / size / color */
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity, size, color } = req.body;
  const cart = await getOrCreateCart(req.user._id);

  const item = cart.items.id(req.params.itemId);
  if (!item) throw new ApiError(404, 'Cart item not found');

  if (quantity !== undefined) {
    const product = await Product.findById(item.product);
    if (!product) throw new ApiError(404, 'Product no longer available');
    if (quantity < 1) throw new ApiError(400, 'Quantity must be at least 1');
    if (quantity > product.stock) throw new ApiError(400, `Only ${product.stock} item(s) in stock`);
    item.quantity = quantity;
  }
  if (size !== undefined) item.size = size;
  if (color !== undefined) item.color = color;

  await cart.save();
  const { cart: populated, subtotal } = await populateCart(cart._id);
  res.json({ success: true, message: 'Cart updated', cart: populated, subtotal });
});

/** DELETE /api/cart/:itemId */
const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw new ApiError(404, 'Cart item not found');

  item.deleteOne();
  await cart.save();
  const { cart: populated, subtotal } = await populateCart(cart._id);
  res.json({ success: true, message: 'Item removed', cart: populated, subtotal });
});

/** DELETE /api/cart — clear */
const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  res.json({ success: true, message: 'Cart cleared', cart, subtotal: 0 });
});

/** POST /api/cart/sync — merge a guest cart into the server cart on login */
const syncCart = asyncHandler(async (req, res) => {
  const { items = [] } = req.body; // [{ productId, quantity, size, color }]
  const cart = await getOrCreateCart(req.user._id);

  for (const guest of items) {
    // eslint-disable-next-line no-await-in-loop
    const product = await Product.findById(guest.productId);
    if (!product || !product.isActive || product.stock < 1) continue;

    const existing = cart.items.find(
      (i) =>
        i.product.toString() === guest.productId &&
        i.size === (guest.size || '') &&
        i.color === (guest.color || '')
    );

    const merged = (existing ? existing.quantity : 0) + Number(guest.quantity || 1);
    const capped = Math.min(merged, product.stock);

    if (existing) {
      existing.quantity = capped;
    } else {
      cart.items.push({
        product: guest.productId,
        quantity: capped,
        size: guest.size || '',
        color: guest.color || '',
      });
    }
  }

  await cart.save();
  const { cart: populated, subtotal } = await populateCart(cart._id);
  res.json({ success: true, message: 'Cart synced', cart: populated, subtotal });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  syncCart,
  populateCart,
};
