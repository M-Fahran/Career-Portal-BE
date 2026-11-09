import z from "zod";

export const createUserSchema = z.object({
    name: z.string().min(3, 'Nama minimal 3 Karakter'),
    email: z.string().email('email tidak valid'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter').optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2, 'Nama departemen minimal 2 karakter').max(80, 'Nama departemen maksimal 80 karakter'),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;