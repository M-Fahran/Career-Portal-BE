import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import AppError from '../utils/AppError';

export const validate =
  (schema: ZodSchema, source: 'body' | 'query' = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    const data = source === 'body' ? req.body : req.query;

    const result = schema.safeParse(data);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const issuePath = firstIssue?.path?.length ? firstIssue.path.join('.') : 'unknown';

      console.error('[VALIDATION_ERROR]', {
        source,
        field: issuePath,
        message: firstIssue?.message,
        code: firstIssue?.code,
        issues: result.error.issues.map((issue) => ({
          field: issue.path.length ? issue.path.join('.') : 'unknown',
          message: issue.message,
          code: issue.code,
        })),
        payload: data,
      });

      return next(
        new AppError(
          `${firstIssue?.message ?? 'Invalid input'} at "${issuePath}"`,
          422
        )
      );
    }

    if (source === 'body') {
      req.body = result.data;
    } else {
      Object.defineProperty(req, 'query', {
        value: result.data,
        writable: true,
        configurable: true,
      });
    }

    next();
  };