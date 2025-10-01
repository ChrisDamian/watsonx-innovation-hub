import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { logger } from './utils/logger';
import { initializeDatabases, createSchemas } from './config/database';
import { watsonxService } from './config/watsonx';

// Import routes
import authRoutes from './routes/auth';
import moduleRoutes from './routes/modules';
import governanceRoutes from './routes/governance';
import datasetRoutes from './routes/datasets';
import modelRoutes from './routes/models';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const watsonxHealthy = await watsonxService.healthCheck();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          watsonx: watsonxHealthy ? 'healthy' : 'unhealthy',
          database: 'healthy' // Add actual DB health checks
        }
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        type: 'SYSTEM_ERROR',
        message: 'Service health check failed',
        timestamp: new Date()
      }
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/governance', governanceRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/models', modelRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info('Client connected:', socket.id);

  socket.on('join-module', (moduleId: string) => {
    socket.join(`module-${moduleId}`);
    logger.info(`Client ${socket.id} joined module ${moduleId}`);
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected:', socket.id);
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      type: 'SYSTEM_ERROR',
      message: error.message || 'An unexpected error occurred',
      timestamp: new Date()
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      type: 'SYSTEM_ERROR',
      message: `Route ${req.method} ${req.originalUrl} not found`,
      timestamp: new Date()
    }
  });
});

// Server initialization
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Initialize databases
    await initializeDatabases();
    await createSchemas();
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`Watsonx Innovation Hub server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

startServer();

export { io };