const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validateMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
} = require('../controllers/orderController');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getMyOrders)
  .post(
    [
      body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
      body('paymentMethod')
        .isIn(['card', 'paypal', 'cod'])
        .withMessage('Valid payment method is required'),
    ],
    validate,
    createOrder
  );

router.get('/:id', getOrderById);
router.post('/:id/cancel', cancelOrder);

module.exports = router;
