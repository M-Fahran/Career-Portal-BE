import { z } from 'zod';
import db from '../config/db';
import { JobStatus } from '@prisma/client';
import AppError from '../utils/AppError';
import { jobQuerySchema, createJobSchema, updateJobSchema } from '../validators/job.validator';

export type JobQueryInput = z.infer<typeof jobQuerySchema>;
type CreateJobInput = z.infer<typeof createJobSchema>;
type UpdateJobInput = z.infer<typeof updateJobSchema>;

const normalizeSkills = (skills: string[]) => [...new Map(
  skills.map((name) => {
    const normalizedName = name.trim();
    return [normalizedName.toLocaleLowerCase(), normalizedName];
  })
).values()];

const buildJobWhere = (query: any) => {
  const where: any = {};
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.employmentType) where.employmentType = query.employmentType;
  if (query.workMode) where.workMode = query.workMode;
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  return where;
};

export const getCandidateJobs = async (query: any) => {
  const { page, limit } = query;
  const where = { ...buildJobWhere(query), status: 'PUBLISHED' as const };

  const total = await db.jobPosting.count({ where });
  const jobs = await db.jobPosting.findMany({
    where,
    include: {
      department: true,
      category: true,
      postedBy: { select: { name: true } },
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return { jobs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getCandidateJobById = async (id: string) => {
  const job = await db.jobPosting.findUnique({
    where: { id },
    include: {
      department: true,
      category: true,
      postedBy: { select: { name: true } },
    },
  });
  if (!job || job.status !== 'PUBLISHED') {
    throw new AppError('Lowongan tidak ditemukan', 404);
  }
  return job;
};

export const getAdminJobs = async (query: any) => {
  const { page, limit, status } = query;
  const where = buildJobWhere(query);
  if (status) where.status = status;

  const total = await db.jobPosting.count({ where });
  const jobs = await db.jobPosting.findMany({
    where,
    include: {
      department: true,
      category: true,
      postedBy: { select: { id: true, name: true } },
      _count: { select: { applications: true } },
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return { jobs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getAdminJobById = async (id: string) => {
  const job = await db.jobPosting.findUnique({
    where: { id },
    include: {
      department: true,
      category: true,
      postedBy: { select: { id: true, name: true, email: true } },
      _count: { select: { applications: true } },
    },
  });
  if (!job) throw new AppError('Lowongan tidak ditemukan', 404);
  return job;
};

export const createJobs = async (data: CreateJobInput, postedById: string) => {
  if (data.departmentId) {
    const department = await db.department.findUnique({
      where: { id: data.departmentId },
    });
    if (!department) {
      throw new AppError('Departemen tidak ditemukan', 404);
    }
  }

  if (data.categoryId) {
    const category = await db.jobCategory.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) {
      throw new AppError('Kategori tidak ditemukan', 404);
    }
  }

  const { requiredSkills, ...jobData } = data;
  const uniqueSkills = normalizeSkills(requiredSkills);
  const job = await db.jobPosting.create({
    data: {
      ...jobData,
      status: JobStatus.PUBLISHED,
      requiredSkills: uniqueSkills,
      deadline: new Date(data.deadline),
      postedById,
    },
    include: {
      department: true,
      category: true,
    },
  });

  return job;
}

export const updateJobs = async (id: string, data: UpdateJobInput) => {
  const existing = await db.jobPosting.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Lowongan tidak ditemukan', 404);
  }

  if (data.departmentId) {
    const dept = await db.department.findUnique({ where: { id: data.departmentId } });
    if (!dept) throw new AppError('Departemen tidak ditemukan', 404);
  }
  if (data.categoryId) {
    const cat = await db.jobCategory.findUnique({ where: { id: data.categoryId } });
    if (!cat) throw new AppError('Kategori tidak ditemukan', 404);
  }

  const { requiredSkills, deadline, ...jobData } = data;
  const uniqueSkills = requiredSkills === undefined
    ? undefined
    : normalizeSkills(requiredSkills);
  const job = await db.jobPosting.update({
    where: { id },
    data: {
      ...jobData,
      ...(uniqueSkills !== undefined ? { requiredSkills: uniqueSkills } : {}),
      ...(deadline ? { deadline: new Date(deadline) } : {}),
    },
  });
  return job;
};

export const deleteJobs = async (id: string) => {
  const existing = await db.jobPosting.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Lowongan tidak ditemukan', 404);
  }

  const applicantCount = await db.application.count({
    where: { jobPostingId: id },
  });
  if (applicantCount > 0) {
    throw new AppError(
      'Lowongan sudah memiliki pelamar, tidak bisa dihapus. Gunakan status CLOSED.',
      409
    );
  }

  await db.jobPosting.delete({ where: { id } });
};

export const changeJobStatus = async (id: string, status: JobStatus) => {
  const existing = await db.jobPosting.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Lowongan tidak ditemukan', 404);
  }

  const job = await db.jobPosting.update({
    where: { id },
    data: { status },
  });
  return job;
};