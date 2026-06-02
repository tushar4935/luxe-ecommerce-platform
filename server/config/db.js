const mongoose = require('mongoose');

/**
 * Connect to MongoDB. Exits the process on a hard failure so the
 * orchestrator (nodemon / PM2 / container) can restart cleanly.
 */
const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Modern mongoose (v7+) ignores the old useNewUrlParser/useUnifiedTopology
      // flags, so we only keep meaningful tuning options here.
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`✓ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`✗ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
