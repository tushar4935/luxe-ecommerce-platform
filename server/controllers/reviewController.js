const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * GET /api/reviews/product/:productId
 * Paginated reviews + a 1–5 rating distribution.
 */
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);

  const total = await Review.countDocuments({ product: productId });
  const reviews = await Review.find({ product: productId })
    .populate('user', 'name avatar')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);

  // Rating distribution { 5: n, 4: n, ... }
  const agg = await Review.aggregate([
    { $match: { product: require('mongoose').Types.ObjectId.createFromHexString(productId) } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  agg.forEach((d) => {
    distribution[d._id] = d.count;
  });

  res.json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    distribution,
    reviews,
  });
});

/**
 * GET /api/reviews  (admin) — all reviews, paginated, newest first.
 */
const getAllReviews = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 12);

  const filter = {};
  if (req.query.rating) filter.rating = Number(req.query.rating);

  const total = await Review.countDocuments(filter);
  const reviews = await Review.find(filter)
    .populate('user', 'name email avatar')
    .populate('product', 'name slug images')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ success: true, total, page, pages: Math.ceil(total / limit), reviews });
});

/**
 * POST /api/reviews/product/:productId
 */
const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, title, comment } = req.body;

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const existing = await Review.findOne({ user: req.user._id, product: productId });
  if (existing) throw new ApiError(409, 'You have already reviewed this product');

  // Verified purchase check
  const purchased = await Order.exists({
    user: req.user._id,
    'items.product': productId,
    orderStatus: { $in: ['delivered', 'shipped', 'confirmed'] },
  });

  const review = await Review.create({
    user: req.user._id,
    product: productId,
    rating,
    title,
    comment,
    isVerifiedPurchase: Boolean(purchased),
  });

  await review.populate('user', 'name avatar');
  res.status(201).json({ success: true, message: 'Review added', review });
});

/**
 * PUT /api/reviews/:id — edit own review
 */
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');
  if (review.user.toString() !== req.user._id.toString())
    throw new ApiError(403, 'Not authorized');

  const { rating, title, comment } = req.body;
  if (rating !== undefined) review.rating = rating;
  if (title !== undefined) review.title = title;
  if (comment !== undefined) review.comment = comment;

  await review.save(); // triggers rating recalculation
  res.json({ success: true, message: 'Review updated', review });
});

/**
 * DELETE /api/reviews/:id — delete own review (or admin)
 */
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
    throw new ApiError(403, 'Not authorized');

  await review.deleteOne(); // triggers rating recalculation
  res.json({ success: true, message: 'Review deleted' });
});

/**
 * POST /api/reviews/:id/helpful — toggle helpful vote
 */
const toggleHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');

  const uid = req.user._id.toString();
  const idx = review.helpful.findIndex((id) => id.toString() === uid);
  if (idx >= 0) review.helpful.splice(idx, 1);
  else review.helpful.push(req.user._id);

  await review.save();
  res.json({
    success: true,
    helpfulCount: review.helpful.length,
    marked: idx < 0,
  });
});

module.exports = {
  getProductReviews,
  getAllReviews,
  createReview,
  updateReview,
  deleteReview,
  toggleHelpful,
};
