const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI;
    if (!connStr) {
      console.error('CRITICAL: MONGODB_URI environment variable is missing.');
      process.exit(1);
    }

    // Obfuscate credentials for logging safety
    const safeConnStr = connStr.replace(/:([^@]+)@/, ':******@');
    console.log(`Connecting to database at ${safeConnStr}...`);

    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Do not crash server instantly in dev mode to allow fallback checking
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
