import { z } from 'zod';
import { ApplicationStatus } from '@prisma/client';


export const applySchema = z.object({
  resumeId: z.string().optional(),
});

export type ApplyInput = z.infer<typeof applySchema>;

export const applicantQuerySchema = z.object({
  status: z.nativeEnum(ApplicationStatus).optional(),
});

export const changeStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
  note: z.string().optional(),             
});

export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;