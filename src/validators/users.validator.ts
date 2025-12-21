import { z } from 'zod';

/**
 * Schema for creating a user
 */
export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
});

/**
 * Schema for updating a user
 */
export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  email: z.string().email('Valid email is required').optional(),
});

/**
 * Schema for user ID parameter
 */
export const userIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid user ID').transform(Number),
});

// Type exports for TypeScript
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
