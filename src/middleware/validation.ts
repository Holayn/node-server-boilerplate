import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export class ValidationError extends Error {
  readonly fieldErrors: Record<string, string[] | undefined>;
  readonly formErrors: string[];

  constructor(error: z.ZodError) {
    super('Validation failed');
    this.name = 'ValidationError';
    const flat = error.flatten();
    this.fieldErrors = flat.fieldErrors;
    this.formErrors = flat.formErrors;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function validationErrorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof ValidationError) {
    res.status(400).json({
      errors: {
        fieldErrors: err.fieldErrors,
        formErrors: err.formErrors,
      },
    });
    return;
  }
  next(err);
}
