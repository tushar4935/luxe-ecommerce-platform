const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: '' },
    comment: { type: String, required: [true, 'Comment is required'] },
    images: [{ url: String }],
    isVerifiedPurchase: { type: Boolean, default: false },
    helpful: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// One review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

/**
 * Recalculate the parent product's aggregate rating + review count.
 * Called from post-save and post-remove hooks. Implemented as a static so
 * it can also be triggered manually (e.g. from the seed script).
 */
reviewSchema.statics.recalcProductRating = async function recalcProductRating(productId) {
  const Product = mongoose.model('Product');
  const stats = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratings: Math.round(stats[0].avgRating * 10) / 10,
      numReviews: stats[0].count,
    });
  } else {
    await Product.findByIdAndUpdate(productId, { ratings: 0, numReviews: 0 });
  }
};

reviewSchema.post('save', function afterSave(doc) {
  doc.constructor.recalcProductRating(doc.product);
});

// Handle deletion via findOneAndDelete / findByIdAndDelete
reviewSchema.post('findOneAndDelete', function afterDelete(doc) {
  if (doc) doc.constructor.recalcProductRating(doc.product);
});

// Handle deletion via doc.deleteOne()
reviewSchema.post('deleteOne', { document: true, query: false }, function afterDocDelete() {
  this.constructor.recalcProductRating(this.product);
});

module.exports = mongoose.model('Review', reviewSchema);
