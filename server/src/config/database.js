/**
 * database.js — MongoDB Connection
 *
 * Uses Mongoose to connect to MongoDB.
 * Exits process if connection fails on startup.
 * Logs connection events.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting to reconnect…');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected.');
});

module.exports = connectDB;
