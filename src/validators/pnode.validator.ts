import { z } from 'zod';

/**
 * Schema for batch pod accessibility check
 */
export const batchPodCheckSchema = z.object({
  endpoints: z
    .array(z.string())
    .min(1, 'At least one pod is required')
    .max(400, 'Maximum 400 pods can be checked at once'),
});

export type BatchPodCheckInput = z.infer<typeof batchPodCheckSchema>;

export const runCommandQueryCheckSchema = z.object({
    command: z.string(),
});

export const runCommandQueryParamCheckSchema = z.object({
    endpoint: z.string()
});

export const LeafQueryParamSchema = z.object({
    first_time: z.enum(["true", "false"]).optional().transform((opt) => {
        return opt === undefined ? opt : Boolean(opt);
    })
});
