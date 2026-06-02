const cloudinary = require('cloudinary').v2;
const streamifier = require('stream');

/**
 * Cloudinary is configured lazily from env vars. When credentials are not
 * present (typical in local dev), `isConfigured` is false and the upload
 * helpers fall back to returning the original buffer as a data URL so the
 * rest of the app keeps working without a Cloudinary account.
 */
const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Upload a single in-memory file buffer to Cloudinary.
 * @param {Buffer} buffer   raw file buffer (from multer memoryStorage)
 * @param {string} folder   target folder in Cloudinary
 * @returns {Promise<{url: string, public_id: string}>}
 */
const uploadBuffer = (buffer, folder = 'luxe/products') => {
  if (!isConfigured) {
    // Dev fallback: no real upload. Return a deterministic placeholder.
    return Promise.resolve({
      url: `https://picsum.photos/seed/${Date.now()}/600/600`,
      public_id: `local_${Date.now()}`,
    });
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    streamifier.Readable.from(buffer).pipe(uploadStream);
  });
};

/**
 * Delete an asset by public_id. No-op when Cloudinary isn't configured.
 */
const deleteAsset = async (publicId) => {
  if (!isConfigured || !publicId || publicId.startsWith('local_')) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete failed:', err.message);
  }
};

module.exports = { cloudinary, isConfigured, uploadBuffer, deleteAsset };
