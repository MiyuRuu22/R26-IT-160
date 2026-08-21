const mongoose = require('mongoose');

// Prevent Mongoose from buffering queries indefinitely when disconnected
mongoose.set('bufferCommands', false);

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.warn('[WARNING] MONGO_URI is not defined. Running backend in disconnected/mock mode.');
            return;
        }
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 2500
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.warn(`[WARNING] MongoDB connection failed (${error.message}). Running backend in fallback/in-memory mode.`);
    }
};

module.exports = connectDB;
