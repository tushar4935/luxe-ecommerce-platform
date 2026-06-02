const mongoose = require('mongoose');
const slugify = require('slugify');

const colorSchema = new mongoose.Schema(
  {
    name: String,
    hex: String,
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: { type: String, unique: true, index: true },
    description: { type: String, default: '' },
    shortDescription: { type: String, default: '' },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: { type: Number, default: 0, min: 0 },
    discountPercent: { type: Number, default: 0 }, // auto-calculated
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    brand: { type: String, default: '', index: true },
    images: [
      {
        url: String,
        public_id: String,
      },
    ],
    stock: { type: Number, required: true, default: 0, min: 0 },
    sold: { type: Number, default: 0 },
    ratings: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    sizes: [String], // ['XS','S','M','L','XL','XXL']
    colors: [colorSchema],
    tags: [String],
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Text index for search across name / brand / description
productSchema.index({ name: 'text', brand: 'text', description: 'text', tags: 'text' });

// Auto-generate slug + calculate discountPercent
productSchema.pre('save', function preSave(next) {
  if (this.isModified('name')) {
    const base = slugify(this.name, { lower: true, strict: true });
    // append a short random suffix to keep slugs unique on duplicate names
    this.slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;
  }

  if (this.discountPrice && this.discountPrice > 0 && this.price > 0) {
    this.discountPercent = Math.round(((this.price - this.discountPrice) / this.price) * 100);
  } else {
    this.discountPercent = 0;
  }
  next();
});

productSchema.pre('findOneAndUpdate', function preUpdate(next) {
  const update = this.getUpdate();
  if (!update) return next();
  const price = update.price;
  const discountPrice = update.discountPrice;
  if (price !== undefined || discountPrice !== undefined) {
    // Best-effort recalculation when either changes via update
    if (price && discountPrice && discountPrice > 0) {
      update.discountPercent = Math.round(((price - discountPrice) / price) * 100);
    } else if (discountPrice === 0) {
      update.discountPercent = 0;
    }
    this.setUpdate(update);
  }
  next();
});

// Virtual: effective price actually charged
productSchema.virtual('effectivePrice').get(function effectivePrice() {
  return this.discountPrice && this.discountPrice > 0 ? this.discountPrice : this.price;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
