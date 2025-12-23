import { z } from 'zod';

export const findBestLeafNodeEndpointSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required')
});
