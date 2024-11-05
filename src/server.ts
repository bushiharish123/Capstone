// server.ts

import express from 'express';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware to parse JSON bodies
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/uploads', express.static('uploads'));



// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
