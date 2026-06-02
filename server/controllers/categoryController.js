const Category = require('../models/Category');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { uploadBuffer, deleteAsset } = require('../config/cloudinary');

/** GET /api/categories — active categories with product counts. */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort('name').lean();

  // Attach product counts
  const counts = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = counts.reduce((acc, c) => {
    acc[c._id?.toString()] = c.count;
    return acc;
  }, {});

  const withCounts = categories.map((c) => ({
    ...c,
    productCount: countMap[c._id.toString()] || 0,
  }));

  res.json({ success: true, categories: withCounts });
});

/** GET /api/categories/:slug */
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true });
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, category });
});

/** POST /api/categories (admin) */
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, parent } = req.body;
  const data = { name, description, parent: parent || null };

  if (req.file) {
    data.image = await uploadBuffer(req.file.buffer, 'luxe/categories');
  }

  const category = await Category.create(data);
  res.status(201).json({ success: true, message: 'Category created', category });
});

/** PUT /api/categories/:id (admin) */
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');

  const { name, description, parent, isActive } = req.body;
  if (name !== undefined) category.name = name;
  if (description !== undefined) category.description = description;
  if (parent !== undefined) category.parent = parent || null;
  if (isActive !== undefined) category.isActive = isActive;

  if (req.file) {
    if (category.image?.public_id) await deleteAsset(category.image.public_id);
    category.image = await uploadBuffer(req.file.buffer, 'luxe/categories');
  }

  await category.save();
  res.json({ success: true, message: 'Category updated', category });
});

/** DELETE /api/categories/:id (admin) */
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');

  const inUse = await Product.countDocuments({ category: category._id, isActive: true });
  if (inUse > 0)
    throw new ApiError(409, `Cannot delete: ${inUse} active product(s) use this category`);

  if (category.image?.public_id) await deleteAsset(category.image.public_id);
  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted' });
});

module.exports = {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
