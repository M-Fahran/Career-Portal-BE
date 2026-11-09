import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import db from '../config/db';
import AppError from '../utils/AppError';
import type {
  CreateDepartmentInput,
  CreateUserInput,
  UpdateUserInput,
} from '../validators/user.validator';

export const createInternalUser = async (data: CreateUserInput) => {
  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError('Email sudah terdaftar', 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      isActive: true,
    },
  });

  const { passwordHash: _ph, ...userSafe } = user;
  return userSafe;
};

export const getInternalUsers = async () => {
  const users = await db.user.findMany({
    orderBy: { name: 'asc' },
  });

  // Buang passwordHash dari setiap baris
  return users.map(({ passwordHash: _ph, ...userSafe }) => userSafe);
};

export const getDepartments = async () => {
  const departments = await db.department.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      _count: { select: { jobPosting: true } },
    },
  });
  return departments.map(({ _count, ...department }) => ({
    ...department,
    jobCount: _count.jobPosting,
  }));
};

export const createDepartment = async (data: CreateDepartmentInput) => {
  const existing = await db.department.findFirst({
    where: { name: { equals: data.name, mode: 'insensitive' } },
    select: { id: true },
  });
  if (existing) {
    throw new AppError('Departemen dengan nama tersebut sudah ada.', 409);
  }

  try {
    const department = await db.department.create({
      data: { name: data.name },
      select: { id: true, name: true },
    });
    return { ...department, jobCount: 0 };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError('Departemen dengan nama tersebut sudah ada.', 409);
    }
    throw error;
  }
};

export const deleteDepartment = async (id: string) => {
  try {
    return await db.$transaction(async (transaction) => {
      const department = await transaction.department.findUnique({
        where: { id },
        select: {
          id: true,
          _count: { select: { jobPosting: true } },
        },
      });

      if (!department) {
        throw new AppError('Departemen tidak ditemukan.', 404);
      }
      if (department._count.jobPosting > 0) {
        throw new AppError('Departemen masih digunakan oleh lowongan dan tidak dapat dihapus.', 409);
      }

      await transaction.department.delete({ where: { id } });
      return { id: department.id };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw new AppError('Departemen masih digunakan oleh lowongan dan tidak dapat dihapus.', 409);
    }
    throw error;
  }
};

export const updateInternalUser = async (
  id: string,
  data: UpdateUserInput,
  requesterId: string
) => {
  const user = await db.user.findUnique({
    where: { id },
  });
  if (!user) {
    throw new AppError('User tidak ditemukan', 404);
  }

  if (data.isActive === false && id === requesterId) {
    throw new AppError('Tidak dapat menonaktifkan akun sendiri', 409);
  }

  const updated = await db.user.update({
    where: { id },
    data: {
      name: data.name,
      isActive: data.isActive,
    },
  });

  const { passwordHash: _ph, ...userSafe } = updated;
  return userSafe;
};