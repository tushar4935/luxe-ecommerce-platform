const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String, // snapshot at time of order
    image: String,
    price: Number,
    discountPrice: Number,
    size: String,
    color: String,
    quantity: Number,
    subtotal: Number,
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: String,
    note: String,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderNumber: { type: String, unique: true, index: true },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      country: String,
      zip: String,
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'paypal', 'cod'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    // Gateway details (set when paid via Razorpay).
    paymentProvider: { type: String }, // e.g. 'razorpay'
    transactionId: String,
    razorpayOrderId: String,
    razorpayPaymentId: String,
    orderStatus: {
      type: String,
      enum: ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'processing',
      index: true,
    },
    statusHistory: [statusHistorySchema],
    couponCode: String,
    couponDiscount: { type: Number, default: 0 },
    itemsTotal: Number,
    shippingCost: Number,
    tax: Number,
    totalAmount: Number,
    notes: String,
  },
  { timestamps: true }
);

// Auto-generate a human-friendly orderNumber: ORD-YYYY-XXXXX
orderSchema.pre('save', async function generateOrderNumber(next) {
  if (this.orderNumber) return next();
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000); // 5 digits
  this.orderNumber = `ORD-${year}-${random}`;

  // Seed initial status history entry
  if (!this.statusHistory || this.statusHistory.length === 0) {
    this.statusHistory = [
      { status: this.orderStatus || 'processing', note: 'Order placed', timestamp: new Date() },
    ];
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
