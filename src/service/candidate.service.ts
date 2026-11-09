import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import db from '../config/db';
import AppError from '../utils/AppError';
import type { UpdateProfileInput, ChangePasswordInput, CreateCertificateInput, UpdateCertificateInput, CreateExperienceInput, UpdateExperienceInput, OnboardingInput } from '../validators/candidate.validator';

export const completeOnboarding = async (
  candidateId: string,
  data: OnboardingInput,
  files?: {
    resume?: Express.Multer.File;
    photo?: Express.Multer.File;
  }
) => {
  const candidate = await db.candidate.update({
    where: { id: candidateId },
    data: {
      fullName: data.fullName,
      phone: data.phone,
      birthDate: new Date(data.birthDate),
      gender: data.gender,
      province: data.province,
      city: data.city,
      address: data.address,

      educationLevel: data.educationLevel,
      institution: data.institution,
      major: data.major || null,
      graduationYear: data.graduationYear,

      noticePeriod: data.noticePeriod,
      ...(data.skills !== undefined ? { skills: data.skills } : {}),
      ...(data.languages !== undefined ? { languages: data.languages } : {}),

      linkedinUrl: data.linkedinUrl || null,
      portfolioUrl: data.portfolioUrl || null,
      photoUrl: files?.photo ? `/uploads/photos/${files.photo.filename}` : undefined,

      onboardedAt: new Date(),
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      gender: true,
      province: true,
      city: true,
      address: true,
      institution: true,
      major: true,
      graduationYear: true,
      educationLevel: true,
      noticePeriod: true,
      linkedinUrl: true,
      portfolioUrl: true,
      photoUrl: true,
      birthDate: true,
      createdAt: true,
      onboardedAt: true,
      skills: true,
      languages: true,
    },
  });

  if (files?.resume) {
    const resumeCount = await db.candidateResume.count({ where: { candidateId } });
    await db.candidateResume.create({
      data: {
        candidateId,
        fileUrl: files.resume.path,
        isPrimary: resumeCount === 0,
      },
    });
  }

  if (data.certificateName) {
    await db.candidateCertificate.create({
      data: {
        candidateId,
        name: data.certificateName,
        issuer: data.issuer ?? 'Tidak disebutkan',
        issueDate: data.issueDate ? new Date(data.issueDate) : null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        description: data.description ?? null,
      },
    });
  }

  if (Array.isArray(data.certificates) && data.certificates.length > 0) {
    await db.candidateCertificate.createMany({
      data: data.certificates.map((certificate) => ({
        candidateId,
        name: certificate.name,
        issuer: certificate.issuer,
        issueDate: certificate.issueDate ? new Date(certificate.issueDate) : null,
        expiryDate: certificate.expiryDate ? new Date(certificate.expiryDate) : null,
        description: certificate.description ?? null,
      })),
    });
  }

  if (Array.isArray(data.experiences) && data.experiences.length > 0) {
    await db.candidateExperience.createMany({
      data: data.experiences.map((experience) => ({
        candidateId,
        company: experience.company,
        position: experience.position,
        startDate: new Date(experience.startDate),
        endDate: experience.endDate ? new Date(experience.endDate) : null,
        description: experience.description ?? null,
      })),
    });
  }

  return candidate;
};

export const getProfile = async (candidateId: string) => {
  const candidate = await db.candidate.findUnique({
    where: { id: candidateId },
    include: {
      resumes: {
        orderBy: { uploadedAt: 'desc' },
      },
      certificates: {
        orderBy: { createdAt: 'desc' },
      },
      experiences: {
        orderBy: { startDate: 'desc' },
      },
    },
  });

  if (!candidate) {
    throw new AppError('Kandidat tidak ditemukan', 404);
  }

  const { passwordHash, ...candidateSafe } = candidate;
  return candidateSafe;
};

export const getSavedJobs = async (candidateId: string) => {
  return db.candidateSavedJob.findMany({
    where: { candidateId },
    include: {
      jobPosting: {
        select: {
          id: true,
          title: true,
          description: true,
          qualifications: true,
          employmentType: true,
          workMode: true,
          status: true,
          deadline: true,
          requiredSkills: true,
          createdAt: true,
          postedBy: { select: { name: true } },
          department: { select: { name: true } },
          category: { select: { name: true } },
        },
      },
    },
    orderBy: { savedAt: 'desc' },
  });
};

export const saveJob = async (candidateId: string, jobId: string) => {
  const job = await db.jobPosting.findUnique({
    where: { id: jobId },
    select: { id: true, status: true },
  });
  if (!job || job.status !== 'PUBLISHED') {
    throw new AppError('Lowongan tidak ditemukan', 404);
  }

  return db.candidateSavedJob.upsert({
    where: {
      candidateId_jobPostingId: { candidateId, jobPostingId: jobId },
    },
    update: {},
    create: { candidateId, jobPostingId: jobId },
  });
};

