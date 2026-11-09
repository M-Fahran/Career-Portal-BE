import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import * as applicationService from '../service/application.service';
import fs from 'node:fs';
import { ApplicationStatus } from '@prisma/client';
import AppError from "../utils/AppError";
import { z } from 'zod';

export const apply = catchAsync(async (req: Request, res: Response) => {
  const application = await applicationService.applyToJob(
    req.user!.id,
    req.params.id as string,
    req.body,
    req.file
  );

  res.status(201).json({
    success: true,
    message: 'Lamaran berhasil dikirim',
    data: application,
  });
});

export const myApplications = catchAsync(async (req: Request, res: Response) => {
  const applications = await applicationService.getMyApplications(req.user!.id);

  res.status(200).json({
    success: true,
    data: applications,
  });
});

export const applicants = catchAsync(async (req: Request, res: Response) => {
  const { status } = req.query as { status?: ApplicationStatus };
  const applications = await applicationService.getApplicants(
    req.params.id as string,
    status
  );

  res.status(200).json({ success: true, data: applications });
});

export const allApplicants = catchAsync(async (req: Request, res: Response) => {
  const { status } = req.query as { status?: ApplicationStatus };
  const applications = await applicationService.getAllApplicants(status);

  res.status(200).json({ success: true, data: applications });
});

export const applicantDetail = catchAsync(async (req: Request, res: Response) => {
  const application = await applicationService.getApplicantDetail(req.params.id as string);

  res.status(200).json({ success: true, data: application });
});

export const changeStatus = catchAsync(async (req: Request, res: Response) => {
  const updated = await applicationService.changeStatus(
    req.params.id as string,
    req.body,          // sudah divalidasi changeStatusSchema
    req.user!.id       // admin yang mengubah → audit trail
  );

  res.status(200).json({ success: true, data: updated });
});

export const downloadResume = catchAsync(async (req: Request, res: Response) => {
  const filePath = await applicationService.getResumePath(req.params.id as string);
  if (!fs.existsSync(filePath)) {
    throw new AppError('File tidak ditemukan di storage', 404);
  }

  res.sendFile(filePath);
});

export const applicantQuerySchema = z.object({
  status: z.nativeEnum(ApplicationStatus).optional(),
});

export const changeStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
  note: z.string().optional(),
});
