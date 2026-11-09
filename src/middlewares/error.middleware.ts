import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err.name === 'MulterError') {
    const message =
      (err as any).code === 'LIMIT_FILE_SIZE'
        ? 'Ukuran file maksimal 5MB'
        : err.message;

    return res.status(422).json({
      success: false,
      message,
    });
  }
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message,
  });
};