export const removeSavedJob = async (candidateId: string, jobId: string) => {
  const result = await db.candidateSavedJob.deleteMany({
    where: { candidateId, jobPostingId: jobId },
  });
  if (result.count === 0) {
    throw new AppError('Lowongan tersimpan tidak ditemukan', 404);
  }
};

export const updateProfile = async (
  candidateId: string,
  data: UpdateProfileInput
) => {
  const candidate = await db.candidate.findUnique({
    where: { id: candidateId },
  });

  if (!candidate) {
    throw new AppError('Kandidat tidak ditemukan', 404);
  }

  const updatedData: any = {};
  
  if (data.fullName) updatedData.fullName = data.fullName;
  if (data.phone !== undefined) updatedData.phone = data.phone || null;
  if (data.birthDate !== undefined) updatedData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
  if (data.gender !== undefined) updatedData.gender = data.gender || null;
  if (data.province !== undefined) updatedData.province = data.province || null;
  if (data.city !== undefined) updatedData.city = data.city || null;
  if (data.address !== undefined) updatedData.address = data.address || null;
  if (data.institution !== undefined) updatedData.institution = data.institution || null;
  if (data.major !== undefined) updatedData.major = data.major || null;
  if (data.graduationYear !== undefined) updatedData.graduationYear = data.graduationYear || null;
  if (data.linkedinUrl !== undefined) updatedData.linkedinUrl = data.linkedinUrl || null;
  if (data.portfolioUrl !== undefined) updatedData.portfolioUrl = data.portfolioUrl || null;
  if (data.summary !== undefined) updatedData.summary = data.summary || null;
  if (data.educationLevel !== undefined) updatedData.educationLevel = data.educationLevel || null;
  if (data.noticePeriod !== undefined) updatedData.noticePeriod = data.noticePeriod || null;
  if (data.skills !== undefined) updatedData.skills = data.skills;
  if (data.languages !== undefined) updatedData.languages = data.languages;

  const updated = await db.candidate.update({
    where: { id: candidateId },
    data: updatedData,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      gender: true,
      province: true,
      city: true,
      address: true,
      institution: true,
      major: true,
      graduationYear: true,
      educationLevel: true,
      noticePeriod: true,
      linkedinUrl: true,
      portfolioUrl: true,
      summary: true,
      photoUrl: true,
      birthDate: true,
      createdAt: true,
      onboardedAt: true,
      skills: true,
      languages: true,
    },
  });

  return updated;
};

export const addResume = async (
  candidateId: string,
  file: Express.Multer.File
) => {
  const resumeCount = await db.candidateResume.count({
    where: { candidateId },
  });

  return db.candidateResume.create({
    data: {
      candidateId,
      fileUrl: file.path,
      isPrimary: resumeCount === 0, 
    },
  });
};

export const setPrimaryResume = async (
  candidateId: string,
  resumeId: string
) => {
  const resume = await db.candidateResume.findUnique({ where: { id: resumeId } });
  if (!resume) throw new AppError('CV tidak ditemukan', 404);
  if (resume.candidateId !== candidateId) {
    throw new AppError('CV ini bukan milik kamu', 403);
  }

  await db.$transaction([
    db.candidateResume.updateMany({
      where: { candidateId },
      data: { isPrimary: false },
    }),
    db.candidateResume.update({
      where: { id: resumeId },
      data: { isPrimary: true },
    }),
  ]);

  return db.candidateResume.findUnique({ where: { id: resumeId } });
};

export const deleteResume = async (
  candidateId: string,
  resumeId: string
) => {
  const resume = await db.candidateResume.findUnique({ where: { id: resumeId } });
  if (!resume) throw new AppError('CV tidak ditemukan', 404);
  if (resume.candidateId !== candidateId) {
    throw new AppError('CV ini bukan milik kamu', 403);
  }

  const usedCount = await db.application.count({ where: { resumeId } });
  if (usedCount > 0) {
    throw new AppError('CV ini dipakai oleh lamaran dan tidak bisa dihapus', 409);
  }

  const replacement = resume.isPrimary
    ? await db.candidateResume.findFirst({
        where: { candidateId, id: { not: resumeId } },
        orderBy: { uploadedAt: 'desc' },
      })
    : null;

  await db.$transaction(async (tx) => {
    await tx.candidateResume.delete({ where: { id: resumeId } });
    if (replacement) {
      await tx.candidateResume.update({
        where: { id: replacement.id },
        data: { isPrimary: true },
      });
    }
  });

  if (fs.existsSync(resume.fileUrl)) {
    fs.unlinkSync(resume.fileUrl);
  }
};

