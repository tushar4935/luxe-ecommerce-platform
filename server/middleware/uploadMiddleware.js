const multer = require('multer');
const ApiError = require('../utils/ApiError');

/**
 * In-memory storage so buffers can be streamed straight to Cloudinary
 * without touching disk. Limits: 5MB/file, images only.
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = upload;
