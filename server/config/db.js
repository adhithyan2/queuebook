const mongoose = require('mongoose');

const connectDB = async (attempt = 1) => {
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('<username>')) {
    console.warn('⚠️  MongoDB URI not configured. Server will run without database.');
    console.warn('   Set MONGODB_URI in .env to connect to MongoDB.');
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    const delay = Math.min(attempt * 2000, 15000);
    console.error(`MongoDB Error: ${error.message}`);
    console.warn(`⚠️  Connection failed (attempt ${attempt}). Retrying in ${delay / 1000}s...`);
    setTimeout(() => connectDB(attempt + 1), delay);
  }
};

module.exports = connectDB;
