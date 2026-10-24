import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { initDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import itemsRoutes from './routes/items.js';
import claimsRoutes from './routes/claims.js';
import messagesRoutes from './routes/messages.js';
import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js';
import aiRoutes from './routes/ai.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

initDB();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/', limiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/claims', claimsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Boomerang API is running' });
});

app.get('/api/categories', (req, res) => {
  res.json({
    categories: ['ID Card', 'Wallet', 'Electronics', 'Phone', 'Bottle', 'Calculator', 'Keys', 'Umbrella', 'Stationery', 'Bag', 'Eyewear', 'Documents', 'Jewelry', 'Clothing', 'Other']
  });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Boomerang Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
});
