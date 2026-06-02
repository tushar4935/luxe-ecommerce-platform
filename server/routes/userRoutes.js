const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validateMiddleware');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  getMe,
  updateMe,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} = require('../controllers/userController');

const router = express.Router();

router.use(protect); // everything below requires auth

router.get('/me', getMe);
router.put('/me', upload.single('avatar'), updateMe);
router.put(
  '/me/password',
  [body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')],
  validate,
  changePassword
);

router
  .route('/me/addresses')
  .get(getAddresses)
  .post(
    [
      body('fullName').notEmpty().withMessage('Full name is required'),
      body('street').notEmpty().withMessage('Street is required'),
      body('city').notEmpty().withMessage('City is required'),
      body('country').notEmpty().withMessage('Country is required'),
    ],
    validate,
    addAddress
  );

router.route('/me/addresses/:id').put(updateAddress).delete(deleteAddress);

module.exports = router;
