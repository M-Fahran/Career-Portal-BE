import { z } from 'zod';
import { EducationLevel, NoticePeriod, Gender } from '@prisma/client';

const experienceItemSchema = z.object({
  company: z.string().min(1, 'Nama perusahaan wajib diisi'),
  position: z.string().min(1, 'Posisi wajib diisi'),
  startDate: z.string().datetime('Format tanggal mulai pengalaman tidak valid'),
  endDate: z.string().datetime('Format tanggal selesai pengalaman tidak valid').optional(),
  description: z.string().optional(),
});

const certificateItemSchema = z.object({
  name: z.string().min(3, 'Nama sertifikat minimal 3 karakter'),
  issuer: z.string().min(2, 'Penerbit sertifikat wajib diisi'),
  issueDate: z.string().datetime('Format tanggal terbit tidak valid').optional(),
  expiryDate: z.string().datetime('Format tanggal kedaluwarsa tidak valid').optional(),
  description: z.string().max(2000, 'Deskripsi sertifikat maksimal 2000 karakter').optional(),
});

const stringArraySchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  if (!value.trim()) return [];

  try {
    return JSON.parse(value);
  } catch {
    return [value];
  }
}, z.array(z.string().trim().min(1)).optional());

export const onboardingSchema = z.object({
    fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
    phone: z.string().min(8, 'Nomor telepon minimal 8 karakter'),
    birthDate: z.string().datetime('Format tanggal lahir tidak valid'),
    gender: z.nativeEnum(Gender, { error: 'Jenis kelamin wajib dipilih' }),
    province: z.string().min(1, 'Provinsi wajib diisi'),
    city: z.string().min(1, 'Kota/Kabupaten wajib diisi'),
    address: z.string().min(1, 'Alamat detail wajib diisi'),
    educationLevel: z.nativeEnum(EducationLevel, { error: 'Jenjang pendidikan wajib dipilih' }),
    institution: z.string().min(1, 'Nama institusi wajib diisi'),
    graduationYear: z.string().min(4, 'Tahun lulus tidak valid').max(4, 'Tahun lulus tidak valid'),
    noticePeriod: z.nativeEnum(NoticePeriod, { error: 'Notice period wajib dipilih' }),
    certificateName: z.string().min(3, 'Nama sertifikat minimal 3 karakter').optional(),
    issuer: z.string().min(2, 'Penerbit sertifikat wajib diisi').optional(),
    issueDate: z.string().datetime('Format tanggal terbit tidak valid').optional(),
    expiryDate: z.string().datetime('Format tanggal kadaluarsa tidak valid').optional(),
    description: z.string().max(2000, 'Deskripsi sertifikat maksimal 2000 karakter').optional(),
    major: z.string().optional(),
    skills: stringArraySchema,
    languages: stringArraySchema,
    linkedinUrl: z.string().url('Format URL LinkedIn tidak valid').optional(),
    portfolioUrl: z.string().url('Format URL portofolio tidak valid').optional(),
    experiences: z.preprocess((value) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;
    }, z.array(experienceItemSchema).optional()).optional(),
    certificates: z.preprocess((value) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;
    }, z.array(certificateItemSchema).optional()).optional(),
  })
  .refine(
    (data) => {
      if (data.educationLevel === 'SMA') {
        return true;
      }
      return !!data.major && data.major.trim().length > 0;
    },
    {
      message: 'Jurusan/Program Studi wajib diisi untuk jenjang di atas SMA',
      path: ['major'],
    }
  );

export const updateProfileSchema = z.object({
  fullName: z.string().min(3).optional(),
  phone: z.union([z.string().min(8), z.literal('')]).optional(),
  birthDate: z.union([z.string().datetime(), z.literal('')]).optional(),
  gender: z.union([z.nativeEnum(Gender), z.literal('')]).optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  institution: z.string().optional(),
  major: z.string().optional(),
  skills: stringArraySchema,
  languages: stringArraySchema,
  graduationYear: z.union([z.string().min(4).max(4), z.literal('')]).optional(),
  linkedinUrl: z.union([z.string().url(), z.literal('')]).optional(),
  portfolioUrl: z.union([z.string().url(), z.literal('')]).optional(),
  summary: z.string().max(2000, 'Ringkasan maksimal 2000 karakter').optional(),
  educationLevel: z.union([z.nativeEnum(EducationLevel), z.literal('')]).optional(),
  noticePeriod: z.union([z.nativeEnum(NoticePeriod), z.literal('')]).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
  newPassword: z.string().min(8, 'Password baru minimal 8 karakter'),
});

export const createCertificateSchema = z.object({
  name: z.string().min(3, 'Nama sertifikat minimal 3 karakter'),
  issuer: z.string().min(2, 'Penerbit sertifikat wajib diisi'),
  issueDate: z.string().datetime('Format tanggal terbit tidak valid').optional(),
  expiryDate: z.string().datetime('Format tanggal kadaluarsa tidak valid').optional(),
  description: z.string().max(2000, 'Deskripsi sertifikat maksimal 2000 karakter').optional(),
});

export const updateCertificateSchema = createCertificateSchema.partial().extend({
  issueDate: z.union([z.string().datetime(), z.literal('')]).optional(),
  expiryDate: z.union([z.string().datetime(), z.literal('')]).optional(),
});

export const createExperienceSchema = z.object({
  company: z.string().min(1, 'Nama perusahaan wajib diisi'),
  position: z.string().min(1, 'Posisi wajib diisi'),
  startDate: z.string().datetime(),         
  endDate: z.string().datetime().optional(),
  description: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export type CreateCertificateInput = z.infer<typeof createCertificateSchema>;

export type UpdateCertificateInput = z.infer<typeof updateCertificateSchema>;

export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;

export const updateExperienceSchema = createExperienceSchema.partial();

export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;