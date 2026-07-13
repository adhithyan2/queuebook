const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('<username>')) {
    console.warn('⚠️  MongoDB URI not configured. Server will run without database.');
    console.warn('   Set MONGODB_URI in .env to connect to MongoDB.');
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    console.warn('⚠️  Server will continue without database connection.');
  }
};

module.exports = connectDB;
