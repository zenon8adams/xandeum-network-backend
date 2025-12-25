import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';
import { ConfigurationError } from '@/errors';

dotenv.config({ path: path.join(process.cwd(), '.env') });

/**
 * Environment variable schema using Zod
 * This validates and transforms environment variables at startup
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z
    .string()
    .default('3000')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val < 65536, {
      message: 'PORT must be between 1 and 65535',
    }),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('900000')
    .transform((val) => parseInt(val, 10)),
  RATE_LIMIT_MAX: z
    .string()
    .default('100')
    .transform((val) => parseInt(val, 10)),
  MONGODB_URI: z.string().url('MONGODB_URI must be a valid URL'),
  REFERENCE_PNODE_URL: z.string(),
  GENERATIVE_AI_API_KEY: z.string()
});

/**
 * Validate and parse environment variables
 * Throws an error if validation fails
 */
const validateEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    throw new ConfigurationError(
      'Environment validation failed. Check the error details above.'
    );
  }

  return result.data;
};

// Validate and extract typed environment variables
const env = validateEnv();

/**
 * Application configuration object
 * All environment variables should be accessed through this config object
 */
export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  apiPrefix: env.API_PREFIX,
  corsOrigin: env.CORS_ORIGIN,
  rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
  rateLimitMax: env.RATE_LIMIT_MAX,
  mongodbUri: env.MONGODB_URI,
  pnodeClusterApi: env.REFERENCE_PNODE_URL,
  generativeAiApiKey: env.GENERATIVE_AI_API_KEY
} as const;

export type Config = typeof config;
