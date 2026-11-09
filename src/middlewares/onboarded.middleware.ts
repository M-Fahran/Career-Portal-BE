import { Request, Response, NextFunction } from 'express';
import db from '../config/db';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';

export const requireOnboarded = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (req.user!.role !== 'candidate') {
      return next();
    }

    const candidate = await db.candidate.findUnique({
      where: { id: req.user!.id },
      select: { onboardedAt: true },
    });

    if (!candidate || !candidate.onboardedAt) {
      return next(new AppError('Lengkapi data diri Anda terlebih dahulu', 403));
    }

    next();
  }
);