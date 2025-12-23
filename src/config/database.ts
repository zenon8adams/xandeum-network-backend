import mongoose from 'mongoose';
import { logger } from '@/utils';
import { DatabaseError } from '@/errors';

let isConnected = false;

/**
 * Connect to MongoDB
 */
export const connectDB = async (): Promise<void> => {
  if (isConnected) {
    logger.info('MongoDB already connected');
    return;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    logger.warn('MONGODB_URI not set, skipping database connection');
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    isConnected = true;
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw new DatabaseError(
      'Failed to connect to MongoDB',
      'connect',
      error
    );
  }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectDB = async (): Promise<void> => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('MongoDB disconnect error:', error);
    throw new DatabaseError(
      'Failed to disconnect from MongoDB',
      'disconnect',
      error
    );
  }
};

/**
 * Check if MongoDB is connected
 */
export const isDBConnected = (): boolean => {
  return isConnected && mongoose.connection.readyState === 1;
};
