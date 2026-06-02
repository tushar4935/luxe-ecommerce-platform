const Product = require('../models/Product');
const Category = require('../models/Category');
const APIFeatures = require('../utils/apiFeatures');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { uploadBuffer, deleteAsset } = require('../config/cloudinary');

/**
 * GET /api/products
 * Search, filter, sort, paginate. Always scoped to active products.
 */
const getProducts = asyncHandler(async (req, res) => {
  const baseFilter = { isActive: true };

  // Build the filtered query for the page of results
  const features = new APIFeatures(Product.find(baseFilter), req.query)
    .search()
    .filter()
    .sort()
    .paginate();

  const products = await features.execute().populate('category', 'name slug');

  // Build a matching count query (same search+filter, no pagination)
  const countFeatures = new APIFeatures(Product.find(baseFilter), req.query).search().filter();
  const total = await countFeatures.execute().countDocuments();

  res.json({
    success: true,
    count: products.length,
    total,
    page: features.page,
    pages: Math.ceil(total / features.limit),
    products,
  });
});

/**
 * GET /api/products/featured
 */
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true, isFeatured: true })
    .sort('-createdAt')
    .limit(8)
    .populate('category', 'name slug');
  res.json({ success: true, products });
});

/**
 * GET /api/products/related/:id
 */
const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  const related = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
    isActive: true,
  })
    .limit(6)
    .populate('category', 'name slug');

  res.json({ success: true, products: related });
});

/**
 * GET /api/products/:slug
 */
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate(
    'category',
    'name slug'
  );
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, product });
});

/**
 * GET /api/products/id/:id  (admin) — fetch by id regardless of active state.
 */
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, product });
});

/**
 * POST /api/products  (admin) — create with up to 6 images.
 */
const createProduct = asyncHandler(async (req, res) => {
  const data = { ...req.body };

  // Parse JSON-encoded array fields coming from multipart form-data
  ['sizes', 'colors', 'tags'].forEach((key) => {
    if (typeof data[key] === 'string') {
      try {
        data[key] = JSON.parse(data[key]);
      } catch (_) {
        data[key] = data[key].split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
  });

  const category = await Category.findById(data.category);
  if (!category) throw new ApiError(400, 'Invalid category');

  // Upload images (multer field "images")
  const images = [];
  if (req.files && req.files.length) {
    for (const file of req.files.slice(0, 6)) {
      // eslint-disable-next-line no-await-in-loop
      const uploaded = await uploadBuffer(file.buffer, 'luxe/products');
      images.push(uploaded);
    }
  }
  if (images.length) data.images = images;

  const product = await Product.create(data);
  res.status(201).json({ success: true, message: 'Product created', product });
});

/**
 * PUT /api/products/:id  (admin)
 */
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  const data = { ...req.body };
  ['sizes', 'colors', 'tags'].forEach((key) => {
    if (typeof data[key] === 'string') {
      try {
        data[key] = JSON.parse(data[key]);
      } catch (_) {
        data[key] = data[key].split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
  });

  // Recalculate discountPercent + slug via instance save
  Object.assign(product, data);

  // Append any newly uploaded images
  if (req.files && req.files.length) {
    for (const file of req.files.slice(0, 6)) {
      // eslint-disable-next-line no-await-in-loop
      const uploaded = await uploadBuffer(file.buffer, 'luxe/products');
      product.images.push(uploaded);
    }
  }

  await product.save();
  res.json({ success: true, message: 'Product updated', product });
});

/**
 * DELETE /api/products/:id  (admin) — soft delete.
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  product.isActive = false;
  await product.save();
  res.json({ success: true, message: 'Product deactivated' });
});

/**
 * POST /api/products/:id/images  (admin) — add more images.
 */
const addProductImages = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  if (!req.files || !req.files.length) throw new ApiError(400, 'No images provided');

  for (const file of req.files) {
    // eslint-disable-next-line no-await-in-loop
    const uploaded = await uploadBuffer(file.buffer, 'luxe/products');
    product.images.push(uploaded);
  }
  await product.save();
  res.json({ success: true, message: 'Images added', images: product.images });
});

/**
 * DELETE /api/products/:id/images/:imageId  (admin)
 */
const deleteProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  const image = product.images.id(req.params.imageId);
  if (!image) throw new ApiError(404, 'Image not found');

  await deleteAsset(image.public_id);
  image.deleteOne();
  await product.save();
  res.json({ success: true, message: 'Image removed', images: product.images });
});

module.exports = {
  getProducts,
  getFeaturedProducts,
  getRelatedProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImages,
  deleteProductImage,
};
