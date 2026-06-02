/**
 * Returns the price actually charged (discountPrice when present, else price).
 */
export const effectivePrice = (product) =>
  product?.discountPrice && product.discountPrice > 0 ? product.discountPrice : product?.price || 0;

/**
 * Percentage saved, rounded to a whole number. 0 when no discount.
 */
export const discountPercent = (product) => {
  if (!product?.discountPrice || product.discountPrice <= 0 || !product.price) return 0;
  return Math.round(((product.price - product.discountPrice) / product.price) * 100);
};

export const hasDiscount = (product) =>
  Boolean(product?.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price);

export default effectivePrice;
