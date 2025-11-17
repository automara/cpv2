import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import aiRoutes from './routes/aiRoutes.js';
import moduleRoutes from './routes/moduleRoutes.js';
import webflowRoutes from './routes/webflowRoutes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5173', // Vite dev server
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// API Routes
app.use('/api/ai', aiRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/webflow', webflowRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '3.0.0',
  });
});

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'CurrentPrompt API',
    version: '3.0.0',
    description: 'Automated markdown publishing platform with AI-generated metadata',
    endpoints: {
      health: '/health',
      ai: {
        health: '/api/ai/health',
        process: '/api/ai/process',
        test: '/api/ai/test',
        estimate_cost: '/api/ai/estimate-cost',
      },
      modules: {
        create: 'POST /api/modules/create',
        upload: 'POST /api/modules/upload',
        list: 'GET /api/modules',
        get: 'GET /api/modules/:id',
        update: 'PATCH /api/modules/:id',
        delete: 'DELETE /api/modules/:id',
        search: 'POST /api/modules/search',
        stats: 'GET /api/modules/stats',
        versions: 'GET /api/modules/:id/versions',
        download: 'GET /api/modules/:id/download',
        files: 'GET /api/modules/:id/files',
      },
      webflow: {
        health: 'GET /api/webflow/health',
        sync: 'POST /api/webflow/sync/:id',
        sync_batch: 'POST /api/webflow/sync-batch',
        status: 'GET /api/webflow/status/:id',
        webhook: 'POST /api/webflow/webhook',
      },
    },
  });
});

// Serve frontend in production
if (NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendPath));

  // Catch-all route to serve frontend
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
      return res.sendFile(path.join(frontendPath, 'index.html'));
    }
    return res.status(404).json({ error: 'Not found' });
  });
}

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);

  return res.status(500).json({
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? err.message : 'An error occurred',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CurrentPrompt API v3.0.0`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`⏰ Started at ${new Date().toISOString()}`);
});

export default app;
