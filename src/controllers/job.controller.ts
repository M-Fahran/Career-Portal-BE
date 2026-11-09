import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import * as jobService from '../service/job.service';

export const create = catchAsync(async (req: Request, res: Response) => {
  const job = await jobService.createJobs(req.body, req.user!.id);
  res.status(201).json({ success: true, data: job });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const job = await jobService.updateJobs(req.params.id as string, req.body);
  res.status(200).json({ success: true, data: job });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await jobService.deleteJobs(req.params.id as string);
  res.status(200).json({ success: true, message: 'Lowongan dihapus' });
});

export const changeStatus = catchAsync(async (req: Request, res: Response) => {
  const job = await jobService.changeJobStatus(
    req.params.id as string,
    req.body.status
  );
  res.status(200).json({ success: true, data: job });
});

export const listCandidate = catchAsync(async (req: Request, res: Response) => {
  const data = await jobService.getCandidateJobs(req.query);
  res.status(200).json({ success: true, data });
});

export const detailCandidate = catchAsync(async (req: Request, res: Response) => {
  const job = await jobService.getCandidateJobById(req.params.id as string);
  res.status(200).json({ success: true, data: job });
});

export const listAdmin = catchAsync(async (req: Request, res: Response) => {
  const data = await jobService.getAdminJobs(req.query);
  res.status(200).json({ success: true, data });
});

export const detailAdmin = catchAsync(async (req: Request, res: Response) => {
  const job = await jobService.getAdminJobById(req.params.id as string);
  res.status(200).json({ success: true, data: job });
});