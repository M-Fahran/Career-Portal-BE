import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../config/db'
import env from '../config/env'
import AppError from '../utils/AppError'
import {
    generateAccessToken,
    generateRefreshToken,
    TokenPayload,
    TokenType,
} from '../utils/generateToken'

type RegisterInput = {
    email: string;
    password: string;
}

type LoginInput = {
    email: string;
    password: string;
}

export const register = async (data: RegisterInput) => {
    const existing = await db.candidate.findUnique({
        where: {email: data.email}, 
    });

    if (existing) {
        throw new AppError('Email sudah terdaftar', 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const candidate = await db.candidate.create({
        data: {
            email: data.email,
            passwordHash,
        },
    });

    const payload: TokenPayload = {id: candidate.id, role: 'candidate', type: 'candidate'};
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {candidate, accessToken, refreshToken}
}

export const login = async (data: LoginInput) => {
    const candidate = await db.candidate.findUnique({
        where: {email: data.email},
    });

    if (!candidate) {
        throw new AppError('Email salah', 401);
    }

    const isPasswordValid = await bcrypt.compare(
        data.password,
        candidate.passwordHash
    );

    if (!isPasswordValid) {
        throw new AppError('password salah', 401)
    }

    const payload: TokenPayload = {id: candidate.id, role: 'candidate', type: 'candidate'};
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {candidate, accessToken, refreshToken};
}

export const loginAdmin = async (data: LoginInput) => {
  const user = await db.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new AppError('Email atau password salah', 401);
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Email atau password salah', 401);
  }

  if (!user.isActive) {
    throw new AppError('Akun dinonaktifkan. Hubungi super admin.', 403);
  }

  const payload: TokenPayload = { id: user.id, role: 'user', type: 'user' };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return { user, accessToken, refreshToken };
};

export const getsProfile = async (candidateId: string) => {
    const candidate = await db.candidate.findUnique({
        where: {id: candidateId},
    });

    if (!candidate) {
        throw new AppError('Kandidat tidak ditemukan', 404);
    }

    return candidate;
};

const refreshByType = async (refreshToken: string, type: TokenType) => {
    try {
        const payload = jwt.verify(
            refreshToken,
            env.JWT_REFRESH_SECRET
        ) as TokenPayload;

        if (payload.type !== type) {
            throw new AppError('Token tidak cocok untuk akun ini', 401);
        }

        const newAccessToken = generateAccessToken({
            id: payload.id,
            role: payload.role,
            type: payload.type,
        });

        return { accessToken: newAccessToken };
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Session berakhir, silahkan login ulang', 401)
    }
};

export const refreshCandidate = async (refreshToken: string) => {
    return refreshByType(refreshToken, 'candidate');
};

export const refreshUser = async (refreshToken: string) => {
    return refreshByType(refreshToken, 'user');
};

export const refresh = async (refreshToken: string, type: TokenType) => {
    return refreshByType(refreshToken, type);
};

export const updateAdminProfile = async (
  userId: string,
  data: { name: string }
) => {
  const user = await db.user.update({
    where: { id: userId },
    data: { name: data.name },
  });

  const { passwordHash: _ph, ...userSafe } = user;
  return userSafe;
};

export const getAdminProfile = async (userId: string) => {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User tidak ditemukan', 404);
  }

  const { passwordHash: _ph, ...userSafe } = user;
  return userSafe;
};