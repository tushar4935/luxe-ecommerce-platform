const Coupon = require('../models/Coupon');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

/** POST /api/coupons/validate — public-ish (requires auth via route). */
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) throw new ApiError(400, 'Coupon code is required');

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) throw new ApiError(404, 'Invalid coupon code');

  const result = coupon.calculateDiscount(Number(subtotal) || 0, req.user?._id);
  if (!result.valid) throw new ApiError(400, result.message);

  res.json({
    success: true,
    message: result.message,
    discount: result.discount,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
  });
});

/** GET /api/coupons (admin) */
const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort('-createdAt');
  res.json({ success: true, coupons });
});

/** POST /api/coupons (admin) */
const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, message: 'Coupon created', coupon });
});

/** PUT /api/coupons/:id (admin) */
const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  res.json({ success: true, message: 'Coupon updated', coupon });
});

/** DELETE /api/coupons/:id (admin) */
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  res.json({ success: true, message: 'Coupon deleted' });
});

module.exports = { validateCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon };
