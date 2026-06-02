const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validateMiddleware');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require('../controllers/couponController');

const router = express.Router();

router.post('/validate', protect, validateCoupon);

// Admin
router.use(protect, adminOnly);
router
  .route('/')
  .get(getCoupons)
  .post(
    [
      body('code').notEmpty().withMessage('Code is required'),
      body('type').isIn(['percentage', 'fixed']).withMessage('Invalid type'),
      body('value').isFloat({ min: 0 }).withMessage('Value must be a positive number'),
    ],
    validate,
    createCoupon
  );
router.route('/:id').put(updateCoupon).delete(deleteCoupon);

module.exports = router;
