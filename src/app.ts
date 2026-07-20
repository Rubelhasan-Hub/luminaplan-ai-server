import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import itineraryRoutes from './routes/itinerary';
import aiRoutes from './routes/ai';

// Load environment variables
dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Allow all origins for Vercel/local flexibility
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Global logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Root API Welcome Check
app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    message: 'Welcome to the LuminaPlan AI API',
    version: '1.0.0'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/ai', aiRoutes);

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({ message: `API Route not found: ${req.method} ${req.url}` });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Express Error Handler caught:', err);
  res.status(500).json({
    message: 'An internal server error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;
