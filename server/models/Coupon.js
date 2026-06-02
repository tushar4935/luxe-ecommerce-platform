const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 }, // 0 = no cap
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    expiresAt: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/**
 * Compute the discount this coupon yields for a given subtotal, and whether
 * it is currently usable. Pure helper used by cart/order/coupon controllers.
 */
couponSchema.methods.calculateDiscount = function calculateDiscount(subtotal, userId) {
  const now = new Date();

  if (!this.isActive) return { valid: false, message: 'Coupon is inactive', discount: 0 };
  if (this.expiresAt && this.expiresAt < now)
    return { valid: false, message: 'Coupon has expired', discount: 0 };
  if (this.usageLimit > 0 && this.usedCount >= this.usageLimit)
    return { valid: false, message: 'Coupon usage limit reached', discount: 0 };
  if (subtotal < this.minOrderAmount)
    return {
      valid: false,
      message: `Minimum order amount is $${this.minOrderAmount}`,
      discount: 0,
    };
  if (userId && this.usedBy.some((id) => id.toString() === userId.toString()))
    return { valid: false, message: 'You have already used this coupon', discount: 0 };

  let discount =
    this.type === 'percentage' ? (subtotal * this.value) / 100 : this.value;

  if (this.maxDiscount > 0) discount = Math.min(discount, this.maxDiscount);
  discount = Math.min(discount, subtotal); // never exceed subtotal
  discount = Math.round(discount * 100) / 100;

  return { valid: true, message: 'Coupon applied', discount };
};

module.exports = mongoose.model('Coupon', couponSchema);
