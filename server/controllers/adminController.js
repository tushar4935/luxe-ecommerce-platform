const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendEmail = require('../utils/sendEmail');

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * GET /api/admin/dashboard — headline stats + chart data.
 */
const getDashboard = asyncHandler(async (req, res) => {
  const today = startOfToday();

  // Revenue counts only paid / fulfilled orders (exclude cancelled)
  const paidMatch = { orderStatus: { $nin: ['cancelled', 'returned'] } };

  const [
    revenueAgg,
    ordersToday,
    newUsersToday,
    activeProducts,
    statusDistribution,
    topProducts,
    recentOrders,
  ] = await Promise.all([
    Order.aggregate([
      { $match: paidMatch },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
    Order.countDocuments({ createdAt: { $gte: today } }),
    User.countDocuments({ createdAt: { $gte: today } }),
    Product.countDocuments({ isActive: true }),
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
    Product.find({ isActive: true }).sort('-sold').limit(5).select('name sold price images ratings'),
    Order.find().sort('-createdAt').limit(10).populate('user', 'name email'),
  ]);

  // Revenue for the last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyAgg = await Order.aggregate([
    { $match: { ...paidMatch, createdAt: { $gte: twelveMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Build a continuous 12-month series (fill gaps with 0)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueChart = [];
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(twelveMonthsAgo);
    d.setMonth(d.getMonth() + i);
    const match = monthlyAgg.find(
      (m) => m._id.year === d.getFullYear() && m._id.month === d.getMonth() + 1
    );
    revenueChart.push({
      label: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      revenue: match ? Math.round(match.revenue * 100) / 100 : 0,
      orders: match ? match.orders : 0,
    });
  }

  res.json({
    success: true,
    stats: {
      totalRevenue: revenueAgg[0]?.total ? Math.round(revenueAgg[0].total * 100) / 100 : 0,
      totalOrders: revenueAgg[0]?.count || 0,
      ordersToday,
      newUsersToday,
      activeProducts,
    },
    revenueChart,
    statusDistribution: statusDistribution.map((s) => ({ status: s._id, count: s.count })),
    topProducts,
    recentOrders,
  });
});

/**
 * GET /api/admin/users — paginated list with search + role/status filter.
 */
const getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 12);

  const filter = {};
  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'inactive') filter.isActive = false;

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ success: true, total, page, pages: Math.ceil(total / limit), users });
});

/**
 * GET /api/admin/users/:id — user detail + order history.
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  const orders = await Order.find({ user: user._id }).sort('-createdAt').limit(20);
  const spentAgg = await Order.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId.createFromHexString(req.params.id),
        orderStatus: { $nin: ['cancelled', 'returned'] },
      },
    },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);

  res.json({
    success: true,
    user,
    orders,
    totalSpent: spentAgg[0]?.total ? Math.round(spentAgg[0].total * 100) / 100 : 0,
  });
});

/**
 * PUT /api/admin/users/:id/status — activate / deactivate.
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user._id.toString() === req.user._id.toString())
    throw new ApiError(400, 'You cannot change your own status');

  user.isActive = Boolean(req.body.isActive);
  await user.save();
  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
});

/**
 * GET /api/admin/orders — all orders with filters.
 */
const getAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 12);

  const filter = {};
  if (req.query.status) filter.orderStatus = req.query.status;
  if (req.query.user) filter.user = req.query.user;
  if (req.query.search) filter.orderNumber = new RegExp(req.query.search, 'i');
  if (req.query.startDate || req.query.endDate) {
    filter.createdAt = {};
    if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
    if (req.query.endDate) filter.createdAt.$lte = new Date(req.query.endDate);
  }

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('user', 'name email');

  res.json({ success: true, total, page, pages: Math.ceil(total / limit), orders });
});

/**
 * PUT /api/admin/orders/:id/status — update status + append history + email.
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const valid = ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];
  if (!valid.includes(status)) throw new ApiError(400, 'Invalid order status');

  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new ApiError(404, 'Order not found');

  order.orderStatus = status;
  if (status === 'delivered') order.paymentStatus = 'paid';
  order.statusHistory.push({ status, note: note || `Marked as ${status}`, timestamp: new Date() });
  await order.save();

  // Notify customer on shipped / delivered
  if (['shipped', 'delivered'].includes(status) && order.user?.email) {
    try {
      await sendEmail(order.user.email, 'orderStatus', {
        name: order.user.name,
        order,
        status,
      });
    } catch (err) {
      console.error('Status email failed:', err.message);
    }
  }

  res.json({ success: true, message: 'Order status updated', order });
});

/**
 * GET /api/admin/analytics/revenue?period=day|week|month
 */
const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const period = req.query.period || 'month';
  const formats = {
    day: '%Y-%m-%d',
    week: '%Y-W%V',
    month: '%Y-%m',
  };
  const format = formats[period] || formats.month;

  const data = await Order.aggregate([
    { $match: { orderStatus: { $nin: ['cancelled', 'returned'] } } },
    {
      $group: {
        _id: { $dateToString: { format, date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 30 },
  ]);

  res.json({
    success: true,
    period,
    data: data.map((d) => ({
      label: d._id,
      revenue: Math.round(d.revenue * 100) / 100,
      orders: d.orders,
    })),
  });
});

/**
 * GET /api/admin/analytics/products — top selling products chart data.
 */
const getProductAnalytics = asyncHandler(async (req, res) => {
  const top = await Product.find({ isActive: true })
    .sort('-sold')
    .limit(10)
    .select('name sold ratings price');

  res.json({
    success: true,
    data: top.map((p) => ({ name: p.name, sold: p.sold, revenue: p.sold * p.price })),
  });
});

module.exports = {
  getDashboard,
  getUsers,
  getUserById,
  updateUserStatus,
  getAllOrders,
  updateOrderStatus,
  getRevenueAnalytics,
  getProductAnalytics,
};
