const express = require('express');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getDashboard,
  getUsers,
  getUserById,
  updateUserStatus,
  getAllOrders,
  updateOrderStatus,
  getRevenueAnalytics,
  getProductAnalytics,
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect, adminOnly);

router.get('/dashboard', getDashboard);

router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/status', updateUserStatus);

router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

router.get('/analytics/revenue', getRevenueAnalytics);
router.get('/analytics/products', getProductAnalytics);

module.exports = router;
