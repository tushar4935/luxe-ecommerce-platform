const ApiError = require('./ApiError');

// Order pricing rules — kept here so the payment endpoint and order creation
// always compute the exact same amount.
const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_COST = 9.99;
const TAX_RATE = 0.1; // 10%

const round = (n) => Math.round(n * 100) / 100;

/**
 * Validate a populated cart and compute order line items + monetary totals.
 * Throws ApiError on unavailable products, insufficient stock, or an invalid coupon.
 *
 * @param {object} cart    - Cart doc with `items.product` populated
 * @param {object|null} coupon - Coupon doc (already looked up) or null
 * @param {ObjectId} userId - the buyer, used for per-user coupon validation
 */
const buildItemsAndTotals = (cart, coupon, userId) => {
  const items = [];
  let itemsTotal = 0;

  for (const ci of cart.items) {
    const product = ci.product;
    if (!product || !product.isActive)
      throw new ApiError(400, 'One or more products are no longer available');
    if (product.stock < ci.quantity)
      throw new ApiError(400, `Insufficient stock for "${product.name}" (${product.stock} left)`);

    const unitPrice =
      product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;
    const subtotal = round(unitPrice * ci.quantity);
    itemsTotal += subtotal;

    items.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0]?.url || '',
      price: product.price,
      discountPrice: product.discountPrice,
      size: ci.size,
      color: ci.color,
      quantity: ci.quantity,
      subtotal,
    });
  }
  itemsTotal = round(itemsTotal);

  let couponDiscount = 0;
  if (coupon) {
    const result = coupon.calculateDiscount(itemsTotal, userId);
    if (!result.valid) throw new ApiError(400, result.message);
    couponDiscount = result.discount;
  }

  const discountedSubtotal = round(itemsTotal - couponDiscount);
  const shippingCost = discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const tax = round(discountedSubtotal * TAX_RATE);
  const totalAmount = round(discountedSubtotal + shippingCost + tax);

  return { items, itemsTotal, couponDiscount, shippingCost, tax, totalAmount };
};

module.exports = {
  buildItemsAndTotals,
  round,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_COST,
  TAX_RATE,
};
