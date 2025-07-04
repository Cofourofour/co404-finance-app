import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import shiftRoutes from './routes/shifts';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.text({ limit: '50mb' }));

// Routes
app.use('/api', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/shifts', shiftRoutes);

// Health check
app.get('/api/hello', (req, res) => {
  res.json({ 
    message: 'Co404 Finance API with TypeScript is running! 🚀',
    version: '2.0.0-typescript',
    timestamp: new Date().toISOString(),
    routes: [
      'POST /api/login',
      'GET /api/me',
      'GET /api/transactions',
      'POST /api/transactions', 
      'POST /api/shifts/start',
      'GET /api/shifts/active',
      'POST /api/shifts/end'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Co404 Finance Server (TypeScript) running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/hello`);
  console.log(`🔐 Available endpoints:`);
  console.log(`   POST /api/login`);
  console.log(`   GET  /api/me`);
  console.log(`   GET  /api/transactions`);
  console.log(`   POST /api/transactions`);
  console.log(`   POST /api/shifts/start`);
  console.log(`   GET  /api/shifts/active`);
  console.log(`   POST /api/shifts/end`);
});

export default app;