import { z } from 'zod';
import { ValidationError } from '../middleware/validation.js';

export function validate<T>(schema: z.ZodSchema<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new ValidationError(result.error);
  }
  return result.data;
}
