// backend/src/server.ts
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// ✅ রাউট ইমপোর্ট
import authRoutes from './routes/auth';
import pollRoutes from './routes/poll';
import userRoutes from './routes/users';
import contentRoutes from './routes/content';
import superadminRoutes from './routes/superadmin';
import superAuthRoutes from './routes/superadmin-auth'; // ✅ নতুন

dotenv.config();

const app = express();

// ==================== ✅ FIX: CORS Lockdown ====================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://yourdomain.com', // ← আপনার প্রোডাকশন ডোমেইন
  process.env.FRONTEND_URL || '',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Postman/curl-এর মতো origin-হীন request allow (উন্নয়নে)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

app.get('/', (req: Request, res: Response) => {
  res.send('Ekotaboddho B.P Backend is running! 🚀');
});

// API ROUTES
app.use('/api', authRoutes);
app.use('/api/poll', pollRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userRoutes);
app.use('/api', contentRoutes);
app.use('/api', superadminRoutes);
app.use('/api', superAuthRoutes); // ✅ সুপার অ্যাডমিন লগইন

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
