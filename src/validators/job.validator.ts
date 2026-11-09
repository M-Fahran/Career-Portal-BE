import { z } from 'zod';
import { EmploymentType, WorkMode, JobStatus, EducationLevel } from '@prisma/client'; 

export const jobQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),

  categoryId: z.string().optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
  workMode: z.nativeEnum(WorkMode).optional(),

  search: z.string().optional(),
});

const baseJobSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  qualifications: z.array(z.nativeEnum(EducationLevel)).default([]),
  employmentType: z.nativeEnum(EmploymentType),
  workMode: z.nativeEnum(WorkMode).optional(),
  deadline: z.string().datetime(),
  departmentId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  requiredSkills: z.array(z.string().trim().min(1)).default([]),
});

export const createJobSchema = baseJobSchema;

export const adminJobQuerySchema = jobQuerySchema.extend({
  status: z.nativeEnum(JobStatus).optional(),
});

export const updateJobSchema = baseJobSchema.partial();
export const jobStatusSchema = z.object({
  status: z.nativeEnum(JobStatus),
});