import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// ✅ রাউট ইমপোর্ট
import authRoutes from './routes/auth';
import pollRoutes from './routes/poll';
import userRoutes from './routes/users';
import contentRoutes from './routes/content';
import superadminRoutes from './routes/superadmin'; // নতুন রাউট

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

mongoose.connect(process.env.MONGO_URI as string)
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
app.use('/api', superadminRoutes);    // ✅ সুপারঅ্যাডমিনের সব রাউট এখানে

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});