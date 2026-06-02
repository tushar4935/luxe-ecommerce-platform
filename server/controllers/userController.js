const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { uploadBuffer, deleteAsset } = require('../config/cloudinary');

/** GET /api/users/me */
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

/** PUT /api/users/me — update name / phone / avatar */
const updateMe = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const user = await User.findById(req.user._id);

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;

  // Optional avatar upload (multipart field "avatar")
  if (req.file) {
    if (user.avatar?.public_id) await deleteAsset(user.avatar.public_id);
    const uploaded = await uploadBuffer(req.file.buffer, 'luxe/avatars');
    user.avatar = uploaded;
  }

  await user.save();
  res.json({ success: true, message: 'Profile updated', user });
});

/** PUT /api/users/me/password — requires current password */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    throw new ApiError(400, 'Current and new password are required');

  const user = await User.findById(req.user._id).select('+password');
  const match = await user.comparePassword(currentPassword);
  if (!match) throw new ApiError(401, 'Current password is incorrect');

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully' });
});

/** GET /api/users/me/addresses */
const getAddresses = asyncHandler(async (req, res) => {
  res.json({ success: true, addresses: req.user.addresses });
});

/** POST /api/users/me/addresses */
const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const newAddress = req.body;

  // First address becomes default automatically
  if (user.addresses.length === 0) newAddress.isDefault = true;

  // If marked default, clear other defaults
  if (newAddress.isDefault) {
    user.addresses.forEach((a) => {
      a.isDefault = false;
    });
  }

  user.addresses.push(newAddress);
  await user.save();
  res.status(201).json({ success: true, message: 'Address added', addresses: user.addresses });
});

/** PUT /api/users/me/addresses/:id */
const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.id);
  if (!address) throw new ApiError(404, 'Address not found');

  Object.assign(address, req.body);

  if (req.body.isDefault) {
    user.addresses.forEach((a) => {
      if (a._id.toString() !== req.params.id) a.isDefault = false;
    });
  }

  await user.save();
  res.json({ success: true, message: 'Address updated', addresses: user.addresses });
});

/** DELETE /api/users/me/addresses/:id */
const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.id);
  if (!address) throw new ApiError(404, 'Address not found');

  const wasDefault = address.isDefault;
  address.deleteOne();

  // Promote another address to default if needed
  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  res.json({ success: true, message: 'Address removed', addresses: user.addresses });
});

module.exports = {
  getMe,
  updateMe,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
};
