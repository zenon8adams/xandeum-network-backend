import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { config } from '@/config';
import { errorHandler, notFoundHandler } from '@/middleware';
import { morganStream } from '@/utils';
import routes from '@/routes';

/**
 * Create and configure Express application
 */
export const createApp = (): Express => {
  const app = express();

  // Trust proxy - required for rate limiting behind reverse proxies
  app.set('trust proxy', 1);

  // Security Middleware
  // Helmet helps secure Express apps by setting various HTTP headers
  app.use(helmet());

  // CORS Configuration
  if(config.corsOrigin) {
    app.use(
      cors({
        origin: config.corsOrigin,
        credentials: true,
      })
    );
  }

  // Body parsing Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Data sanitization against NoSQL query injection
  app.use(mongoSanitize());

  // Gzip compression
  app.use(compression() as any);

  // HTTP request logger
  if (config.nodeEnv === 'development') {
    app.use(morgan('dev', { stream: morganStream }));
  } else {
    app.use(morgan('combined', { stream: morganStream }));
  }

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiting to all API routes
  app.use(config.apiPrefix, limiter);

  // API Routes
  app.use(config.apiPrefix, routes);

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      status: 'success',
      message: 'Xandeum Network Backend API',
      version: '1.0.0',
      documentation: `${config.apiPrefix}/docs`,
    });
  });

  // Handle undefined routes - must be after all valid routes
  app.use(notFoundHandler);

  // Global error handler - must be last middleware
  app.use(errorHandler);

  return app;
};

/**
 * Export the app instance
 */
export default createApp();