export const getResumePath = async (candidateId: string, resumeId: string) => {
  const resume = await db.candidateResume.findUnique({ where: { id: resumeId } });
  if (!resume) throw new AppError('CV tidak ditemukan', 404);
  if (resume.candidateId !== candidateId) {
    throw new AppError('CV ini bukan milik kamu', 403);
  }
  if (!fs.existsSync(resume.fileUrl)) {
    throw new AppError('File CV tidak ditemukan di penyimpanan', 404);
  }
  return resume.fileUrl;
};

export const changePassword = async (
  userId: string,
  role: string,
  data: ChangePasswordInput
) => {
  const user =
    role === 'candidate'
      ? await db.candidate.findUnique({ where: { id: userId } })
      : await db.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError('User tidak ditemukan', 404);
  }

  const isCurrentValid = await bcrypt.compare(
    data.currentPassword,
    user.passwordHash
  );
  if (!isCurrentValid) {
    throw new AppError('Password saat ini salah', 401);
  }

  const newPasswordHash = await bcrypt.hash(data.newPassword, 10);

  if (role === 'candidate') {
    await db.candidate.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  } else {
    await db.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }
};

const ambilSertifikatMilikKandidat = async (candidateId: string, certificateId: string) => {
  const certificate = await db.candidateCertificate.findUnique({ where: { id: certificateId } });
  if (!certificate) {
    throw new AppError('Sertifikat tidak ditemukan', 404);
  }
  if (certificate.candidateId !== candidateId) {
    throw new AppError('Sertifikat ini bukan milik kamu', 403);
  }
  return certificate;
};

export const addCertificate = async (
  candidateId: string,
  data: CreateCertificateInput
) => {
  return db.candidateCertificate.create({
    data: {
      candidateId,
      name: data.name,
      issuer: data.issuer,
      issueDate: data.issueDate ? new Date(data.issueDate) : null,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      description: data.description,
    },
  });
};

export const updateCertificate = async (
  candidateId: string,
  certificateId: string,
  data: UpdateCertificateInput
) => {
  await ambilSertifikatMilikKandidat(candidateId, certificateId);
  return db.candidateCertificate.update({
    where: { id: certificateId },
    data: {
      name: data.name,
      issuer: data.issuer,
      issueDate: data.issueDate === undefined ? undefined : data.issueDate ? new Date(data.issueDate) : null,
      expiryDate: data.expiryDate === undefined ? undefined : data.expiryDate ? new Date(data.expiryDate) : null,
      description: data.description,
    },
  });
};

export const getCertificates = async (candidateId: string) => {
  return db.candidateCertificate.findMany({
    where: { candidateId },
    orderBy: { createdAt: 'desc' },
  });
};

export const deleteCertificate = async (candidateId: string, certificateId: string) => {
  await ambilSertifikatMilikKandidat(candidateId, certificateId);
  await db.candidateCertificate.delete({ where: { id: certificateId } });
};

export const addExperience = async (
  candidateId: string,
  data: CreateExperienceInput
) => {
  return db.candidateExperience.create({
    data: {
      candidateId,
      company: data.company,
      position: data.position,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      description: data.description,
    },
  });
};

export const getExperiences = async (candidateId: string) => {
  return db.candidateExperience.findMany({
    where: { candidateId },
    orderBy: { startDate: 'desc' },
  });
};

export const updateExperience = async (
  candidateId: string,
  expId: string,
  data: UpdateExperienceInput
) => {
  const exp = await db.candidateExperience.findUnique({ where: { id: expId } });
  if (!exp) {
    throw new AppError('Pengalaman tidak ditemukan', 404);
  }
  if (exp.candidateId !== candidateId) {
    throw new AppError('Pengalaman ini bukan milik kamu', 403);
  }
  return db.candidateExperience.update({
    where: { id: expId },
    data: {
      company: data.company,
      position: data.position,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      description: data.description,
    },
  });
};

export const deleteExperience = async (candidateId: string, expId: string) => {
  const exp = await db.candidateExperience.findUnique({ where: { id: expId } });
  if (!exp) {
    throw new AppError('Pengalaman tidak ditemukan', 404);
  }
  if (exp.candidateId !== candidateId) {
    throw new AppError('Pengalaman ini bukan milik kamu', 403);
  }
  await db.candidateExperience.delete({ where: { id: expId } });
};

export const uploadPhoto = async (
  candidateId: string,
  file: Express.Multer.File
) => {
  const photoUrl = `/uploads/photos/${file.filename}`;

  const candidate = await db.candidate.update({
    where: { id: candidateId },
    data: { photoUrl },
  });
  const { passwordHash: _ph, ...candidateSafe } = candidate;
  return candidateSafe;
};