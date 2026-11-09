import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';
import * as candidateService from '../service/candidate.service';

export const completeOnboarding = catchAsync(async (req: Request, res: Response) => {
  const candidate = await candidateService.completeOnboarding(req.user!.id, req.body, {
    resume: req.files && 'resume' in req.files ? req.files.resume?.[0] : undefined,
    photo: req.files && 'photo' in req.files ? req.files.photo?.[0] : undefined,
  });
  res.status(200).json({ success: true, data: candidate });
});

export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const profile = await candidateService.getProfile(req.user!.id);
  res.status(200).json({ success: true, data: profile });
});

export const getSavedJobs = catchAsync(async (req: Request, res: Response) => {
  const savedJobs = await candidateService.getSavedJobs(req.user!.id);
  res.status(200).json({ success: true, data: savedJobs });
});

export const saveJob = catchAsync(async (req: Request, res: Response) => {
  const savedJob = await candidateService.saveJob(req.user!.id, req.params.jobId as string);
  res.status(201).json({ success: true, data: savedJob });
});

export const removeSavedJob = catchAsync(async (req: Request, res: Response) => {
  await candidateService.removeSavedJob(req.user!.id, req.params.jobId as string);
  res.status(200).json({ success: true, message: 'Lowongan dihapus dari tersimpan' });
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const profile = await candidateService.updateProfile(req.user!.id, req.body);
  res.status(200).json({ success: true, data: profile });
});

export const addResume = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('Pilih file CV untuk diupload', 422);
  }
  const resume = await candidateService.addResume(req.user!.id, req.file);
  res.status(201).json({ success: true, data: resume });
});

export const setPrimaryResume = catchAsync(async (req: Request, res: Response) => {
  const resume = await candidateService.setPrimaryResume(
    req.user!.id,
    req.params.id as string
  );
  res.status(200).json({ success: true, data: resume });
});

export const removeResume = catchAsync(async (req: Request, res: Response) => {
  await candidateService.deleteResume(req.user!.id, req.params.id as string);
  res.status(200).json({ success: true, message: 'CV dihapus' });
});

export const downloadResume = catchAsync(async (req: Request, res: Response) => {
  const filePath = await candidateService.getResumePath(req.user!.id, req.params.id as string);
  res.sendFile(filePath);
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  await candidateService.changePassword(req.user!.id, req.user!.role, req.body);
  res.status(200).json({ success: true, message: 'Password berhasil diubah' });
});

export const addCertificate = catchAsync(async (req: Request, res: Response) => {
  const certificate = await candidateService.addCertificate(req.user!.id, req.body);
  res.status(201).json({ success: true, data: certificate });
});

export const updateCertificate = catchAsync(async (req: Request, res: Response) => {
  const certificate = await candidateService.updateCertificate(
    req.user!.id,
    req.params.id as string,
    req.body
  );
  res.status(200).json({ success: true, data: certificate });
});

export const getCertificates = catchAsync(async (req: Request, res: Response) => {
  const certificates = await candidateService.getCertificates(req.user!.id);
  res.status(200).json({ success: true, data: certificates });
});

export const deleteCertificate = catchAsync(async (req: Request, res: Response) => {
  await candidateService.deleteCertificate(req.user!.id, req.params.id as string);
  res.status(200).json({ success: true, message: 'Sertifikat dihapus' });
});

export const addExperience = catchAsync(async (req: Request, res: Response) => {
  const experience = await candidateService.addExperience(req.user!.id, req.body);
  res.status(201).json({ success: true, data: experience });
});

export const getExperiences = catchAsync(async (req: Request, res: Response) => {
  const experiences = await candidateService.getExperiences(req.user!.id);
  res.status(200).json({ success: true, data: experiences });
});

export const updateExperience = catchAsync(async (req: Request, res: Response) => {
  const experience = await candidateService.updateExperience(
    req.user!.id,
    req.params.id as string,
    req.body
  );
  res.status(200).json({ success: true, data: experience });
});

export const deleteExperience = catchAsync(async (req: Request, res: Response) => {
  await candidateService.deleteExperience(req.user!.id, req.params.id as string);
  res.status(200).json({ success: true, message: 'Pengalaman dihapus' });
});

export const uploadPhoto = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('File foto wajib diupload', 422);
  }
  const profile = await candidateService.uploadPhoto(req.user!.id, req.file);
  res.status(200).json({ success: true, data: profile });
});