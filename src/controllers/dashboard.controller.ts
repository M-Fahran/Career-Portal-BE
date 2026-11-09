import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import * as dashboardService from '../service/dashboard.service';

export const stats = catchAsync(async (_req: Request, res: Response) => {
  const data = await dashboardService.getStats();

  res.status(200).json({ success: true, data });
});