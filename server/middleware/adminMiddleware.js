const { adminOnly } = require('./authMiddleware');

// Re-exported for clarity at the route layer: router.use(protect, admin)
module.exports = adminOnly;
