import db from '../config/db';
import AppError from '../utils/AppError';
import type { ApplyInput } from '../validators/application.validator';
import { ApplicationStatus, Prisma } from '@prisma/client';
import type { ChangeStatusInput } from '../validators/application.validator';

const createApplicationWithNotification = async (
  transaction: Prisma.TransactionClient,
  candidateId: string,
  job: { id: string; title: string; postedById: string },
  resumeId: string
) => {
  const application = await transaction.application.create({
    data: {
      candidateId,
      jobPostingId: job.id,
      resumeId,
      status: 'PROCESS',
    },
    include: { jobPosting: true },
  });

  await transaction.notification.create({
    data: {
      recipientId: job.postedById,
      applicationId: application.id,
      type: 'NEW_APPLICATION',
      message: `Ada lamaran baru untuk lowongan "${job.title}".`,
    },
  });

  return application;
};

export const applyToJob = async (
  candidateId: string,
  jobId: string,
  data: ApplyInput,
  file?: Express.Multer.File
) => {
  const job = await db.jobPosting.findUnique({ where: { id: jobId } });
  if (!job || job.status !== 'PUBLISHED') {
    throw new AppError('Lowongan tidak ditemukan', 404);
  }

  if (job.deadline && job.deadline < new Date()) {
    throw new AppError('Lowongan sudah melewati deadline', 409);
  }

  const alreadyApplied = await db.application.findFirst({
    where: { candidateId, jobPostingId: jobId },
  });
  if (alreadyApplied) {
    throw new AppError('Kamu sudah melamar lowongan ini', 409);
  }

  if (file) {
    return db.$transaction(async (tx) => {
      const resumeCount = await tx.candidateResume.count({
        where: { candidateId },
      });

      const newResume = await tx.candidateResume.create({
        data: {
          candidateId,
          fileUrl: file.path,
          isPrimary: resumeCount === 0,
        },
      });

      return createApplicationWithNotification(tx, candidateId, job, newResume.id);
    });
  }

  let resumeId: string;

  if (data.resumeId) {
    const saved = await db.candidateResume.findUnique({
      where: { id: data.resumeId },
    });
    if (!saved || saved.candidateId !== candidateId) {
      throw new AppError('CV tidak ditemukan atau bukan milik kamu', 403);
    }
    resumeId = saved.id;
  } else {
    const primary = await db.candidateResume.findFirst({
      where: { candidateId, isPrimary: true },
    });
    if (!primary) {
      throw new AppError('Upload CV atau pilih CV tersimpan', 422);
    }
    resumeId = primary.id;
  }

  const application = await db.$transaction((transaction) =>
    createApplicationWithNotification(transaction, candidateId, job, resumeId)
  );

  return application;
};

export const getMyApplications = async (candidateId: string) => {
  return db.application.findMany({
    where: { candidateId },
    select: {
      id: true,
      jobPostingId: true,
      status: true,
      appliedAt: true,
      jobPosting: {
        select: {
          id: true,
          title: true,
          employmentType: true,
          department: { select: { name: true } },
          category: { select: { name: true } },
        },
      },
    },
    orderBy: { appliedAt: 'desc' },
  });
};

export const getApplicants = async (jobId: string, status?: ApplicationStatus) => {
  const where: any = { jobPostingId: jobId };
  if (status) where.status = status;

  return db.application.findMany({
    where,
    include: { 
      candidate: {
        include: {
          certificates: true,
          experiences: true,
        },
      },
      resume: true,
    },
    orderBy: { appliedAt: 'desc' },
  });
};

export const getAllApplicants = async (status?: ApplicationStatus) => {
  return db.application.findMany({
    where: status ? { status } : undefined,
    include: {
      candidate: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          city: true,
          province: true,
          educationLevel: true,
          institution: true,
          major: true,
          graduationYear: true,
          skills: true,
        },
      },
      jobPosting: {
        include: {
          postedBy: { select: { name: true } },
          department: { select: { id: true, name: true } },
        },
      },
      resume: true,
    },
    orderBy: { appliedAt: 'desc' },
  });
};

export const getApplicantDetail = async (applicationId: string) => {
  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: {
      candidate: {
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
          linkedinUrl: true,
          portfolioUrl: true,
          birthDate: true,
          educationLevel: true,
          languages: true,
          skills: true,
          certificates: {
            orderBy: { createdAt: 'desc' },
          },
          experiences: {
            orderBy: { startDate: 'desc' },
          },
        },
      },
      jobPosting: {
        select: {
          id: true,
          title: true,
          description: true,
          qualifications: true,
          employmentType: true,
          workMode: true,
          requiredSkills: true,
          createdAt: true,
          deadline: true,
          postedBy: { select: { name: true } },
        },
      },
      resume: {
        select: {
          id: true,
          uploadedAt: true,
          isPrimary: true,
        },
      },
      statusHistories: {
        include: {
          changedBy: { select: { name: true } },
        },
        orderBy: { changedAt: 'desc' },
      },
    },
  });

  if (!application) {
    throw new AppError('Lamaran tidak ditemukan', 404);
  }

  return application;
};

export const changeStatus = async (
  applicationId: string,
  data: ChangeStatusInput,
  adminId: string
) => {
  const application = await db.application.findUnique({
    where: { id: applicationId },
  });
  if (!application) {
    throw new AppError('Lamaran tidak ditemukan', 404);
  }

  if (application.status === data.status) {
    throw new AppError('Status sudah sama', 409);
  }

  const [updated] = await db.$transaction([
    db.application.update({
      where: { id: applicationId },
      data: { status: data.status },
    }),
    db.applicationStatusHistory.create({
      data: {
        applicationId,
        oldStatus: application.status, 
        newStatus: data.status,
        changedById: adminId,
        note: data.note,
      },
    }),
  ]);

  return updated;
};

export const getResumePath = async (applicationId: string) => {
  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: { resume: true },
  });
  if (!application) {
    throw new AppError('Lamaran tidak ditemukan', 404);
  }
  return application.resume.fileUrl;
};