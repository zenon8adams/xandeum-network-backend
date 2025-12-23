import { createServer, type Server } from 'http';
import app from './app';
import { config } from '@/config';
import { logger } from '@/utils';
import { connectDB, disconnectDB } from '@/config/database';
import MongoQueryMCP from '@/modules/generative/mcp';

// Create HTTP server
const server: Server = createServer(app);

/**
 * Start the server
 */
const startServer = async (): Promise<void> => {
  MongoQueryMCP.linkTools();
  
  await connectDB();
  await MongoQueryMCP.connect();

  server.listen(config.port, () => {
    logger.info(`🚀 Server is running on port ${config.port}`);
    logger.info(`📝 Environment: ${config.nodeEnv}`);
    logger.info(`🔗 API endpoint: http://localhost:${config.port}${config.apiPrefix}`);
  });
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  server.close(async (err: Error | undefined) => {
    if (err) {
      logger.error('Error during server shutdown:', err);
      process.exit(1);
    }

    logger.info('Server closed successfully');
    
    // Disconnect from MongoDB
    await disconnectDB();
    logger.info('Database connections closed');
    
    logger.info('Cleanup completed');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  // In production, you might want to shut down gracefully
  if (config.nodeEnv === 'production') {
    gracefulShutdown('UNHANDLED_REJECTION');
  }
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  
  // Always exit on uncaught exceptions
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

/**
 * Handle termination signals
 */
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
startServer();

export default server;
